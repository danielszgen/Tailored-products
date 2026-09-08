// Which earned medals have already been celebrated on this device (the pop animation plays once).
// DECISION: per-device localStorage like the daily checklist; see docs/PREGUNTAS.md.
import type { GymId } from '@/domain/types';

const KEY = 'liga-hibrida:medals-seen';

export function seenMedals(): GymId[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GymId[]) : [];
  } catch {
    return [];
  }
}

export function markMedalsSeen(ids: GymId[]): void {
  try {
    const next = Array.from(new Set([...seenMedals(), ...ids]));
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
