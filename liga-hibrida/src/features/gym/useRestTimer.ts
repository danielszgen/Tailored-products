import { useCallback, useEffect, useRef, useState } from 'react';
import { isNotificationsEnabled, showLocalNotification, vibrate } from '@/lib/notifications';

export interface RestTimerState {
  running: boolean;
  remaining: number; // seconds
  total: number;
  range: [number, number] | null;
}

/** End of rest: haptic tick where supported plus a local notification when enabled; no audio (D5). */
function notifyRestEnd() {
  vibrate(200); // iOS has no navigator.vibrate: degrades silently
  if (isNotificationsEnabled()) {
    void showLocalNotification('Descanso terminado', 'Siguiente serie.', { tag: 'rest' });
  }
}

/** Countdown for rest between sets. Vibrates/notifies when it reaches 0; no audio (D5). */
export function useRestTimer() {
  const [state, setState] = useState<RestTimerState>({
    running: false,
    remaining: 0,
    total: 0,
    range: null,
  });
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    setState((s) => ({ ...s, running: false, remaining: 0 }));
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback((range: [number, number]) => {
    if (interval.current) clearInterval(interval.current);
    const total = range[0];
    setState({ running: true, remaining: total, total, range });
    interval.current = setInterval(() => {
      setState((s) => {
        if (!s.running) return s;
        const next = s.remaining - 1;
        if (next <= 0) {
          if (interval.current) clearInterval(interval.current);
          interval.current = null;
          notifyRestEnd();
          return { ...s, running: false, remaining: 0 };
        }
        return { ...s, remaining: next };
      });
    }, 1000);
  }, []);

  const add = useCallback((seconds: number) => {
    setState((s) =>
      s.running ? { ...s, remaining: s.remaining + seconds, total: s.total + seconds } : s,
    );
  }, []);

  return { ...state, start, add, skip: stop };
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
