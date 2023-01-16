require('dotenv').config();
const Discord = require('discord.js');
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



client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Get reaction message
    server = client.guilds.cache.get('1064401956744998973');
    console.log(server.name);
    chan = server.channels.cache.get('1064608910683680902');
    console.log(chan.name);
    addClassesReactionMessage = await chan.messages.fetch('1064610530154778795');
    
});

async function addClasses(member, newUser) {
    const filter = m => m.author.id === member.id;
    member.guild.channels.create({
        name: `${member.displayName}-classes`, 
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
    })
    .then(async channel => {
        if(newUser) {
            channel.send(`Welcome to the server, ${member}!`);
            channel.send(`How many classes are you in? (Enter a value from 1-10)`);
        } else {
            channel.send(`Welcome back, ${member}!`);
            channel.send(`How many classes would you like to join? (Enter a value from 1-10)`);
        } 
        let numClasses;
        while(!isValidNumber(numClasses)) {
            numClasses = await channel.awaitMessages({filter, max: 1, time: 60_000}).then(collected => {
                return collected.first().content;
            }).catch(async err => {
                channel.send('No response received.');
                return 0;
            });
            if(!isValidNumber(numClasses)) {
                channel.send('Invalid input. Please enter a value from 0-10.');
            }
        }
        for (let i = 1; i <= numClasses; i++) {
            channel.send(`What is the name of class number ${i}? Make sure it is in the format "cs1026"`);
            const className = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                return collected.first().content;
            });
            console.log(className);
            const classNameFiltered = formatInput(className);
            const classChannel = member.guild.channels.cache.find(ch => ch.name === classNameFiltered);
            if (classChannel) {
                classChannel.permissionOverwrites.set([{id: member.id, allow: ['ViewChannel', 'SendMessages']}]);
                channel.send(`You have been added to ${classChannel.toString()}!`);
            } else {
                channel.send(`There is no channel yet for ${classNameFiltered}. Do you want me to create it for you? (y/n)`);
                const answer = await channel.awaitMessages({ filter, max: 1, time: 60_000 }).then(collected => {
                    return collected.first().content;
                });
                if (answer.toLowerCase() === 'y') {
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
                    })
                    channel.send(`You have been added to ${newChannel.toString()}!`);
                }
            }
        }
        if (numClasses > 0) {
            channel.send(`You have now been added to all of your classes!`);
        }
        await deleteChannel(channel);
    })
}

async function deleteChannel(channel) {
    channel.send(`Channel deleting in 15 seconds...`);
    setTimeout(() => {
        channel.delete()
            .catch(console.error);
    }, 15000);
}

client.on('guildMemberAdd', async member => {
    await addClasses(member);
});

client.on("messageReactionAdd", async (reaction, user) => {
    // Check if the reaction was added to a message in the "add-classes" channel message
    if (reaction.message === addClassesReactionMessage) {
        member = reaction.message.guild.members.cache.find(member => member.id === user.id);
        await addClasses(member, false);
        reaction.users.remove(member);
    }
});

client.on("messageCreate", async (message) => {
    if(message.content === "!leave"){
        // need to ensure channel is in category "MY CLASSES"
        setTimeout(() => message.delete(), 1000);
        console.log(message);
        console.log(message.channel);
        message.channel.permissionOverwrites.set([{id: message.author.id, deny: ['ViewChannel', 'SendMessages']}]);
    }
});
  

client.login(process.env.BOT_API);
