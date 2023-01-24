// Description: This file contains the code for the Discord bot to manage the class channels
// Author: Kaden

// Import necessary modules
require('dotenv').config();
const Discord = require('discord.js');
const helpers = require('./helpers');
const fs = require('node:fs');
const path = require('node:path');

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

// Collection for slash commands
client.commands = new Discord.Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Discord.Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction);
    }catch(error){
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Defines reaction message to add classes
let addClassesReactionMessage, getStartedReactionMessage;

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
    chan2 = server.channels.cache.get('1064652689667014686');
    getStartedReactionMessage = await chan2.messages.fetch('1065026378237493332');
});

/**
 * Event listener for when a new member joins the discord server
 * @param {Discord.GuildMember} member - The new member that joined
 */
client.on('guildMemberAdd', async member => {
    const studentRole = await member.guild.roles.cache.find(role => role.name === "Unverified");
    //add Student role to member
    await member.roles.add(studentRole);
});


/**
 * Event listener for when a reaction is added to a message in the discord server
 * @param {Discord.MessageReaction} reaction - The reaction that was added
 * @param {Discord.User} user - The user who added the reaction
 */
client.on("messageReactionAdd", async (reaction, user) => {
    //find the member who reacted
    member = reaction.message.guild.members.cache.find(member => member.id === user.id);
    // Check if the reaction was added to a message in the "add-classes" channel message
    if (reaction.message === addClassesReactionMessage) {
        //add classes to the member
        await helpers.addClasses(member, client, false);
        //remove the reaction
        reaction.users.remove(member);
    }else if (reaction.message === getStartedReactionMessage){
        // Check if the user is already a student
        if(member.roles.cache.some(role => role.name === 'Student')){
            // if so, remove the reaction
            reaction.users.remove(member);
        }else{
            const studentRole = await member.guild.roles.cache.find(role => role.name === "Student");
            //add Student role to member
            await member.roles.add(studentRole);
            const noRole = await member.guild.roles.cache.find(role => role.name === "Unverified");
            await member.roles.remove(noRole);
            //add classes to the member
            await helpers.addClasses(member, client, true);
            reaction.users.remove(member);
        }
    }
});

// IN PROCESS OF CONVERTING ALL messageCreates TO SLASH COMMANDS
/**
 * Event listener for when a message is created in the discord server
 * @param {Discord.Message} message - The message that was created
 */
client.on("messageCreate", async (message) => {

    if(message.content.startsWith("/essay")){
        const content = message.content.slice(7); // Extract the content after "/essay"
        const output = await helpers.writeEssay(content); // Call the essay function with the content
        helpers.sendLongMessage(message.channel, output); // Send the output to the channel
    }
    /*else if(message.content.startsWith("/help")){
        if(message.channel.name.includes("ticket")){
            message.channel.send("You can't use this command in a ticket channel");
            return;
        }
        const content = message.content.slice(6); // Extract the content after "/help"
        const output = await helpers.helpCommand(content); // Call the help function with the content
        message.channel.send(output); // Send the output to the channel
    }*/
});

client.on("channelCreate", (channel) => {
    if(channel.name.includes("ticket")){
        helpers.handleHelpTicket(channel, true);
    }
});


/**
 * Event listener for when an error is thrown
 * @param {Error} err - The error that was thrown
 */
process.on('uncaughtException', function (err) {
    console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    console.error(err.stack)
});

// Logs in the bot
client.login(process.env.BOT_API);
