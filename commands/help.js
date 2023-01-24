const { SlashCommandBuilder } = require('discord.js');
const helpers = require('../helpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Responds to questions about the server.')
		.addStringOption(option =>
			option.setName('question')
			.setRequired(true)
			.setDescription('The question you have about the server.')),
	async execute(interaction) {
		
        // Check if the user is in a class channel
        if(interaction.channel.name.includes("ticket")){
			interaction.reply("You can't use this command in a ticket channel");
			return;
        }
		await interaction.deferReply();
		const output = await helpers.helpCommand(interaction.options.getString('question'));
		interaction.followUp({content: output, ephermal: true});
	},
};