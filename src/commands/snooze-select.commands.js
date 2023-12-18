
import { PrismaClient } from "@prisma/client";
import { sendReminder as sendChannelReminder } from "../controllers/channel-reminder.controller.js";
import { sendAndLogReminder } from "../controllers/dm-reminder.controller.js";

const prisma = new PrismaClient();

export async function handleSnoozeButton(interaction) {
  try {
    if (interaction.customId !== 'snooze') return;

    const selectedSnoozeValue = interaction.values[0];
    const snoozeTime = parseInt(selectedSnoozeValue);

    console.log('Selected Snooze Value:', selectedSnoozeValue);
    console.log('Parsed Snooze Time (seconds):', snoozeTime);

    await interaction.deferUpdate();
    await interaction.followUp({ content: `Your reminder is snoozed for ${snoozeTime} seconds.`, ephemeral: true });

    try {
      const reminderIdToMatch = interaction.inGuild() ? interaction.message?.id : interaction.customId;

      const userId = interaction.user.id;
      console.log(`Attempting to find reminder for user ${userId} with ID ${reminderIdToMatch}`);

      const reminder = await prisma.reminder.findFirst({
        where: {
          message_id: reminderIdToMatch,
        },
      });

      if (reminder) {
        const now = Math.floor(Date.now() / 1000);
        const snoozedTimeInMinutes = snoozeTime / 60;

        const updatedReminder = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            reminder_Time: new Date(Date.now() + snoozeTime * 1000),
            snoozed: true,
            snooze: {
              minutes: snoozedTimeInMinutes,
              reminder_time: new Date(Date.now() + snoozeTime * 1000).toISOString(),
              updated_at: now,
            },
            updated_at: now,
          },
        });

        console.log(`Database updated for Reminder ID ${reminder.id} with snooze time ${snoozeTime} seconds`);

        const sendReminderFunction = interaction.inGuild() ? sendChannelReminder : sendAndLogReminder;
        await sendReminderFunction(updatedReminder, interaction.client);
      } else {
        console.error('Reminder not found in the database.');
        await interaction.followUp('An error occurred while processing your snooze request. Reminder not found.');
      }
    } catch (error) {
      console.error('Error updating the reminder in the database:', error);
      await interaction.followUp('An error occurred while processing your snooze request.');
    }
  } catch (error) {
    console.error('Error handling snooze button interaction:', error);
    await interaction.followUp('An error occurred while processing your snooze request.');
  }
}
