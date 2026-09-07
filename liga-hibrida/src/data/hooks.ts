// React live-query hooks over the repositories (dexie-react-hooks). They always use the app
// singleton `db`. Conventions: `undefined` = still loading, `null` = loaded but nothing stored.
import { useLiveQuery } from 'dexie-react-hooks';
import type {
  Adjustment,
  Checkin,
  ISODate,
  Medal,
  RegenLog,
  RouteLog,
  SessionLog,
  WeekPlan,
  WildLog,
} from '@/domain/types';
import type { StoredProfile } from './db';
import {
  activeSession,
  getCheckin,
  getProfile,
  getWeek,
  listAdjustments,
  listCheckins,
  listMedals,
  listRegen,
  listRoutes,
  listSessions,
  listWeeks,
  listWild,
  weightSeries,
  type DateRangeOptions,
  type ListCheckinsOptions,
  type ListSessionsOptions,
  type WeightPoint,
} from './repos';

export function useProfile(): StoredProfile | null | undefined {
  return useLiveQuery(async () => (await getProfile()) ?? null, []);
}

export function useCheckin(date: ISODate): Checkin | null | undefined {
  return useLiveQuery(async () => (await getCheckin(date)) ?? null, [date]);
}

export function useCheckins(opts: ListCheckinsOptions = {}): Checkin[] | undefined {
  const { from, to, limit } = opts;
  return useLiveQuery(() => listCheckins({ from, to, limit }), [from, to, limit]);
}

export function useWeek(weekStart: ISODate): WeekPlan | null | undefined {
  return useLiveQuery(async () => (await getWeek(weekStart)) ?? null, [weekStart]);
}

export function useSessions(opts: ListSessionsOptions = {}): SessionLog[] | undefined {
  const { gymId, from, to, limit, completedOnly } = opts;
  return useLiveQuery(
    () => listSessions({ gymId, from, to, limit, completedOnly }),
    [gymId, from, to, limit, completedOnly],
  );
}

export function useActiveSession(): SessionLog | null | undefined {
  return useLiveQuery(async () => (await activeSession()) ?? null, []);
}

/** Weight points of the last `days` days (whole history when omitted), ascending. */
export function useWeightSeries(days?: number): WeightPoint[] | undefined {
  return useLiveQuery(() => weightSeries({ days }), [days]);
}

/** Stored medals in gym order. Call ensureMedals() once (e.g. after onboarding) to create them. */
export function useMedals(): Medal[] | undefined {
  return useLiveQuery(() => listMedals(), []);
}

export function useRoutes(opts: DateRangeOptions = {}): RouteLog[] | undefined {
  const { from, to } = opts;
  return useLiveQuery(() => listRoutes({ from, to }), [from, to]);
}

export function useWild(opts: DateRangeOptions = {}): WildLog[] | undefined {
  const { from, to } = opts;
  return useLiveQuery(() => listWild({ from, to }), [from, to]);
}

export function useRegen(opts: DateRangeOptions = {}): RegenLog[] | undefined {
  const { from, to } = opts;
  return useLiveQuery(() => listRegen({ from, to }), [from, to]);
}

/** Most recent first. */
export function useAdjustments(): Adjustment[] | undefined {
  return useLiveQuery(() => listAdjustments(), []);
}

/** All stored weeks, ascending. */
export function useWeeks(): WeekPlan[] | undefined {
  return useLiveQuery(() => listWeeks(), []);
}
