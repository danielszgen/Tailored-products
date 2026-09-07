// Gathers everything HOY needs (SPEC §8.2) and the day context the other tabs share:
// R1 status, R4 interference, R5 weekend warning, R6 fuel, R8 symptoms, R9 cut plan.
import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  consecutiveAdductorKo,
  ensureWeek,
  lastWeight,
  sessionsOnDate,
  symptomHistoryBefore,
  useActiveSession,
  useCheckin,
  useCheckins,
  useProfile,
  useRoutes,
  useSessions,
  useWeek,
  useWild,
} from '@/data';
import { adjustSessionForStatus, computePv, type PvResult } from '@/domain/rules/pv';
import type { SessionAdjustment } from '@/domain/rules/pv';
import { fuelGuide, type FuelGuide } from '@/domain/rules/fuel';
import {
  activityOf,
  activityOfGym,
  activityOfRoute,
  activityOfWild,
  evaluateDay,
  type Activity,
  type DayEvaluation,
} from '@/domain/rules/interference';
import { cutPlan, cutTriggerText, CUT_SOURCE, type CutPlan } from '@/domain/rules/minimum';
import { weekendLoadAdvisory } from '@/domain/rules/substitution';
import {
  barbellSquatTransition,
  evaluateSymptoms,
  type SymptomReport,
} from '@/domain/rules/symptoms';
import { BLOCK_WEEKS, waveForWeek } from '@/domain/content/block';
import { buildWeekPlan } from '@/domain/content/week';
import type {
  Advisory,
  DayIndex,
  GymId,
  ISODate,
  PlannedDay,
  RouteLog,
  SessionLog,
  WeekPlan,
  WildLog,
} from '@/domain/types';
import { addDaysISO, dayIndexOf, todayISO, weekOfBlock, weekStartOf } from '@/lib/date';

const SYMPTOM_WINDOW_DAYS = 28;

function plannedDayOf(plan: WeekPlan | null | undefined, date: ISODate): PlannedDay | null {
  if (!plan) return null;
  return plan.days[dayIndexOf(date)];
}

/** Activities of a day: planned items (unless a log of the same kind replaces them) plus logs. */
function activitiesOf(params: {
  planned: PlannedDay | null;
  routes: RouteLog[];
  wild: WildLog[];
  sessions: SessionLog[];
  plannedOnly?: boolean;
}): Activity[] {
  const { planned, routes, wild, sessions, plannedOnly } = params;
  const out: Activity[] = [];
  if (planned) {
    for (const item of [planned.am, planned.pm]) {
      if (!item) continue;
      if (!plannedOnly) {
        if (item.kind === 'route' && routes.length > 0) continue;
        if (item.kind === 'wild' && wild.length > 0) continue;
        if (item.kind === 'gym' && sessions.some((s) => s.gymId === item.gymId)) continue;
      }
      out.push(activityOf(item));
    }
  }
  if (!plannedOnly) {
    for (const s of sessions) if (s.completed) out.push(activityOfGym(s.gymId));
    for (const r of routes) out.push(activityOfRoute(r));
    for (const w of wild) out.push(activityOfWild(w));
  }
  return out;
}

