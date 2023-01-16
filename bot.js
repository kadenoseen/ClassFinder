// Description: This file contains the code for the Discord bot that will be used to manage the class channels
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

// Listens for new members joining the server
client.on('guildMemberAdd', async member => {
    //add classes to the member
    await helpers.addClasses(member);
});


// Listens for reactions added to messages
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


// Listens for messages sent in the server
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
});

  
// Logs in the bot
client.login(process.env.BOT_API);
