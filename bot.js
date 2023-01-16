// Description: This file contains the code for the Discord bot that will be used to manage the class channels
// Author: Kaden

// Import necessary modules
require('dotenv').config();
const Discord = require('discord.js');

// Create a new client with necessary intents and partials
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Discord.Partials.Message, Discord.Partials.Channel, Discord.Partials.Reaction],
});


// Defines reaction message to add classes
let addClassesReactionMessage;

// Formats class channel name
function formatInput(input) {
    // Initialize variables to store the letters and numbers
    let letters = "";
    let numbers = "";
    // Iterate through each character of the input
    for (let i = 0; i < input.length; i++) {
        // Check if the character is a letter
        if (isNaN(input[i])) {
            letters += input[i].toLowerCase();
        } else {
            numbers += input[i];
        }
    }
    // Return the input with letters and numbers separated by a "-"
    return letters + "-" + numbers;
}

// Checks if the input is a valid number
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


// When the bot is ready, log a message to the console and cache the addClassesReactionMessage
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // get the server by its ID
    server = client.guilds.cache.get('1064401956744998973');
    // get the channel by its ID
    chan = server.channels.cache.get('1064608910683680902');
    // fetch the message with the ID '1064610530154778795' from the channel
    addClassesReactionMessage = await chan.messages.fetch('1064610530154778795');
});

// Adds classes for new or existing member
async function addClasses(member, newUser) {
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
        // ask for each class the member is in
        for (let i = 1; i <= numClasses; i++) {
            // ask for the name of class number i
            channel.send(`What is the name of class number ${i}? Make sure it is in the format "cs1026"`);
            // wait for user's response and store the class name
            const className = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                return collected.first().content;
            });
            // format the class name using the formatInput() function
            const classNameFiltered = formatInput(className);
            // check if a channel with the same name as the class already exists
            const classChannel = member.guild.channels.cache.find(ch => ch.name === classNameFiltered);
            if (classChannel) {
                // if the channel already exists, add the member to the channel
                classChannel.permissionOverwrites.set([{id: member.id, allow: ['ViewChannel', 'SendMessages']}]);
                // send a message to the member telling them they have been added to the channel
                channel.send(`You have been added to ${classChannel.toString()}!`);
            } else {
                // if the channel does not exist, ask the member if they would like to create it
                channel.send(`There is no channel yet for ${classNameFiltered}. Do you want me to create it for you? (y/n)`);
                // wait for user's response
                const answer = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                    return collected.first().content;
                });
                if (answer.toLowerCase() === 'y') {
                    // if the member wants to create the channel, create the channel with the same name as the class
                    const newChannel = await member.guild.channels.create({
                        name: `${classNameFiltered}`, 
                        type: Discord.ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                            id: member.id,
                            allow: ['ViewChannel', 'SendMessages']
                            },
                            {
                            id: member.guild.id,
                            deny: ['ViewChannel']
                            }
                        ]
                    });
                    // add the member to the channel
                    channel.send(`You have been added to ${newChannel.toString()}!`);
                }
            }
        }
        // if the member has joined at least 1 class, send a message telling them they have been added to all their classes
        if (numClasses > 0) {
            channel.send(`You have now been added to all of your classes!`);
        }
        // delete the private channel
        await deleteChannel(channel);
    })
}

// Deletes a channel after 15 seconds
async function deleteChannel(channel) {
    // send a message to the channel that it will be deleted in 15 seconds
    channel.send(`Channel deleting in 15 seconds...`);
    // wait for 15 sec
    setTimeout(() => {
        // delete the channel
        channel.delete()
            .catch(console.error);
    }, 15000);
}

// Listens for new members joining the server
client.on('guildMemberAdd', async member => {
    //add classes to the member
    await addClasses(member);
});


// Listens for reactions added to messages
client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction was added to a message in the "add-classes" channel message
    if (reaction.message === addClassesReactionMessage) {
        //find the member who reacted
        member = reaction.message.guild.members.cache.find(member => member.id === user.id);
        //add classes to the member
        await addClasses(member, false);
        //remove the reaction
        reaction.users.remove(member);
    }
});


// Listens for messages sent in the server
client.on("messageCreate", async (message) => {
    // Check if the message is the leave command
    if(message.content === "!leave"){
        // Check if the message is not in a group channel
        if(message.channel.parentId !== null) {
            // exit if the message is not in a group channel
            return;
        }
        // delete the message after 1 sec
        setTimeout(() => message.delete(), 1000);
        // Remove the user permission to view and send messages in the channel
        message.channel.permissionOverwrites.set([{id: message.author.id, deny: ['ViewChannel', 'SendMessages']}]);
    }
});

  
// Logs in the bot
client.login(process.env.BOT_API);
