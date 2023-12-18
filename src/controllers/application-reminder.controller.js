// application-reminder.controller.js
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function handleReminder(interaction, delay) {
  const contextMessage = interaction.targetMessage;
  const reminderTime = new Date(Date.now() + delay);
  const acknowledgeMessage = await interaction.reply({
    content: `I will remind you at ${reminderTime}. The reminder will be sent on ${reminderTime.toLocaleString()}.`,
    ephemeral: true
  });

  const reminderId = uuidv4();

  try {
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        channel_Id: interaction.channel.id,
        title: contextMessage?.content || "No title available",
        status: "UPCOMING",
      },
    });

    if (existingReminder) {
      await prisma.reminder.update({
        where: { id: existingReminder.id },
        data: {
          reminder_time: reminderTime,
        },
      });
      console.log(`Updated existing reminder for ID ${existingReminder.id}`);
    } else {
      await prisma.reminder.create({
        data: {
          id: reminderId,
          author: interaction.user.id,
          channel_Id: interaction.channel.id,
          title: contextMessage?.content || "No title available",
          reminder_time: reminderTime,
          status: "UPCOMING",
        },
      });
      console.log(`Entry saved in the database with ID ${reminderId}`);
    }

    setTimeout(async () => {
      try {
        await acknowledgeMessage.delete();
        await prisma.reminder.update({
          where: { id: reminderId },
          data: { updated_at: Math.floor(Date.now() / 1000) },
        });
        console.log(`Updated updated_at field for reminder ID ${reminderId}`);
      } catch (error) {
        console.error('Error deleting acknowledgment message or updating updated_at field:', error);
      }
    }, 10000);

  } catch (error) {
    console.error('Error saving or updating reminder to the database:', error);
  }
}

export async function scheduleReminderCheck(interaction) {
  cron.schedule('* * * * *', async () => {
    try {
      const completedReminders = await prisma.reminder.findMany({
        where: {
          status: 'UPCOMING',
          reminder_time: {
            lte: new Date(),
          },
        },
      });

      for (const reminder of completedReminders) {
        if (reminder.status === 'SENT') {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: 'COMPLETED',
              updated_at: Math.floor(Date.now() / 1000),
            },
          });
          console.log(`Reminder marked as COMPLETED for ID ${reminder.id}`);
        } else {
          const user = await interaction.client.users.fetch(reminder.author);
          await user.send(`Reminder: ${reminder.title}`);
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: "SENT",
              updated_at: Math.floor(Date.now() / 1000),
            },
          });
          console.log(`Reminder sent for ID ${reminder.id}`);
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  });
}