export function useToday(today: ISODate = todayISO()) {
  const profile = useProfile();
  const checkin = useCheckin(today);
  const activeSession = useActiveSession();
  const weekStart = weekStartOf(today);
  const week = useWeek(weekStart);
  const dayIndex: DayIndex = dayIndexOf(today);
  const yesterday = addDaysISO(today, -1);
  const tomorrow = addDaysISO(today, 1);
  const nextWeekStored = useWeek(weekStartOf(tomorrow));
  const prevWeekStored = useWeek(weekStartOf(yesterday));

  const wob = profile ? weekOfBlock(today, profile.blockStart) : null;
  const inBlock = wob !== null && wob >= 1 && wob <= BLOCK_WEEKS;

  // Build the week plan lazily the first time HOY opens inside the block.
  useEffect(() => {
    if (profile && week === null && inBlock && wob !== null) {
      void ensureWeek({
        weekStart,
        weekOfBlock: wob,
        template: profile.defaultTemplate ?? 'estandar',
      });
    }
  }, [profile, week, inBlock, wob, weekStart]);

  const history = useLiveQuery(() => symptomHistoryBefore(today, 2), [today]);
  const koStreak = useLiveQuery(() => consecutiveAdductorKo(today), [today, checkin?.adductor]);
  const todaySessions = useLiveQuery(() => sessionsOnDate(today), [today]);
  const lastWeightEntry = useLiveQuery(() => lastWeight(), [checkin?.weightKg]);
  const yesterdayCheckin = useCheckin(yesterday);

  const from28 = addDaysISO(today, -(SYMPTOM_WINDOW_DAYS - 1));
  const checkins28 = useCheckins({ from: from28, to: today });
  const sessions28 = useSessions({ from: from28, to: today, completedOnly: true });
  const routesNear = useRoutes({ from: addDaysISO(today, -2), to: tomorrow });
  const wildNear = useWild({ from: addDaysISO(today, -2), to: tomorrow });

  const pvResult: PvResult | null = useMemo(() => {
    if (!checkin) return null;
    return computePv(
      {
        sleepHours: checkin.sleepHours,
        energy: checkin.energy,
        legs: checkin.legs,
        wrist: checkin.wrist,
        adductor: checkin.adductor,
      },
      history ?? [],
    );
  }, [checkin, history]);

  const day: PlannedDay | null = week ? week.days[dayIndex] : null;

  // Tomorrow / yesterday plans: stored week, or the template when the next week does not exist yet.
  const tomorrowPlan: WeekPlan | null = useMemo(() => {
    if (weekStartOf(tomorrow) === weekStart) return week ?? null;
    if (nextWeekStored) return nextWeekStored;
    if (!profile || wob === null || wob + 1 > BLOCK_WEEKS) return null;
    return buildWeekPlan({
      weekStart: weekStartOf(tomorrow),
      weekOfBlock: wob + 1,
      template: profile.defaultTemplate ?? 'estandar',
    });
  }, [tomorrow, weekStart, week, nextWeekStored, profile, wob]);
  const yesterdayPlan: WeekPlan | null =
    weekStartOf(yesterday) === weekStart ? (week ?? null) : (prevWeekStored ?? null);

  const logsOn = (date: ISODate) => ({
    routes: (routesNear ?? []).filter((r) => r.date === date),
    wild: (wildNear ?? []).filter((w) => w.date === date),
    sessions: (sessions28 ?? []).filter((s) => s.date === date),
  });

  const interference: DayEvaluation = useMemo(() => {
    const t = logsOn(today);
    const y = logsOn(yesterday);
    return evaluateDay({
      today: activitiesOf({ planned: day, ...t, sessions: todaySessions ?? t.sessions }),
      yesterday: activitiesOf({ planned: plannedDayOf(yesterdayPlan, yesterday), ...y }),
      tomorrow: activitiesOf({
        planned: plannedDayOf(tomorrowPlan, tomorrow),
        routes: [],
        wild: [],
        sessions: [],
        plannedOnly: true,
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, routesNear, wildNear, sessions28, todaySessions, yesterdayPlan, tomorrowPlan, today]);

  const symptoms: SymptomReport = useMemo(
    () => evaluateSymptoms({ checkins: checkins28 ?? [], sessions: sessions28 ?? [], today }),
    [checkins28, sessions28, today],
  );

  const fuel: FuelGuide | null = useMemo(() => {
    if (!day) return null;
    const t = logsOn(today);
    const wildMinutes = t.wild.reduce((sum, w) => sum + w.minutes, 0) || undefined;
    const routeMinutes = t.routes.reduce((sum, r) => sum + r.minutes, 0) || undefined;
    const gymDone = (todaySessions ?? []).some((s) => s.completed);
    const doubleDone = gymDone && (t.routes.length > 0 || t.wild.length > 0);
    return fuelGuide(day, { wildMinutes, routeMinutes, doubleDone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, routesNear, wildNear, todaySessions, today]);

  const cut: CutPlan | null = useMemo(() => {
    if (!week) return null;
    return cutPlan({ plan: week, today, checkins: checkins28 ?? [] });
  }, [week, today, checkins28]);

  const transition = useMemo(
    () => barbellSquatTransition(sessions28 ?? [], today),
    [sessions28, today],
  );

  const adjustmentFor = (gymId: GymId): SessionAdjustment | null => {
    if (!pvResult) return null;
    return adjustSessionForStatus({
      status: pvResult.status,
      koSource: pvResult.koSource,
      gymId,
      adductorKoStreak: koStreak ?? 0,
    });
  };

  const plannedGym: GymId | null =
    day?.am?.kind === 'gym' ? day.am.gymId : day?.pm?.kind === 'gym' ? day.pm.gymId : null;

  const advisories: Advisory[] = useMemo(() => {
    const out: Advisory[] = [];
    if (plannedGym && pvResult && pvResult.status !== 'ok') {
      out.push(...(adjustmentFor(plannedGym)?.advisories ?? []));
    }
    out.push(...interference.advisories);
    const weekend = weekendLoadAdvisory(wildNear ?? [], today);
    if (weekend) out.push(weekend);
    out.push(...symptoms.advisories);
    if (cut?.triggered && cut.step !== null) {
      out.push({
        level: 2,
        message: `${cutTriggerText(cut.trigger!, cut.loadedDays)} ${cut.message}`,
        source: CUT_SOURCE,
        id: 'r9_cut',
      });
    }
    if (profile?.squatVariant === 'barbell') {
      const lastCantera = [...(sessions28 ?? [])]
        .filter((s) => s.gymId === 'cantera' && s.adductorAfter !== undefined)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      if (lastCantera && lastCantera.adductorAfter! > 2) {
        out.push({
          level: 1,
          message: `Aductor ${lastCantera.adductorAfter}/10 tras Cantera con sentadilla con barra: el síntoma ha vuelto, regresa a la variante tolerada.`,
          source: '05 §6.5 · R8',
          id: 'r8_squat_revert',
        });
      }
    }
    const seen = new Set<string>();
    return out
      .filter((a) => {
        const key = a.id ?? a.message;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.level - b.level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plannedGym,
    pvResult,
    koStreak,
    interference,
    wildNear,
    symptoms,
    cut,
    profile,
    sessions28,
    today,
  ]);

  return {
    today,
    yesterday,
    tomorrow,
    profile,
    checkin,
    pvResult,
    history: history ?? [],
    koStreak: koStreak ?? 0,
    week,
    weekStart,
    weekOfBlock: wob,
    wave: wob !== null ? waveForWeek(wob) : null,
    inBlock,
    day,
    dayIndex,
    plannedGym,
    tomorrowPlan,
    activeSession,
    todaySessions: todaySessions ?? [],
    sessions28: sessions28 ?? [],
    checkins28: checkins28 ?? [],
    routesNear: routesNear ?? [],
    wildNear: wildNear ?? [],
    lastWeight: lastWeightEntry,
    yesterdayCheckin,
    interference,
    symptoms,
    fuel,
    cut,
    transition,
    advisories,
    adjustmentFor,
  };
}

export type TodayModel = ReturnType<typeof useToday>;
