// compose-reminder.controller.js
import { parseClosingTimeInput } from "../utils/time-parser.utils.js";
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { PrismaClient } from "@prisma/client";
import { scheduleCronJob } from "./cron-check-reminders.js";
const prisma = new PrismaClient();



export async function handleComposeInput(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const selectedChannel = interaction.options.getChannel('channel');
    if (!selectedChannel) return await interaction.editReply({ content: 'Invalid channel selection.', ephemeral: true });

    const text = interaction.options.getString('text');
    const timeInput = interaction.options.getString('time');
    const selectedChannelId = selectedChannel.id;
    const selectedChannelName = selectedChannel.name;

    const closingTimeInSeconds = parseClosingTimeInput(timeInput);
    if (isNaN(closingTimeInSeconds) || closingTimeInSeconds <= 0)
      return await interaction.editReply({ content: 'Invalid time format. Please use a valid format (e.g., 2:00 PM).', ephemeral: true });

    const currentTime = Date.now();
    const closingTimestamp = currentTime + closingTimeInSeconds * 1000;
    const reminderId = `${interaction.user.id}-${closingTimestamp}`;

    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (existingReminder) {
      console.log(`Reminder with ID ${reminderId} already exists. Updating status.`);
      await markReminderAsSent(reminderId);
      return;
    }

    const reminder = {
      userId: interaction.user.id,
      channelId: selectedChannelId,
      channelName: selectedChannelName,
      title: 'Compose Reminder',
      description: text,
      reminderTime: new Date(closingTimestamp),
      reminderId: reminderId,
      snoozed: false,
      snooze: null,
      status: 'UPCOMING',
    };

    await interaction.editReply({ content: `Reminder set. I will remind you on ${reminder.reminderTime} in #${selectedChannelName}.`, ephemeral: true });
    await saveReminderToDatabase(reminder);

    scheduleCronJob(reminder, interaction);    
  } catch (error) {
    console.error('Error handling compose reminder:', error);
    await interaction.editReply({ content: 'An error occurred while processing your request.', ephemeral: true });
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

export async function saveReminderToDatabase(reminder) {
  await prisma.reminder.create({
    data: {
      author: reminder.userId,
      channel_Id: reminder.channelId,
      title: reminder.title,
      description: reminder.description,
      reminder_time: reminder.reminderTime,
      id: reminder.reminderId, // Use id as the UUID
      message_id: reminder.reminderId,
      status: "UPCOMING",
      is_DM: true,
    },
  });
}

export async function markReminderAsSent(reminderId) {
  try {
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: { status: 'SENT' },
    });

    console.log('Reminder marked as sent:', updatedReminder);
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
  }
}
