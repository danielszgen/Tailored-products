// Pure session metrics for the combat summary and history.
import type { SessionLog, SetLog } from '@/domain/types';
import { formatKg } from './suggestion';

/** Σ load × reps over every logged set (isometric sets without reps add 0). */
export function sessionVolume(session: SessionLog): number {
  return session.exercises.reduce(
    (total, ex) => total + ex.sets.reduce((sum, s) => sum + s.loadKg * s.reps, 0),
    0,
  );
}

export function setCount(session: SessionLog): number {
  return session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
}

export interface BestComparison {
  delta: number;
  text: string;
}

/** Compares the best set of today with the previous session's best set. */
export function compareBest(
  current: SetLog | undefined,
  previous: SetLog | undefined,
): BestComparison {
  if (!current) return { delta: 0, text: '—' };
  if (!previous) return { delta: 0, text: 'Primera marca' };
  const delta = current.loadKg - previous.loadKg;
  if (delta > 0) {
    return {
      delta,
      text:
        current.rir <= previous.rir
          ? `+${formatKg(delta)} kg a mismo RIR`
          : `+${formatKg(delta)} kg (RIR ${current.rir} vs ${previous.rir})`,
    };
  }
  if (delta < 0) return { delta, text: `−${formatKg(-delta)} kg` };
  const repDelta = (current.seconds ?? current.reps) - (previous.seconds ?? previous.reps);
  if (repDelta > 0)
    return { delta: 0, text: `+${repDelta} ${current.seconds !== undefined ? 's' : 'reps'}` };
  if (repDelta < 0)
    return { delta: 0, text: `−${-repDelta} ${current.seconds !== undefined ? 's' : 'reps'}` };
  return { delta: 0, text: '=' };
}

export function formatSet(set: SetLog): string {
  const reps = set.seconds !== undefined ? `${set.seconds} s` : `${set.reps}`;
  const side = set.side ? ` ${set.side}` : '';
  return `${formatKg(set.loadKg)} kg × ${reps} @ RIR ${set.rir}${side}`;
}
