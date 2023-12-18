// dm-reminder.controller.js

import { PrismaClient } from "@prisma/client";
import { Client } from "discord.js";

const prisma = new PrismaClient();

export async function sendAndLogReminder(reminder, client, isDM = false) {
  try {
    const user = isDM ? await client.users.fetch(reminder.userId) : null;

    const currentTime = new Date().toLocaleString();
    const reminderMessage = `**Reminder:**\nTitle: ${reminder.title}\nDescription: ${reminder.description}\nTime: ${currentTime}`;

    if (user) {
      // Send the reminder message in DM
      const dm = await user.createDM();
      const dmMessage = await dm.send(reminderMessage);

      // Log the reminder in the database with the custom_id field
      const createdReminder = await prisma.reminder.create({
        data: {
          author: reminder.userId,
          channel_Id: reminder.channelId,
          title: reminder.title,
          description: reminder.description,
          reminder_Time: reminder.reminderTime,
          message_id: interaction.message.id, // Always use message_id
        },
      });

      console.log(`Reminder successfully sent and logged in the database with ID: ${createdReminder.id}`);

      // Update the sent field in the database using Prisma
      await prisma.reminder.update({
        where: { id: createdReminder.id },
        data: { sent: true },
      });

      return dmMessage; // Return the sent DM message object
    }
  } catch (error) {
    console.error(`Error sending ${isDM ? "DM" : ""} reminder:`, error);
    return null; // Return null if there's an error
  }
}
