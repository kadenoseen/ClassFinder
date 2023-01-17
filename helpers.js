// Description: This file contain the helper code for the Discord bot to manage the class channels
// Author: Kaden

// Import necessary modules
const Discord = require('discord.js');

// Import the OpenAI SDK
const { Configuration, OpenAIApi } = require("openai");

/**
 * Add the member to channels that are specific to the classes they are in
 * @param {Discord.GuildMember} member - The member to add to the classes
 * @param {boolean} newUser - true if this is the first time the member is joining the server, false otherwise
 */
async function addClasses(member, client, newUser) {
    // message filter function
    const filter = m => m.author.id === member.id;
    // creates a new channel for the member
    member.guild.channels.create({
        name: `${member.displayName}-classes`, // name of the channel will be member's displayName + "-classes"
        type: Discord.ChannelType.GuildText, // the channel type is text
        permissionOverwrites: [
            {
            id: member.id, // give the member permissions to view and send messages in the channel
            allow: ['ViewChannel', 'SendMessages']
            },
            {
            id: member.guild.id, // deny permissions for other members to view the channel
            deny: ['ViewChannel']
            }
        ]
    })
    .then(async channel => {
        // check if the member is new or returning
        if(newUser) {
            channel.send(`Welcome to the server, ${member}!`);
            channel.send(`How many classes are you in? (Enter a value from 1-10)`);
        } else {
            channel.send(`Welcome back, ${member}!`);
            channel.send(`How many classes would you like to join? (Enter a value from 1-10)`);
        } 
        // Define variable to store the number of classes the member is in
        let numClasses;
        // Keep looping until a valid number is received
        while(!isValidNumber(numClasses)) {
            // Wait for the user to send a message that passes the filter function, which only allows messages from the current user
            numClasses = await channel.awaitMessages({filter, max: 1, time: 60_000}).then(collected => {
                // return the content of the first message that passed the filter
                return collected.first().content;
            }).catch(async err => {
                // if no message was received within the time limit
                channel.send('No response received.');
                // return 0, so the while loop continues
                return 0;
            });
            // If the input is not a valid number
            if(!isValidNumber(numClasses)) {
                channel.send('Invalid input. Please enter a value from 0-10.');
            }
        }
        let timedOut = false;
        // ask for each class the member is in
        for (let i = 1; i <= numClasses; i++) {
            // ask for the name of class number i
            channel.send(`What is the name of class number ${i}? Make sure it is in the format "cs1026"`);
            // wait for user's response and store the class name
            const className = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                if(collected.size > 0){
                    return collected.first().content;
                }else{
                    return null;
                }
                
            });
            if(className){
                // format the class name using the formatInput() function
                const classNameFiltered = formatInput(className);
                // check if a category with the same name as the class already exists
                let classCategory = member.guild.channels.cache.find(channel => channel.name === classNameFiltered && channel.type === Discord.ChannelType.GuildCategory);
                
                if (classCategory) {
                    // if the category already exists, add the member to the category
                    await joinClass(member, client, classCategory.id);
                    // send a message to the member telling them they have been added to the category
                    channel.send(`You have been added to ${classCategory.name}!`);
                } else {
                    // if the channel does not exist, ask the member if they would like to create it
                    channel.send(`There is no group yet for ${classNameFiltered}. Would you like me to create it now? (y/n)`);
                    // wait for user's response
                    const answer = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                        if(collected.size > 0){
                            return collected.first().content;
                        }else{
                            return null;
                        }
                    });
                    if (answer){
                        if (answer.toLowerCase() === 'y') {
                            // if the member wants to create the channel, create the channel with the same name as the class
                            const newCategory = await createNewCategory(member, classNameFiltered);
                            // add the member to the channel
                            channel.send(`${classNameFiltered} has been created and you have been added!`);
                        }
                    }
                    else{
                        channel.send('No response received.');
                        timedOut = true;
                        break;
                    }
                }
            }
            else {
                channel.send('No response received.');
                timedOut = true;
                break;
            }
        }
        // if the member has joined at least 1 class and didn't timeout, send a message telling them they have been added to all their classes
        if (numClasses > 0 && timedOut === false) {
            channel.send(`You have now been added to all of your classes!`);
        }
        // delete the private channel
        await deleteChannel(channel);
    })
}

/**
 * createNewCategory is a function that creates a new category, discussion channel, questions channel, and resources channel in a discord server. 
 * The function returns the new category that was created.
 * 
 * @param {Discord.GuildMember} member The discord guild member that requested the category creation
 * @param {string} classNameFiltered The class name that the category and channels will be named after
 * @returns {Promise<Discord.GuildChannel>} The new category created
 */
