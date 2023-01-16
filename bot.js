// Description: This file contains the code for the Discord bot to manage the class channels
// Author: Kaden

// Import necessary modules
require('dotenv').config();
const Discord = require('discord.js');
const helpers = require('./helpers');


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

/**
 * Event listener for when the discord bot successfully logs in and is ready
 */
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // get the server by its ID
    server = client.guilds.cache.get('1064401956744998973');
    // get the channel by its ID
    chan = server.channels.cache.get('1064608910683680902');
    // fetch the message with the ID '1064610530154778795' from the channel
    addClassesReactionMessage = await chan.messages.fetch('1064610530154778795');
});


/**
 * Event listener for when a new member joins the discord server
 * @param {Discord.GuildMember} member - The new member that joined
 */
client.on('guildMemberAdd', async member => {
    //add classes to the member
    await helpers.addClasses(member);
});


/**
 * Event listener for when a reaction is added to a message in the discord server
 * @param {Discord.MessageReaction} reaction - The reaction that was added
 * @param {Discord.User} user - The user who added the reaction
 */
client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction was added to a message in the "add-classes" channel message
    if (reaction.message === addClassesReactionMessage) {
        //find the member who reacted
        member = reaction.message.guild.members.cache.find(member => member.id === user.id);
        //add classes to the member
        await helpers.addClasses(member, false);
        //remove the reaction
        reaction.users.remove(member);
    }
});


/**
 * Event listener for when a message is created in the discord server
 * @param {Discord.Message} message - The message that was created
 */
client.on("messageCreate", async (message) => {
    // Check if the message is the leave command
    if(message.content === "/leave"){
        // Check if the message is not in a group channel
        if(message.channel.parentId !== null) {
            // exit if the message is not in a group channel
            return;
        }else{
            // delete the message after 0.5 sec
            setTimeout(() => message.delete(), 500);
            // Remove the user permission to view and send messages in the channel
            message.channel.permissionOverwrites.set([{id: message.author.id, deny: ['ViewChannel', 'SendMessages']}]);
        }
    }
    else if(message.content.startsWith("/essay")){
        const content = message.content.slice(7); // Extract the content after "/essay"
        const output = await helpers.writeEssay(content); // Call the essay function with the content
        helpers.sendLongMessage(message.channel, output); // Send the output to the channel

    }
});


// Logs in the bot
client.login(process.env.BOT_API);
