import { sendReminder } from './channel-reminder.controller';
import cron from 'node-cron';
import { buildSnoozeOptions } from './compose-reminder.controller';
import { markReminderAsSent } from './compose-reminder.controller';
import { sendAndLogReminder } from './dm-reminder.controller';

export function scheduleCronJob(reminder, interaction, client) {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const updatedReminder = await prisma.reminder.findUnique({
        where: { id: reminder.reminderId },
      });

      if (
        now >= reminder.reminderTime &&
        !reminder.sent &&
        !reminder.snoozed &&
        (!updatedReminder || updatedReminder.status !== 'SENT' || updatedReminder.snoozed === false)
      ) {
        console.log('Cron job started sending reminder.');

        if (reminder.inGuild) {
          // Handling channel reminder
          const sentReminder = await sendReminder(reminder, interaction.client, interaction);
          await markReminderAsSent(reminder.reminderId);

          if (!updatedReminder || updatedReminder.status !== 'SENT' || updatedReminder.snoozed !== true) {
            const snoozeRow = buildSnoozeOptions();
            await sentReminder.edit({ components: [snoozeRow] });
            console.log('Channel reminder sent successfully with snooze options.');
          } else {
            console.log(`Channel reminder with ID ${reminder.reminderId} has already been sent and snoozed.`);
          }
        } else {
          // Handling direct message reminder
          const sentReminder = await sendAndLogReminder(reminder, client, false);
          await markReminderAsSent(reminder.reminderId);

          if (!updatedReminder || updatedReminder.status !== 'SENT' || updatedReminder.snoozed !== true) {
            const snoozeRow = buildSnoozeOptions();
            await sentReminder.edit({ components: [snoozeRow] });
            console.log('DM reminder sent successfully with snooze options.');
          } else {
            console.log(`DM reminder with ID ${reminder.reminderId} has already been sent and snoozed.`);
          }
        }
      }
    } catch (error) {
      console.error('Error sending reminder message:', error);
    }
  });
}
