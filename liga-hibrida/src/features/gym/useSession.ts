// Combat session state: loads/creates today's SessionLog for a gym, persists every change and
// computes the R2 suggestion of every exercise from the last sessions and today's context.
import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { lastExerciseLogs, listSessions, saveSession } from '@/data';
import { exercisesForVersion, GYMS, HIGH_BAR_SQUAT } from '@/domain/content/gyms';
import { waveForWeek } from '@/domain/content/block';
import {
  hardSportBefore,
  lowSleepStreak,
  suggestProgression,
  type ProgressionSession,
  type ProgressionSuggestion,
} from '@/domain/rules/progression';
import type {
  ExerciseLog,
  ExerciseSpec,
  GymId,
  Scale5,
  SessionLog,
  SessionVersion,
  SetLog,
} from '@/domain/types';
import { newId } from '@/lib/id';
import { weekOfBlock } from '@/lib/date';
import { useToday } from '@/features/today/useToday';
import type { PreviousLog } from './suggestion';

export interface FinishInput {
  energyEnd: Scale5;
  wristDuring: number;
  adductorDuring: number;
  feel: 'facil' | 'normal' | 'pesado';
  sportLast24h?: string;
}

function toProgressionSession(entry: PreviousLog): ProgressionSession {
  return {
    date: entry.session.date,
    wave: waveForWeek(entry.session.weekOfBlock),
    statusAtStart: entry.session.statusAtStart,
    feel: entry.session.feel,
    sets: entry.log.sets,
  };
}

export function useSession(gymId: GymId) {
  const today = useToday();
  const gym = GYMS[gymId];
  const [finished, setFinished] = useState<SessionLog | null>(null);

  // Today's sessions for this gym (live). The unfinished one is the active combat.
  const todaysForGym = useLiveQuery(
    () => listSessions({ gymId, from: today.today, to: today.today }),
    [gymId, today.today],
  );
  const session: SessionLog | null | undefined =
    todaysForGym === undefined ? undefined : (todaysForGym.find((s) => !s.completed) ?? null);

  const adjustment = useMemo(() => {
    if (!today.pvResult) return null;
    return today.adjustmentFor(gymId);
  }, [today, gymId]);

  const version: SessionVersion = session?.version ?? 60;
  const squatVariant = today.profile?.squatVariant;
  const exercises: ExerciseSpec[] = useMemo(() => {
    const omitted = new Set(adjustment?.omitExerciseIds ?? []);
    return exercisesForVersion(gym, version, { squatVariant }).filter((e) => !omitted.has(e.id));
  }, [gym, version, adjustment, squatVariant]);

  const catalogue = useMemo(
    () => (gymId === 'cantera' ? [...gym.main, HIGH_BAR_SQUAT] : gym.main),
    [gym, gymId],
  );

  const previous = useLiveQuery(async () => {
    const entries = await Promise.all(
      catalogue.map(
        async (e) =>
          [e.id, await lastExerciseLogs(e.id, { count: 3, before: today.today })] as const,
      ),
    );
    return Object.fromEntries(entries) as Record<string, PreviousLog[]>;
  }, [catalogue, today.today]);

  const wave = today.wave ?? 1;
  const status = today.pvResult?.status ?? 'ok';
  const hardSport = hardSportBefore(today.today, today.wildNear, today.routesNear);
  const lowSleep = lowSleepStreak(today.checkins28, today.today);
  const baselines = today.profile?.baselines;

  const suggestions: Record<string, ProgressionSuggestion> = useMemo(() => {
    const out: Record<string, ProgressionSuggestion> = {};
    for (const spec of catalogue) {
      out[spec.id] = suggestProgression({
        spec,
        history: (previous?.[spec.id] ?? []).map(toProgressionSession),
        status,
        wave,
        baseline: baselines?.[spec.id],
        hardSportLast24h: hardSport,
        lowSleepStreak: lowSleep,
        accessorySetDelta: adjustment?.accessorySetDelta ?? 0,
        rirDelta: adjustment?.rirDelta ?? 0,
      });
    }
    return out;
  }, [catalogue, previous, status, wave, baselines, hardSport, lowSleep, adjustment]);

  const start = useCallback(
    async (params: { version: SessionVersion; energyStart: Scale5 }) => {
      const profile = today.profile;
      const log: SessionLog = {
        id: newId('session'),
        date: today.today,
        gymId,
        weekOfBlock: profile ? weekOfBlock(today.today, profile.blockStart) : 0,
        version: params.version,
        statusAtStart: today.pvResult?.status ?? 'ok',
        energyStart: params.energyStart,
        exercises: [],
        completed: false,
        warmupDone: false,
        startedAt: new Date().toISOString(),
      };
      await saveSession(log);
    },
    [gymId, today.today, today.profile, today.pvResult],
  );

  const persist = useCallback(async (next: SessionLog) => {
    await saveSession(next);
  }, []);

  const completeWarmup = useCallback(async () => {
    if (!session) return;
    await persist({ ...session, warmupDone: true });
  }, [session, persist]);

  const logSet = useCallback(
    async (exerciseId: string, set: Omit<SetLog, 'setIndex'>) => {
      if (!session) return;
      const exercisesLog = [...session.exercises];
      const idx = exercisesLog.findIndex((e) => e.exerciseId === exerciseId);
      const current: ExerciseLog = idx >= 0 ? exercisesLog[idx] : { exerciseId, sets: [] };
      const updated: ExerciseLog = {
        ...current,
        skipped: false,
        sets: [...current.sets, { ...set, setIndex: current.sets.length + 1 }],
      };
      if (idx >= 0) exercisesLog[idx] = updated;
      else exercisesLog.push(updated);
      await persist({ ...session, exercises: exercisesLog });
    },
    [session, persist],
  );

  const removeLastSet = useCallback(
    async (exerciseId: string) => {
      if (!session) return;
      const exercisesLog = session.exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
      );
      await persist({ ...session, exercises: exercisesLog });
    },
    [session, persist],
  );

  const skipExercise = useCallback(
    async (exerciseId: string, skipped: boolean) => {
      if (!session) return;
      const exercisesLog = [...session.exercises];
      const idx = exercisesLog.findIndex((e) => e.exerciseId === exerciseId);
      if (idx >= 0) exercisesLog[idx] = { ...exercisesLog[idx], skipped };
      else exercisesLog.push({ exerciseId, sets: [], skipped });
      await persist({ ...session, exercises: exercisesLog });
    },
    [session, persist],
  );

  const finish = useCallback(
    async (input: FinishInput) => {
      if (!session) return;
      const finishedAt = new Date().toISOString();
      const started = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
      const done: SessionLog = {
        ...session,
        ...input,
        sportLast24h: input.sportLast24h?.trim() || undefined,
        completed: true,
        finishedAt,
        durationMin: Math.max(0, Math.round((new Date(finishedAt).getTime() - started) / 60000)),
      };
      await persist(done);
      setFinished(done);
    },
    [session, persist],
  );

  return {
    today,
    gym,
    session,
    finished,
    adjustment,
    exercises,
    previous: previous ?? {},
    suggestions,
    wave,
    start,
    completeWarmup,
    logSet,
    removeLastSet,
    skipExercise,
    finish,
    resetFinished: () => setFinished(null),
  };
}

export type SessionModel = ReturnType<typeof useSession>;
