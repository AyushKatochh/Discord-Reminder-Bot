// channel-reminder.controller.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sendReminder(reminder, client) {
  try {
    const channel = client.channels.cache.get(reminder.channelId);

    if (channel) {
      const currentTime = new Date().toLocaleString();
      let reminderMessage = `**Reminder:**\nTitle: ${reminder.title}\nDescription: ${reminder.description}\nTime: ${currentTime}`;

      try {
        // Send the initial reminder message
        const sentReminder = await channel.send(reminderMessage);

        // Log the reminder in the database with the message_id field
        const createdReminder = await prisma.reminder.create({
          data: {
            author: reminder.userId,
            channel_Id: reminder.channelId,
            title: reminder.title,
            description: reminder.description,
            reminder_Time: reminder.reminderTime,
            message_id: sentReminder.id,
          },
        });

        console.log(`Reminder successfully sent and logged in the database with ID: ${createdReminder.id}`);

        return sentReminder; // Return the sent message object
      } catch (error) {
        console.error('Error sending reminder to the channel:', error);
      }
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
}
