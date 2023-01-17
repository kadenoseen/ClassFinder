# Discord Class Management Bot

This bot is designed to assist users in managing their classes on a Discord server. It allows users to join and leave classes, and also provides a way for users to create new classes.

## Features
- Users can join classes by reacting to a message in the #add-classes channel
- Users can leave classes by typing the `/leave` command in any of the class's channels
- Provides a way for users to report issues and receive help with the `/help` command
- Automatically creates a new category, discussion channel, questions channel and resources channel for new classes when created
- Admins can delete a category using the `/deleteCategory` command in any category

## Getting Started
To get started, you will need to have [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on your computer. You will also need to have a [Discord](https://discord.com/) account and create a bot on the [Discord Developer Portal](https://discord.com/developers/docs/intro).
1. Clone the repository to your local machine
```bash
git clone https://github.com/your-username/discord-bot.git
```
2. Install the necessary dependencies
```bash
npm install
```
3. Create a .env file in the root directory of the project and add your Discord bot token and OpenAI API key
```.env
DISCORD_TOKEN=your-token-here
OPENAI_API=your-api-key-here
```
4. Start the bot
```bash
npm start
```

## Usage
- Users can join classes by reacting to a message in #add-classes
- Users can leave classes by typing `/leave` in the class's channel
- Users can create new classes by typing `!create-class` in the designated create-classes channel
- Users can report issues and receive help by typing `!help` in the designated help channel

## Built With
- [Discord.js](https://discord.js.org/) - A powerful JavaScript library for interacting with the Discord API
- [OpenAI](https://openai.com/) - A platform for training and deploying AI models

## Authors
- [Kaden Oseen](https://github.com/kadenoseen)
