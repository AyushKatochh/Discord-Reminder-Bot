// interactions.js
import { handleReminderCommand, handleReminderSubmission } from "../controllers/reminder-handler.controller.js";
import { handleSnoozeButton } from "./snooze-select.js";
import { handleReminder, scheduleReminderCheck } from "../controllers/application-reminder.controller.js";
import { TWENTY_MINUTES, ONE_HOUR, TWO_HOURS, ONE_WEEK, TOMORROW, TIME_FORMAT } from '../constants/constants.js';
import { handleDMSnoozeButton } from "./dm-snooze-select.js";

export async function handleInteractions(client, interaction) {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === 'compose') {
      await handleReminderCommand(interaction);
    }
  }

  if (interaction.isMessageContextMenuCommand()) {
    if (interaction.commandName === 'Remind-in-20-minutes') {
        await handleReminder(interaction, TWENTY_MINUTES);
      }
      
    if (interaction.commandName === "Remind-in-1-hour") {
      await scheduleReminderCheck(interaction);
     
      await handleReminder(interaction, ONE_HOUR);
      
     
    }

    if (interaction.commandName === "Remind-in-2-hours") {
      await handleReminder(interaction, TWO_HOURS);
    }

    if (interaction.commandName === 'Remind-after-1-week') {
        await handleReminder(interaction, ONE_WEEK);
      }
  
    if (interaction.commandName === 'Remind-tomorrow') {
        await handleReminder(interaction, TOMORROW);
      }
  }

  if (interaction.isModalSubmit()) {
    await handleReminderSubmission(client, interaction);
  }

  if (interaction.isButton() && interaction.customId === 'resetTimer') {
    await handleReminderCommand(interaction);
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "snooze") {
    await handleSnoozeButton(interaction);
  } else if(interaction.isStringSelectMenu() && interaction.customId === "snooze-dm") {
    await handleDMSnoozeButton(interaction)
  }
}
