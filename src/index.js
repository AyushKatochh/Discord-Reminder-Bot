import dotenv from "dotenv";
dotenv.config();
import { Client, IntentsBitField } from 'discord.js';
import { handleReminderCommand, handleReminderSubmission } from "./controllers/reminder-handler.controller.js"
import { handleSnoozeButton } from"./Interactions/snooze-select.js"
import {handleReminder} from "./controllers/application-reminder.controller.js"
import { handleInteractions } from "./Interactions/Interactions.js";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent
  ],
});


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  await handleInteractions(client, interaction);
});

client.login(process.env.TOKEN);
