// React live-query hooks over the repositories (dexie-react-hooks). They always use the app
// singleton `db`. Conventions: `undefined` = still loading, `null` = loaded but nothing stored.
import { useLiveQuery } from 'dexie-react-hooks';
import type { Checkin, ISODate, Medal, SessionLog, WeekPlan } from '@/domain/types';
import type { StoredProfile } from './db';
import {
  activeSession,
  getCheckin,
  getProfile,
  getWeek,
  listCheckins,
  listMedals,
  listSessions,
  weightSeries,
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
