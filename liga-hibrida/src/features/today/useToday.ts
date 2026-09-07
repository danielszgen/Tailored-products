// Gathers everything HOY needs (SPEC §8.2). Reads through Dexie live queries.
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
  useProfile,
  useWeek,
} from '@/data';
import { adjustSessionForStatus, computePv, type PvResult } from '@/domain/rules/pv';
import type { SessionAdjustment } from '@/domain/rules/pv';
import { BLOCK_WEEKS } from '@/domain/content/block';
import type { DayIndex, GymId, ISODate, PlannedDay } from '@/domain/types';
import { addDaysISO, dayIndexOf, todayISO, weekOfBlock, weekStartOf } from '@/lib/date';

export function useToday(today: ISODate = todayISO()) {
  const profile = useProfile();
  const checkin = useCheckin(today);
  const activeSession = useActiveSession();
  const weekStart = weekStartOf(today);
  const week = useWeek(weekStart);
  const dayIndex: DayIndex = dayIndexOf(today);

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
  const yesterday = useCheckin(addDaysISO(today, -1));

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

  const adjustmentFor = (gymId: GymId): SessionAdjustment | null => {
    if (!pvResult) return null;
    return adjustSessionForStatus({
      status: pvResult.status,
      koSource: pvResult.koSource,
      gymId,
      adductorKoStreak: koStreak ?? 0,
    });
  };

  return {
    today,
    profile,
    checkin,
    pvResult,
    history: history ?? [],
    koStreak: koStreak ?? 0,
    week,
    weekOfBlock: wob,
    inBlock,
    day,
    dayIndex,
    activeSession,
    todaySessions: todaySessions ?? [],
    lastWeight: lastWeightEntry,
    yesterday,
    adjustmentFor,
  };
}

export type TodayModel = ReturnType<typeof useToday>;
