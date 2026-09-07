// Context of an arbitrary day for R4: planned items of that day and its neighbours plus logs.
import { useLiveQuery } from 'dexie-react-hooks';
import { getWeek, listRoutes, listSessions, listWild, useProfile } from '@/data';
import { BLOCK_WEEKS } from '@/domain/content/block';
import { buildWeekPlan } from '@/domain/content/week';
import {
  activityOf,
  activityOfGym,
  activityOfRoute,
  activityOfWild,
  evaluateDay,
  type Activity,
  type DayEvaluation,
} from '@/domain/rules/interference';
import type { ISODate, PlannedDay, WeekPlan } from '@/domain/types';
import { addDaysISO, dayIndexOf, weekOfBlock, weekStartOf } from '@/lib/date';

export interface DayContext {
  loading: boolean;
  plan: WeekPlan | null;
  plannedDay: (date: ISODate) => PlannedDay | null;
  /** Evaluates the day with an extra activity (the one being logged). */
  evaluateWith: (activity: Activity | null, skipPlannedKind?: 'route' | 'wild') => DayEvaluation;
}

export function useDayContext(date: ISODate): DayContext {
  const profile = useProfile();
  const yesterday = addDaysISO(date, -1);
  const tomorrow = addDaysISO(date, 1);

  const data = useLiveQuery(async () => {
    const starts = [...new Set([weekStartOf(yesterday), weekStartOf(date), weekStartOf(tomorrow)])];
    const weeks = await Promise.all(starts.map((s) => getWeek(s)));
    const [routes, wild, sessions] = await Promise.all([
      listRoutes({ from: yesterday, to: tomorrow }),
      listWild({ from: yesterday, to: tomorrow }),
      listSessions({ from: yesterday, to: tomorrow, completedOnly: true }),
    ]);
    return {
      weeks: Object.fromEntries(starts.map((s, i) => [s, weeks[i] ?? null])),
      routes,
      wild,
      sessions,
    };
  }, [date, yesterday, tomorrow]);

  const planOf = (d: ISODate): WeekPlan | null => {
    if (!data) return null;
    const start = weekStartOf(d);
    const stored = data.weeks[start];
    if (stored) return stored;
    if (!profile) return null;
    const wob = weekOfBlock(d, profile.blockStart);
    if (wob < 1 || wob > BLOCK_WEEKS) return null;
    return buildWeekPlan({
      weekStart: start,
      weekOfBlock: wob,
      template: profile.defaultTemplate ?? 'estandar',
    });
  };

  const plannedDay = (d: ISODate): PlannedDay | null => {
    const plan = planOf(d);
    return plan ? plan.days[dayIndexOf(d)] : null;
  };

  const activities = (
    d: ISODate,
    opts: { plannedOnly?: boolean; skip?: 'route' | 'wild' } = {},
  ) => {
    const out: Activity[] = [];
    const day = plannedDay(d);
    const routes = data?.routes.filter((r) => r.date === d) ?? [];
    const wild = data?.wild.filter((w) => w.date === d) ?? [];
    const sessions = data?.sessions.filter((s) => s.date === d) ?? [];
    if (day) {
      for (const item of [day.am, day.pm]) {
        if (!item) continue;
        if (!opts.plannedOnly) {
          if (item.kind === 'route' && (routes.length > 0 || opts.skip === 'route')) continue;
          if (item.kind === 'wild' && (wild.length > 0 || opts.skip === 'wild')) continue;
          if (item.kind === 'gym' && sessions.some((s) => s.gymId === item.gymId)) continue;
        }
        out.push(activityOf(item));
      }
    }
    if (!opts.plannedOnly) {
      for (const s of sessions) out.push(activityOfGym(s.gymId));
      for (const r of routes) out.push(activityOfRoute(r));
      for (const w of wild) out.push(activityOfWild(w));
    }
    return out;
  };

  return {
    loading: data === undefined || profile === undefined,
    plan: planOf(date),
    plannedDay,
    evaluateWith: (activity, skipPlannedKind) =>
      evaluateDay({
        today: [...activities(date, { skip: skipPlannedKind }), ...(activity ? [activity] : [])],
        yesterday: activities(yesterday),
        tomorrow: activities(tomorrow, { plannedOnly: true }),
      }),
  };
}
