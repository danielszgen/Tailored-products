// Pure fixture builders for Etapa II rules (no DB).
import type {
  Checkin,
  GymId,
  ISODate,
  RegenLog,
  RouteLog,
  SessionLog,
  SetLog,
  WildLog,
} from '@/domain/types';
import { addDaysISO } from '@/lib/date';
import { classifyRoute } from '@/domain/content/routes';
import { makeCheckin } from './checkins';

export const WEEK1: ISODate = '2026-09-07';

export function sets(loadKg: number, reps: number[], rir = 2, side?: boolean): SetLog[] {
  return reps.map((r, i) => ({
    setIndex: i + 1,
    loadKg,
    reps: r,
    rir,
    side: side ? (i % 2 === 0 ? 'L' : 'R') : undefined,
  }));
}

export function makeSession(
  gymId: GymId,
  date: ISODate,
  patch: Partial<SessionLog> = {},
): SessionLog {
  return {
    id: `s_${gymId}_${date}`,
    date,
    gymId,
    weekOfBlock: 1,
    version: 60,
    statusAtStart: 'ok',
    energyStart: 4,
    energyEnd: 3,
    exercises: [],
    completed: true,
    ...patch,
  };
}

export function makeRoute(
  date: ISODate,
  minutes: number,
  rpe: number,
  patch: Partial<RouteLog> = {},
): RouteLog {
  return {
    id: `r_${date}_${minutes}`,
    date,
    kind: 'run',
    minutes,
    rpe,
    countsAs: classifyRoute(rpe),
    ...patch,
  };
}

export function makeWild(
  date: ISODate,
  kind: WildLog['kind'],
  minutes: number,
  intensity: WildLog['intensity'],
  patch: Partial<WildLog> = {},
): WildLog {
  return { id: `w_${date}_${kind}`, date, kind, minutes, intensity, ...patch };
}

export function makeRegen(date: ISODate, kind: RegenLog['kind'], minutes = 45): RegenLog {
  return { id: `g_${date}_${kind}`, date, kind, minutes };
}

/** Check-ins for consecutive days starting at `from`. */
export function checkinRun(from: ISODate, days: number, patch: Partial<Checkin> = {}): Checkin[] {
  return Array.from({ length: days }, (_, i) =>
    makeCheckin({ date: addDaysISO(from, i), ...patch }),
  );
}

/** Daily weights rising linearly `pctPerWeek` % per week from `start` kg. */
export function weightsLinear(
  from: ISODate,
  days: number,
  start: number,
  pctPerWeek: number,
): { date: ISODate; value: number }[] {
  return Array.from({ length: days }, (_, i) => ({
    date: addDaysISO(from, i),
    value: Math.round(start * (1 + (pctPerWeek / 100) * (i / 7)) * 1000) / 1000,
  }));
}
