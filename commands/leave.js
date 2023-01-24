const { SlashCommandBuilder } = require('discord.js');
const helpers = require('../helpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leaves class'),
	async execute(interaction) {
        // Check if the user is in a class channel
        if(interaction.channel.name.includes("discussion") || interaction.channel.name.includes("resources")){
            await helpers.leaveClass(interaction.member, interaction.client, interaction.channel);
        }
	},
};