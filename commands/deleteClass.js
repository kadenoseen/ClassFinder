const { SlashCommandBuilder } = require('discord.js');
const helpers = require('../helpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deleteclass')
		.setDescription('Deletes class')
		.setDefaultMemberPermissions(0),
	async execute(interaction) {
        // Check if the user is in a class channel
		interaction.reply({content: "Deleting class...", ephermal: true});
        if(interaction.channel.name.includes("discussion") || interaction.channel.name.includes("resources")){
            await helpers.deleteCategory(interaction.channel, interaction.client);
        }
	},
};