async function createNewCategory(member, classNameFiltered) {
    // Create a new category with the classNameFiltered as the name
    const newCategory = await member.guild.channels.create({
        name: `${classNameFiltered}`,
        type: Discord.ChannelType.GuildCategory,
        permissionOverwrites: [
            {
            id: member.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            },
            {
            id: member.guild.id,
            deny: ['ViewChannel']
            }
        ]
    });
    className = classNameFiltered.replace(/\s/g, "");

    // Create a new discussion channel within the new category
    const newDiscussionChannel = await member.guild.channels.create({
        name: `💬｜${className}-discussion`, 
        type: Discord.ChannelType.GuildText,
        parent: newCategory,
    });
    let msg = await newDiscussionChannel.send(`Welcome to ${className}! This is the general discussion channel for the class.`);
    await msg.pin();
    // Create a new questions channel within the new category
    const newQuestionsChannel = await member.guild.channels.create({
        name: `❓｜${className}-questions`, 
        type: Discord.ChannelType.GuildText,
        parent: newCategory,
    });
    msg = await newQuestionsChannel.send(`Welcome to ${className}! This is the questions channel for the class.`);
    await msg.pin();
    // Create a new resources channel within the new category
    const newResourcesChannel = await member.guild.channels.create({
        name: `📚｜${className}-resources`,
        type: Discord.ChannelType.GuildText,
        parent: newCategory,
    });
    msg = await newResourcesChannel.send(`Welcome to ${className}! This is the resources channel for the class.`);
    await msg.pin();
    // Return the new category that was created
    return newCategory;
}


/**
 * Function to add a user to a class channel and give them permission to view messages, send messages, and read message history
 * @param {Discord.GuildMember} member - The member to add to the class channel
 * @param {Discord.Client} client - The client object for the bot
 * @param {string} categoryId - The ID of the class category channel
 */
async function joinClass(member, client, categoryId) {
    // Get the children of the category channel
    const children = await getChildrenOfCategory(client, categoryId);
    // Iterate through each child channel
    for(const child of children) {
        // Edit the permissionOverwrites of the child channel to give the member permission to view, send, and read message history
        await client.channels.cache.get(child.id).edit({ permissionOverwrites: [
            {
            id: member.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            }
        ]});
    }
}


/**
 * Removes a user's permissions to view, send messages, and read message history in all the child channels of a given category channel.
 * @param {GuildMember} member - The Discord.js GuildMember object of the user to remove from the class.
 * @param {Client} client - The Discord.js Client object used to interact with the Discord API.
 * @param {GuildChannel} channel - The Discord.js GuildChannel object of the category channel that the user is being removed from.
 */
async function leaveClass(member, client, channel) {
    // Get the child channels of the given category channel
    const children = await getChildrenOfCategory(client, channel.parentId);
    // Iterate through each child channel
    for(const child of children) {
        // Edit the channel's permissionOverwrites to deny the user ViewChannel, SendMessages, and ReadMessageHistory permissions
        await client.channels.cache.get(child.id).edit({ permissionOverwrites: [
            {
            id: member.id,
            deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            }
        ]});
    }
}

/**
 * Function that gets the children of a given category in a discord server
 * 
 * @param {Object} client The discord.js client object
 * @param {String} categoryId The id of the category to get the children from
 * @return {Array} An array of channel objects that are the children of the given category
 */
async function getChildrenOfCategory(client, categoryId) {
    // Get the server object
    const server = await client.guilds.cache.get('1064401956744998973');
    // Use filter() and first() to return an array containing the first 3 children of the category
    return await server.channels.cache.filter(c => c.parentId === categoryId).first(3);
}


/**
 * Deletes a given channel after 15 seconds
 * @param {Discord.TextChannel} channel - The channel to delete
 */
async function deleteChannel(channel, timeout=10000, msg=true) {
    count = timeout / 1000;
    // send a message to the channel that it will be deleted in timeout / 1000 seconds
    if (msg) channel.send(`Channel deleting in ${timeout / 1000} seconds...`);
    // delete channel after 15 seconds
    setTimeout(() => {
        // delete the channel
        channel.delete()
            .catch(console.error);
    }, timeout);
}

/**
 * Deletes the given category channel and all its child channels.
 * @param {Discord.TextChannel} channel - The category channel to be deleted
 * @param {Discord.Client} client - The Discord client instance
 * @param {number} timeout - The time in milliseconds before deletion (default 5000)
 */
