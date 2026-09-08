// Best marks and exercise history — SPEC §8.5 "Índice de Movimientos: mejor marca a RIR ≤ 2,
// historial, notas de muñeca/aductor". Reused by R10 (FUERZA stat, Yunque and Resorte medals).
// Pure: sessions → marks. The comparison unit is the spec's own "carga×reps" (SMART 3/4).
import type { GymId, ISODate, SessionLog, SetLog } from '../types';

/** "mejor marca a RIR ≤ 2" (§8.5). */
export const MARK_RIR_MAX = 2;

export interface ExerciseMark {
  exerciseId: string;
  gymId: GymId;
  date: ISODate;
  loadKg: number;
  reps: number;
  seconds?: number;
  rir: number;
  side?: 'L' | 'R';
}

export interface MarkOptions {
  /** Sets with a RIR above this are ignored (default MARK_RIR_MAX). */
  rirMax?: number;
  /** Only sessions on or after this day. */
  from?: ISODate;
  /** Only sessions on or before this day. */
  until?: ISODate;
}

/** "carga×reps" (load × seconds for isometrics): the spec's comparison unit. */
export function markScore(mark: { loadKg: number; reps: number; seconds?: number }): number {
  return mark.loadKg * (mark.seconds ?? mark.reps);
}

/** "(carga+PC)/PC × reps" — relative strength of a weighted bodyweight movement (SMART 4). */
export function relativeStrength(loadKg: number, reps: number, bodyweightKg: number): number {
  if (bodyweightKg <= 0) return 0;
  return ((loadKg + bodyweightKg) / bodyweightKg) * reps;
}

type Comparable = Pick<SetLog, 'loadKg' | 'reps' | 'seconds'>;

/** Higher load wins; on equal load, more reps (or seconds). */
function isBetter(a: Comparable, b: Comparable): boolean {
  if (a.loadKg !== b.loadKg) return a.loadKg > b.loadKg;
  return (a.seconds ?? a.reps) > (b.seconds ?? b.reps);
}

function chronological(sessions: SessionLog[]): SessionLog[] {
  return [...sessions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function inRange(session: SessionLog, opts: MarkOptions): boolean {
  if (!session.completed) return false;
  if (opts.from !== undefined && session.date < opts.from) return false;
  if (opts.until !== undefined && session.date > opts.until) return false;
  return true;
}

/**
 * Best set of `exerciseId` at RIR ≤ rirMax across completed sessions. Ties keep the earliest
 * date (the day the mark was first achieved).
 */
export function bestMark(
  sessions: SessionLog[],
  exerciseId: string,
  opts: MarkOptions = {},
): ExerciseMark | undefined {
  const rirMax = opts.rirMax ?? MARK_RIR_MAX;
  let best: ExerciseMark | undefined;
  for (const session of chronological(sessions)) {
    if (!inRange(session, opts)) continue;
    for (const log of session.exercises) {
      if (log.exerciseId !== exerciseId) continue;
      for (const set of log.sets) {
        if (set.rir > rirMax) continue;
        if (!best || isBetter(set, best)) {
          best = {
            exerciseId,
            gymId: session.gymId,
            date: session.date,
            loadKg: set.loadKg,
            reps: set.reps,
            seconds: set.seconds,
            rir: set.rir,
            side: set.side,
          };
        }
      }
    }
  }
  return best;
}

/** Best mark of every exercise that has at least one set at RIR ≤ rirMax. */
export function allBestMarks(
  sessions: SessionLog[],
  opts: MarkOptions = {},
): Record<string, ExerciseMark> {
  const ids = new Set<string>();
  for (const s of sessions) for (const log of s.exercises) ids.add(log.exerciseId);
  const out: Record<string, ExerciseMark> = {};
  for (const id of ids) {
    const mark = bestMark(sessions, id, opts);
    if (mark) out[id] = mark;
  }
  return out;
}

export interface HistoryEntry {
  date: ISODate;
  gymId: GymId;
  sets: SetLog[];
  /** Best set of that session (highest load, then reps). */
  best: SetLog;
  wristDuring?: number;
  adductorDuring?: number;
  adductorAfter?: number;
  feel?: SessionLog['feel'];
}

/** Sessions that logged sets of `exerciseId`, most recent first (default the last 6). */
export function exerciseHistory(
  sessions: SessionLog[],
  exerciseId: string,
  count = 6,
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const session of chronological(sessions).reverse()) {
    if (!session.completed) continue;
    const log = session.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (!log) continue;
    const best = log.sets.reduce((b, s) => (isBetter(s, b) ? s : b), log.sets[0]);
    entries.push({
      date: session.date,
      gymId: session.gymId,
      sets: log.sets,
      best,
      wristDuring: session.wristDuring,
      adductorDuring: session.adductorDuring,
      adductorAfter: session.adductorAfter,
      feel: session.feel,
    });
    if (entries.length >= count) break;
  }
  return entries;
}
