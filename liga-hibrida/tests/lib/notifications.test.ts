import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelReminder,
  hasReminder,
  isNotificationsEnabled,
  isStandalone,
  NOTIFICATIONS_STORAGE_KEY,
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  scheduleReminder,
  setNotificationsEnabled,
  showLocalNotification,
  vibrate,
} from '@/lib/notifications';
import {
  ADDUCTOR_REMINDER_ID,
  ADDUCTOR_REMINDER_MS,
  scheduleAdductorReminder,
} from '@/features/gym/adductorReminder';
import {
  MORNING_REMINDER_ID,
  msUntilWindow,
  scheduleMorningReminder,
} from '@/features/today/morningReminder';

/** Minimal stand-in for the browser Notification API (jsdom has none). */
class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn(async () => FakeNotification.permission);
  static created: { title: string; options?: NotificationOptions }[] = [];
  constructor(title: string, options?: NotificationOptions) {
    FakeNotification.created.push({ title, options });
  }
}

function stubNotification(permission: NotificationPermission) {
  FakeNotification.permission = permission;
  FakeNotification.created = [];
  FakeNotification.requestPermission.mockClear();
  vi.stubGlobal('Notification', FakeNotification);
}

describe('notifications · enabled flag (localStorage)', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through liga-hibrida:notifications', () => {
    expect(isNotificationsEnabled()).toBe(false);
    setNotificationsEnabled(true);
    expect(isNotificationsEnabled()).toBe(true);
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBe('1');
    setNotificationsEnabled(false);
    expect(isNotificationsEnabled()).toBe(false);
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBeNull();
  });
});

describe('notifications · guarded browser APIs', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is "unsupported" and never throws without the Notification API (jsdom)', async () => {
    expect(typeof Notification).toBe('undefined');
    expect(notificationsSupported()).toBe(false);
    expect(notificationPermission()).toBe('unsupported');
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
    await expect(showLocalNotification('Hola', 'Mundo', { tag: 'test' })).resolves.toBe(false);
    expect(isStandalone()).toBe(false);
    expect(() => vibrate(200)).not.toThrow();
  });

  it('shows through the Notification constructor when granted and there is no service worker', async () => {
    stubNotification('granted');
    expect(notificationsSupported()).toBe(true);
    expect(notificationPermission()).toBe('granted');
    await expect(
      showLocalNotification('Descanso terminado', 'Siguiente serie.', { tag: 'rest' }),
    ).resolves.toBe(true);
    expect(FakeNotification.created).toEqual([
      {
        title: 'Descanso terminado',
        options: { body: 'Siguiente serie.', tag: 'rest', icon: '/icons/icon-192.png' },
      },
    ]);
  });

  it('resolves false while the permission is denied or not yet granted', async () => {
    stubNotification('denied');
    expect(notificationPermission()).toBe('denied');
    await expect(requestNotificationPermission()).resolves.toBe('denied');
    await expect(showLocalNotification('x', 'y')).resolves.toBe(false);

    stubNotification('default');
    expect(notificationPermission()).toBe('default');
    await expect(showLocalNotification('x', 'y')).resolves.toBe(false);
    expect(FakeNotification.created).toHaveLength(0);
    await expect(requestNotificationPermission()).resolves.toBe('default');
    expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(1);
  });
});

describe('notifications · in-page reminder scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    for (const id of ['x', 'y', ADDUCTOR_REMINDER_ID, MORNING_REMINDER_ID]) cancelReminder(id);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fires after the delay and replaces a reminder scheduled with the same id', () => {
    const first = vi.fn();
    const second = vi.fn();
    scheduleReminder('x', 1000, first);
    scheduleReminder('x', 2000, second);
    expect(hasReminder('x')).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(hasReminder('x')).toBe(false);
  });

  it('cancelReminder drops a pending reminder', () => {
    const fn = vi.fn();
    scheduleReminder('y', 1000, fn);
    expect(cancelReminder('y')).toBe(true);
    expect(cancelReminder('y')).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('adductor reminder: Lower gyms only, when enabled, 45 min after finishing', async () => {
    stubNotification('granted');
    expect(scheduleAdductorReminder('cantera')).toBe(false); // switch off
    setNotificationsEnabled(true);
    expect(scheduleAdductorReminder('yunque')).toBe(false);
    expect(scheduleAdductorReminder('vertigo')).toBe(false);
    expect(scheduleAdductorReminder('resorte')).toBe(true);
    expect(hasReminder(ADDUCTOR_REMINDER_ID)).toBe(true);

    await vi.advanceTimersByTimeAsync(ADDUCTOR_REMINDER_MS - 1);
    expect(FakeNotification.created).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeNotification.created).toEqual([
      expect.objectContaining({ title: '¿Aductor 30–60 min después?' }),
    ]);
    expect(hasReminder(ADDUCTOR_REMINDER_ID)).toBe(false);
  });

  it('msUntilWindow counts down to the window start and is ≤ 0 once past', () => {
    expect(msUntilWindow(new Date('2026-09-07T06:30:00'), '07:00')).toBe(30 * 60 * 1000);
    expect(msUntilWindow(new Date('2026-09-07T07:00:00'), '07:00')).toBe(0);
    expect(msUntilWindow(new Date('2026-09-07T08:15:30'), '07:00')).toBe(-(75 * 60 + 30) * 1000);
    expect(msUntilWindow(new Date('2026-09-07T23:59:00'), '00:30')).toBeLessThan(0);
  });

  it('morning reminder: only before the AM window, when enabled and without a check-in', async () => {
    stubNotification('granted');
    const amWindow: [string, string] = ['07:00', '09:00'];
    const early = new Date('2026-09-07T06:30:00');
    const inside = new Date('2026-09-07T08:00:00');

    expect(scheduleMorningReminder({ amWindow, hasCheckin: false, now: early })).toBe(false);
    setNotificationsEnabled(true);
    expect(scheduleMorningReminder({ amWindow, hasCheckin: true, now: early })).toBe(false);
    expect(scheduleMorningReminder({ amWindow, hasCheckin: false, now: inside })).toBe(false);
    expect(hasReminder(MORNING_REMINDER_ID)).toBe(false);

    expect(scheduleMorningReminder({ amWindow, hasCheckin: false, now: early })).toBe(true);
    expect(hasReminder(MORNING_REMINDER_ID)).toBe(true);
    // Saving the check-in re-runs the scheduler, which cancels the pending reminder.
    expect(scheduleMorningReminder({ amWindow, hasCheckin: true, now: early })).toBe(false);
    expect(hasReminder(MORNING_REMINDER_ID)).toBe(false);

    expect(scheduleMorningReminder({ amWindow, hasCheckin: false, now: early })).toBe(true);
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    expect(FakeNotification.created).toEqual([
      expect.objectContaining({ title: 'Check-in matinal' }),
    ]);
  });
});
