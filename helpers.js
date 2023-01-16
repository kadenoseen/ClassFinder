// Description: This file contain the helper code for the Discord bot that will be used to manage the class channels
// Author: Kaden

// Import necessary modules
const Discord = require('discord.js');

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

exports.isValidNumber = isValidNumber;
exports.formatInput = formatInput;
exports.deleteChannel = deleteChannel;
exports.addClasses = addClasses;