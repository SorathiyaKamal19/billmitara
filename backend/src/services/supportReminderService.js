import { env } from '../config/env.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { sendSupportReminderEmail } from './emailService.js';

const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SCAN_INTERVAL_MS = 60 * 60 * 1000;
const STARTUP_DELAY_MS = 30 * 1000;

async function sendDueSupportReminders() {
  if (!env.mail.supportTo || !env.mail.resendApiKey) return;

  const now = new Date();
  const dueBefore = new Date(now.getTime() - REMINDER_INTERVAL_MS);
  const tickets = await SupportTicket.find({
    status: 'open',
    createdAt: { $lte: dueBefore },
    $or: [
      { lastReminderAt: { $exists: false } },
      { lastReminderAt: null },
      { lastReminderAt: { $lte: dueBefore } }
    ]
  })
    .sort({ createdAt: 1 })
    .limit(50);

  for (const ticket of tickets) {
    try {
      await sendSupportReminderEmail({ ticket });
      ticket.lastReminderAt = now;
      ticket.reminderCount = (ticket.reminderCount || 0) + 1;
      await ticket.save();
    } catch (error) {
      console.warn(`Support reminder skipped for ${ticket._id}: ${error.message}`);
    }
  }
}

export function startSupportReminderCron() {
  const warmupTimer = setTimeout(sendDueSupportReminders, STARTUP_DELAY_MS);
  const interval = setInterval(sendDueSupportReminders, SCAN_INTERVAL_MS);
  warmupTimer.unref?.();
  interval.unref?.();

  console.log('Support reminder cron enabled: checking open tickets hourly');

  return () => {
    clearTimeout(warmupTimer);
    clearInterval(interval);
  };
}