async function deleteCategory(channel, client, timeout=5000) {
    // Get the child channels of the given category channel
    const children = await getChildrenOfCategory(client, channel.parentId);
    // Iterate through each child channel
    for(const child of children) {
        // Delete the channel
        c = await client.channels.cache.get(child.id);
        await deleteChannel(c, timeout);
    }
    // Delete the category channel
    const cat = await client.channels.cache.get(channel.parentId);
    await deleteChannel(cat, timeout, false);
}



/**
 * Formats the given input to separate letters and numbers with a "-"
 * @param {string} input - The input to format
 * @returns {string} - The formatted input
 */
function formatInput(input) {
    // Initialize variables to store the letters and numbers
    let letters = "";
    let numbers = "";
    // Iterate through each character of the input
    for (let i = 0; i < input.length; i++) {
        // Check if the character is a letter
        if (isNaN(input[i])) {
            letters += input[i].toUpperCase();
        } else {
            numbers += input[i];
        }
    }
    // Return the input with letters and numbers separated by a "-"
    return letters + " " + numbers;
}


/**
 * Checks if a given value is a valid number within a given range
 * @param {string | number} value - The value to check
 * @param {number} [min=0] - The minimum value in the range (inclusive)
 * @param {number} [max=10] - The maximum value in the range (inclusive)
 * @returns {boolean} - Returns true if the value is a valid number within the range, false otherwise
 */
function isValidNumber(num) {
    //parse input to number if it's a string
    if(typeof num === "string"){
        num = parseInt(num);
    }
    // Check if the variable is a number
    if (typeof num !== 'number') return false;
    // Check if the variable is an integer
    if (!Number.isInteger(num)) return false;
    // Check if the variable is less than 10
    if (num >= 10) return false;
    // If all checks pass, return true
    return true;
}


/**
 * Writes an essay on a given topic using OpenAI's text-davinci-003 model
 * @param {string} inputValue - The topic of the essay
 * @returns {Promise<string>} - A promise that resolves to the essay as a string
 */
async function writeEssay(inputValue){

    // Create a new configuration with the API key
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API,
    });

    // Create a new instance of the OpenAI API
    const openai = new OpenAIApi(configuration);

    // Send a request to the API to generate an essay on the given topic
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: "Write an essay about " + inputValue,
        max_tokens: 1024,
        temperature: 0.1,
    });

    // Log the essay to the console
    console.log("Analysis complete. Results: " + response.data.choices[0].text);

    // Return the essay
    return response.data.choices[0].text;
}

/**
 * Function to handle the /help command and generate a response from OpenAI
 * @param {string} inputValue - The issue/question the user is asking for help with
 * @returns {string} response - The generated response from OpenAI
 */
async function helpCommand(inputValue) {
    // Create a new configuration with the API key
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API,
    });
    // Create a new instance of the OpenAI API
    const openai = new OpenAIApi(configuration);

    // Send a request to the API to generate a response to the user's issue/question
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: "This discord server automatically messages users in a new channel when they join the server, helping them to join their classes.\
        Once they have joined, they can use the add-classes channel to react and add themselves to their classes.\
        To leave a class, they can use the /leave command inside of that class channel. When choosing classes, users must put them in the format: cs1026, prefix followed by the course number.\
        A user has described this issue: " + inputValue + ". What is your response directly to them?",
        max_tokens: 256,
        temperature: 0.1,
    });
    return response.data.choices[0].text;
}



/**
 * Sends a long message to a channel by splitting it into chunks of 2000 characters
 * @param {Discord.TextChannel} channel - The channel to send the message to
 * @param {string} output - The long message to be sent
 */
function sendLongMessage(channel, output) {
    const chunks = splitString(output, 2000); // Split the output into chunks of 2000 characters
    // Iterate over each chunk and send it to the channel
    for (const chunk of chunks) {
      channel.send(chunk); // Send each chunk one by one
    }
}


/**
 * Splits a string into an array of chunks of a given length
 * @param {string} string - The string to be split
 * @param {number} length - The length of each chunk
 * @returns {string[]} - An array of chunks
 */
function splitString(string, length) {
    const chunks = [];
    let index = 0;
    // Iterate over the string and split it into chunks of the given length
    while (index < string.length) {
      chunks.push(string.slice(index, index + length));
      index += length;
    }
  
    return chunks;
}

exports.leaveClass = leaveClass;
exports.joinClass = joinClass;
exports.helpCommand = helpCommand;
exports.sendLongMessage = sendLongMessage;
exports.writeEssay = writeEssay;
exports.isValidNumber = isValidNumber;
exports.formatInput = formatInput;
exports.deleteChannel = deleteChannel;
exports.addClasses = addClasses;
exports.deleteCategory = deleteCategory;