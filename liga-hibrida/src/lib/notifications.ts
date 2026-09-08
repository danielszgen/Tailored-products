// Local notifications and in-page reminders (SPEC §9 Etapa III, §11 iOS checklist). Pure browser
// helpers, no React. Honest limits, also spelled out for the UI in NOTIFICATIONS_IOS_NOTE:
// - iOS only exposes the Notification API to a PWA installed on the home screen (iOS ≥ 16.4) and
//   only after the user grants permission from a tap.
// - There are no Notification Triggers on iOS: nothing can be scheduled while the app is closed.
//   The reminders below are plain timeouts that live only while the page is open; the SPA keeps
//   them across route changes, but a closed or suspended tab forgets them. HOY keeps the in-app
//   fallback cards for that reason.
// - `navigator.vibrate` does not exist on iOS: it degrades silently.
// Every browser API call is guarded and never throws, so everything is a no-op in jsdom tests.

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export const NOTIFICATIONS_STORAGE_KEY = 'liga-hibrida:notifications';

export const NOTIFICATIONS_IOS_NOTE =
  'En iPhone solo funcionan con la app instalada en la pantalla de inicio y con permiso concedido; los recordatorios se programan mientras la app está abierta.';

const ICON = '/icons/icon-192.png';
/** `navigator.serviceWorker.ready` never settles without a registered worker (dev server). */
const SW_READY_TIMEOUT_MS = 1500;

/** Installed PWA: display-mode standalone (Android/desktop) or Safari's `navigator.standalone`. */
export function isStandalone(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return true;
    }
    return (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function notificationsSupported(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof Notification !== 'undefined' &&
      typeof Notification.requestPermission === 'function'
    );
  } catch {
    return false;
  }
}

function toState(permission: string | undefined): NotificationPermissionState {
  return permission === 'granted' || permission === 'denied' ? permission : 'default';
}

export function notificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return toState(Notification.permission);
  } catch {
    return 'unsupported';
  }
}

/** Must be called from a user gesture (the Ajustes switch). */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    // Old callback-only implementations resolve undefined: read the property instead.
    return toState(result ?? Notification.permission);
  } catch {
    return notificationPermission();
  }
}

async function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    if (!sw) return null;
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS);
    });
    return await Promise.race([sw.ready, timeout]);
  } catch {
    return null;
  }
}

/**
 * Shows a notification right now. Prefers the service worker (the only path that works in an
 * installed iOS PWA), falls back to `new Notification()`. Resolves false when unsupported, not
 * granted or when both paths fail. Never throws.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  opts: { tag?: string; silent?: boolean } = {},
): Promise<boolean> {
  if (notificationPermission() !== 'granted') return false;
  const options: NotificationOptions = { body, tag: opts.tag, silent: opts.silent, icon: ICON };
  try {
    const registration = await serviceWorkerRegistration();
    if (registration && typeof registration.showNotification === 'function') {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    /* fall through to the window constructor */
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** Per-device opt-in (localStorage); the browser permission is checked separately when showing. */
export function isNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, '1');
    else localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) */
  }
}

/** Haptic tick where supported; iOS has no `navigator.vibrate` and degrades silently. */
export function vibrate(ms: number): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Reminder scheduler
// ---------------------------------------------------------------------------
// Module-level map of timeouts keyed by reminder id, so a reminder survives route changes inside
// the SPA (the component that scheduled it may unmount). It only lives while the page is open:
// there is no OS-level scheduling for a web app on iOS, so a closed, reloaded or suspended tab
// drops it. Scheduling an id that already exists replaces the previous timeout.

const reminders = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleReminder(id: string, delayMs: number, fn: () => void): void {
  cancelReminder(id);
  if (!Number.isFinite(delayMs)) return;
  const handle = setTimeout(
    () => {
      reminders.delete(id);
      try {
        fn();
      } catch {
        /* a reminder must never throw from a timer */
      }
    },
    Math.max(0, delayMs),
  );
  reminders.set(id, handle);
}

/** Returns true when a pending reminder with that id was cancelled. */
export function cancelReminder(id: string): boolean {
  const handle = reminders.get(id);
  if (handle === undefined) return false;
  clearTimeout(handle);
  reminders.delete(id);
  return true;
}

export function hasReminder(id: string): boolean {
  return reminders.has(id);
}
