import { ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { parseClosingTimeInput } from "../utils/time-parser.utils.js";
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { handleComposeInput } from "./compose-reminder.controller.js";
import cron from "node-cron";
import { v4 as uuidv4 } from 'uuid'; // Import the UUID generator
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()
import { scheduleCronJob } from './cron-check-reminders.js';

export async function handleReminderCommand(interaction) {
  try {
    const dmOption = interaction.options.getString('dm');
    
    if (dmOption === 'Yes') {
      // Open the modal
      const modal = new ModalBuilder()
        .setCustomId('reminderModal')
        .setTitle('Set a Reminder');

      const titleInput = new TextInputBuilder()
        .setCustomId('titleInput')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('descriptionInput')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph);

      const timeInput = new TextInputBuilder()
        .setCustomId('timeInput')
        .setLabel('Time (e.g., 2:00 PM)')
        .setStyle(TextInputStyle.Short);

      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
      const thirdActionRow = new ActionRowBuilder().addComponents(timeInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      return await interaction.showModal(modal);
    } else {
      return handleComposeInput(interaction);
    }
  } catch (error) {
    console.error('Error handling reminder command:', error);
    await interaction.reply('An error occurred while processing your request.');
  }
}




export async function handleReminderSubmission(client, interaction) {
  // Acknowledge the interaction
  await interaction.deferReply();

  if (interaction.customId === 'reminderModal') {
    try {
      const title = interaction.fields.getTextInputValue('titleInput');
      const description = interaction.fields.getTextInputValue('descriptionInput');
      const timeInput = interaction.fields.getTextInputValue('timeInput');

      // Check if any of the fields are empty and ask the user to fill them
      if (!title || !description || !timeInput) {
        return await interaction.followUp('Please fill in all the fields.');
      }

      const closingTimeInSeconds = parseClosingTimeInput(timeInput);

      if (isNaN(closingTimeInSeconds) || closingTimeInSeconds <= 0) {
        return await interaction.followUp('Invalid time format. Please use a valid format (e.g., 2:00 PM).');
      }

      const currentTime = Date.now();
      const closingTimestamp = currentTime + closingTimeInSeconds * 1000;

     // Generate a UUID for the reminder ID
     const reminderId = uuidv4();

     // Declare updatedReminder outside the cron job scope
     let updatedReminder;

     const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

       if (existingReminder) {
        // If the reminder exists, update its status and exit
        console.log(`Reminder with ID ${reminderId} already exists. Updating status.`);
        await markReminderAsSent(reminderId);
        return;
      }


      const reminder = {
        userId: interaction.user.id,
        channelId: interaction.channel.id,
        title,
        description,
        reminderTime: new Date(closingTimestamp),
        reminderId,
       snoozed: false,
       snooze: null,
        status: 'UPCOMING',
        
      };

      // Send the initial reminder message to the channel or user's DM using sendAndLogReminder
      const reminderMessage = await interaction.followUp({
        content: `Reminder set. I will remind you on ${reminder.reminderTime}`,
        ephemeral: true,
      });

      // Delete the initial reminder message after 4 seconds
      setTimeout(() => {
        reminderMessage.delete();
      }, 4000);
      
       // Save the reminder to the database
       await saveReminderToDatabase(reminder);
       

       scheduleCronJob(reminder, interaction, client)
      
    } catch (error) {
      console.error('Error handling modal submission:', error);
      await interaction.editReply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
}

export function buildSnoozeOptions() {
  // Build snooze options
  const snoozeRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("snooze")
      .setPlaceholder("Snooze according to your time")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Snooze 1m')
          .setValue('60'), // 1 minute in seconds
        new StringSelectMenuOptionBuilder()
          .setLabel('Snooze 15m')
          .setValue('900'), // 15 minutes in seconds
        new StringSelectMenuOptionBuilder()
          .setLabel('Snooze 25m')
          .setValue('1500'), // 25 minutes in seconds
        new StringSelectMenuOptionBuilder()
          .setLabel('Snooze 35m')
          .setValue('2100'), // 35 minutes in seconds
        new StringSelectMenuOptionBuilder()
          .setLabel('Snooze 45m')
          .setValue('2700'), // 45 minutes in seconds
      )
  );

  return snoozeRow;
}


export async function saveReminderToDatabase(reminder, messageId) {
  await prisma.reminder.create({
    data: {
      id: reminder.reminderId, // Use UUID as the reminder ID
      author: reminder.userId,
      channel_Id: reminder.channelId,
      title: reminder.title,
      description: reminder.description,
      reminder_time: reminder.reminderTime,
      status: "UPCOMING",
      is_DM: true
    },
  });
}

async function markReminderAsSent(reminderId) {
  try {
    // Update all upcoming reminders to 'SENT' status
    await prisma.reminder.updateMany({
      where: {
        status: 'UPCOMING',
      },
      data: {
        status: 'SENT',
      },
    });

    console.log('All upcoming reminders marked as sent.');
  } catch (error) {
    console.error('Error marking reminders as sent:', error);
  }
}