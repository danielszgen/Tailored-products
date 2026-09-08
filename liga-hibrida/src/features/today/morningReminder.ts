// Morning check-in reminder at the start of the AM window (SPEC §9 Etapa III, §8.2).
// Only while the app is open (see src/lib/notifications.ts); the check-in card in HOY is the
// fallback when the reminder cannot fire.
import { timeToMinutes } from '@/lib/date';
import {
  cancelReminder,
  isNotificationsEnabled,
  scheduleReminder,
  showLocalNotification,
} from '@/lib/notifications';

export const MORNING_REMINDER_ID = 'morning';
export const MORNING_REMINDER_TITLE = 'Check-in matinal';
export const MORNING_REMINDER_BODY = 'Sueño, energía, piernas, muñeca y aductor: 30 segundos.';

/** Milliseconds from `now` until today's `start` ('HH:mm'); zero or negative once it has passed. */
export function msUntilWindow(now: Date, start: string): number {
  const minutes = timeToMinutes(start);
  const target = new Date(now);
  target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return target.getTime() - now.getTime();
}

export interface MorningReminderInput {
  amWindow: [string, string];
  /** Today's check-in already saved. */
  hasCheckin: boolean;
  now?: Date;
}

/**
 * Cancels the previous morning reminder and, when notifications are enabled and there is no
 * check-in today, schedules one at the start of the AM window if that is still ahead. Inside or
 * after the window nothing is scheduled: the check-in card is already on screen. Returns whether
 * a reminder was scheduled.
 */
export function scheduleMorningReminder({
  amWindow,
  hasCheckin,
  now = new Date(),
}: MorningReminderInput): boolean {
  cancelReminder(MORNING_REMINDER_ID);
  if (hasCheckin || !isNotificationsEnabled()) return false;
  const delay = msUntilWindow(now, amWindow[0]);
  if (delay <= 0) return false;
  scheduleReminder(MORNING_REMINDER_ID, delay, () => {
    void showLocalNotification(MORNING_REMINDER_TITLE, MORNING_REMINDER_BODY, {
      tag: MORNING_REMINDER_ID,
    });
  });
  return true;
}
