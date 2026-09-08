// "¿Aductor 30–60 min después?" reminder 45 min after finishing a Lower session (SPEC §8.3).
// Only while the app is open (see src/lib/notifications.ts); the AdductorAfterCard in HOY is the
// fallback when the notification cannot fire.
import type { GymId } from '@/domain/types';
import {
  isNotificationsEnabled,
  scheduleReminder,
  showLocalNotification,
} from '@/lib/notifications';

export const ADDUCTOR_REMINDER_MS = 45 * 60 * 1000;
export const ADDUCTOR_REMINDER_ID = 'adductor';
export const ADDUCTOR_REMINDER_TITLE = '¿Aductor 30–60 min después?';
export const ADDUCTOR_REMINDER_BODY = 'Registra el aductor en HOY.';

/** Schedules the reminder for Cantera/Resorte when notifications are enabled; returns whether it did. */
export function scheduleAdductorReminder(gymId: GymId): boolean {
  if (gymId !== 'cantera' && gymId !== 'resorte') return false;
  if (!isNotificationsEnabled()) return false;
  scheduleReminder(ADDUCTOR_REMINDER_ID, ADDUCTOR_REMINDER_MS, () => {
    void showLocalNotification(ADDUCTOR_REMINDER_TITLE, ADDUCTOR_REMINDER_BODY, {
      tag: ADDUCTOR_REMINDER_ID,
    });
  });
  return true;
}
