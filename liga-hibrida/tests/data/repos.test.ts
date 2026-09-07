import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LigaDB, PROFILE_ID } from '@/data/db';
import {
  activeSession,
  consecutiveAdductorKo,
  deleteRegen,
  deleteRoute,
  deleteSession,
  deleteWild,
  ensureMedals,
  ensureWeek,
  getCheckin,
  getMedal,
  getProfile,
  getSession,
  getWeek,
  lastCompletedSession,
  lastExerciseLogs,
  lastWeight,
  listAdjustments,
  listCheckins,
  listMedals,
  listRegen,
  listRoutes,
  listSessions,
  listTests,
  listWeeks,
  listWild,
  saveAdjustment,
  saveCheckin,
  saveMedal,
  saveProfile,
  saveRegen,
  saveRoute,
  saveSession,
  saveTest,
  saveWeek,
  saveWild,
  sessionsOnDate,
  symptomHistoryBefore,
  updateProfile,
  weightSeries,
} from '@/data/repos';
import { GYM_ORDER } from '@/domain/content/gyms';
import { buildWeekPlan } from '@/domain/content/week';
import type { Checkin, ISODate, Profile, SessionLog } from '@/domain/types';

const PROFILE: Profile = {
  name: 'Daniel',
  heightCm: 190,
  startWeightKg: 80,
  targetWeightKg: [85, 88],
  amWindow: ['07:00', '09:00'],
  pmWindow: ['18:00', '20:00'],
  blockStart: '2026-09-07',
  form: 1,
  baselines: { bench_press: { loadKg: 80, reps: 8, date: '2026-09-01' } },
};

function checkin(date: ISODate, patch: Partial<Checkin> = {}): Checkin {
  return {
    date,
    sleepHours: 8,
    energy: 4,
    legs: 4,
    wrist: 1,
    adductor: 1,
    pv: 90,
    status: 'ok',
    ...patch,
  };
}

function session(id: string, date: ISODate, patch: Partial<SessionLog> = {}): SessionLog {
  return {
    id,
    date,
    gymId: 'cantera',
    weekOfBlock: 1,
    version: 60,
    statusAtStart: 'ok',
    energyStart: 4,
    exercises: [],
    completed: true,
    ...patch,
  };
}

function benchSets(loadKg: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({ setIndex: i, loadKg, reps: 8, rir: 2 }));
}

let database: LigaDB;

beforeEach(() => {
  database = new LigaDB(`test-${Math.random().toString(36).slice(2)}`);
});

afterEach(async () => {
  await database.delete();
});

describe('profile repository', () => {
  it('saveProfile upserts the single row with id "me" and updateProfile patches it', async () => {
    expect(await getProfile(database)).toBeUndefined();

    await saveProfile(PROFILE, database);
    const stored = await getProfile(database);
    expect(stored).toEqual({ ...PROFILE, id: PROFILE_ID });

    await saveProfile({ ...PROFILE, heightCm: 191 }, database);
    expect(await database.profile.count()).toBe(1);
    expect((await getProfile(database))?.heightCm).toBe(191);

    await updateProfile({ name: 'Dani', kcalTarget: 3200 }, database);
    const updated = await getProfile(database);
    expect(updated?.name).toBe('Dani');
    expect(updated?.kcalTarget).toBe(3200);
    expect(updated?.heightCm).toBe(191);
    expect(updated?.baselines).toEqual(PROFILE.baselines);
    expect(await database.profile.count()).toBe(1);
  });

  it('updateProfile throws when there is no profile yet', async () => {
    await expect(updateProfile({ name: 'Dani' }, database)).rejects.toThrow(/perfil/);
  });
});

describe('check-in repository', () => {
  it('listCheckins returns ascending by date; limit keeps the most recent N', async () => {
    for (const date of ['2026-09-03', '2026-09-01', '2026-09-05', '2026-09-02']) {
      await saveCheckin(checkin(date), database);
    }

    const all = await listCheckins({}, database);
    expect(all.map((c) => c.date)).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-05',
    ]);

    const lastTwo = await listCheckins({ limit: 2 }, database);
    expect(lastTwo.map((c) => c.date)).toEqual(['2026-09-03', '2026-09-05']);

    const ranged = await listCheckins({ from: '2026-09-02', to: '2026-09-03' }, database);
    expect(ranged.map((c) => c.date)).toEqual(['2026-09-02', '2026-09-03']);

    const rangedLimited = await listCheckins({ to: '2026-09-03', limit: 1 }, database);
    expect(rangedLimited.map((c) => c.date)).toEqual(['2026-09-03']);
    expect(await listCheckins({ limit: 0 }, database)).toEqual([]);
  });

  it('saveCheckin replaces the check-in of the same date', async () => {
    await saveCheckin(checkin('2026-09-07', { pv: 60 }), database);
    await saveCheckin(checkin('2026-09-07', { pv: 75, weightKg: 80 }), database);
    expect(await database.checkins.count()).toBe(1);
    expect(await getCheckin('2026-09-07', database)).toMatchObject({ pv: 75, weightKg: 80 });
  });

  it('symptomHistoryBefore returns the previous 2 check-ins oldest first, ignoring today and later, with gaps', async () => {
    await saveCheckin(checkin('2026-09-01', { wrist: 1, adductor: 1 }), database);
    await saveCheckin(checkin('2026-09-03', { wrist: 2, adductor: 2 }), database);
    await saveCheckin(checkin('2026-09-05', { wrist: 3, adductor: 3 }), database);
    await saveCheckin(checkin('2026-09-06', { wrist: 9, adductor: 9 }), database); // today
    await saveCheckin(checkin('2026-09-07', { wrist: 8, adductor: 8 }), database); // later

    expect(await symptomHistoryBefore('2026-09-06', 2, database)).toEqual([
      { wrist: 2, adductor: 2 },
      { wrist: 3, adductor: 3 },
    ]);
    expect(await symptomHistoryBefore('2026-09-06', undefined, database)).toHaveLength(2);
    expect(await symptomHistoryBefore('2026-09-06', 3, database)).toEqual([
      { wrist: 1, adductor: 1 },
      { wrist: 2, adductor: 2 },
      { wrist: 3, adductor: 3 },
    ]);
    // A day without a check-in still looks at the records before it.
    expect(await symptomHistoryBefore('2026-09-04', 2, database)).toEqual([
      { wrist: 1, adductor: 1 },
      { wrist: 2, adductor: 2 },
    ]);
    expect(await symptomHistoryBefore('2026-09-01', 2, database)).toEqual([]);
  });

  it('consecutiveAdductorKo counts a 3-day streak and resets on a day below 5', async () => {
    await saveCheckin(checkin('2026-09-01', { adductor: 2 }), database);
    await saveCheckin(checkin('2026-09-02', { adductor: 5 }), database);
    await saveCheckin(checkin('2026-09-03', { adductor: 6 }), database);
    await saveCheckin(checkin('2026-09-04', { adductor: 7 }), database);

    expect(await consecutiveAdductorKo('2026-09-04', database)).toBe(3);
    expect(await consecutiveAdductorKo('2026-09-03', database)).toBe(2);
    expect(await consecutiveAdductorKo('2026-09-02', database)).toBe(1);
    expect(await consecutiveAdductorKo('2026-09-01', database)).toBe(0);

    await saveCheckin(checkin('2026-09-05', { adductor: 3 }), database);
    expect(await consecutiveAdductorKo('2026-09-05', database)).toBe(0);
    expect(await consecutiveAdductorKo('2026-09-04', database)).toBe(3);

    // A date without a check-in reports the streak of the latest records before it.
    expect(await consecutiveAdductorKo('2026-09-06', database)).toBe(0);
    await saveCheckin(checkin('2026-09-06', { adductor: 8 }), database);
    expect(await consecutiveAdductorKo('2026-09-06', database)).toBe(1);
    expect(await consecutiveAdductorKo('2026-09-07', database)).toBe(1);
  });

  it('weightSeries ignores check-ins without weight and lastWeight returns the latest one', async () => {
    expect(await weightSeries({}, database)).toEqual([]);
    expect(await lastWeight(database)).toBeUndefined();

    await saveCheckin(checkin('2026-09-01', { weightKg: 80 }), database);
    await saveCheckin(checkin('2026-09-02'), database);
    await saveCheckin(checkin('2026-09-03', { weightKg: 80.5 }), database);
    await saveCheckin(checkin('2026-09-10', { weightKg: 81 }), database);
    await saveCheckin(checkin('2026-09-11'), database);

    expect(await weightSeries({}, database)).toEqual([
      { date: '2026-09-01', value: 80 },
      { date: '2026-09-03', value: 80.5 },
      { date: '2026-09-10', value: 81 },
    ]);
    expect(await weightSeries({ days: 8, until: '2026-09-10' }, database)).toEqual([
      { date: '2026-09-03', value: 80.5 },
      { date: '2026-09-10', value: 81 },
    ]);
    expect(await weightSeries({ days: 1, until: '2026-09-10' }, database)).toEqual([
      { date: '2026-09-10', value: 81 },
    ]);
    expect(await weightSeries({ until: '2026-09-02' }, database)).toEqual([
      { date: '2026-09-01', value: 80 },
    ]);
    expect(await weightSeries({ days: 0 }, database)).toEqual([]);
    expect(await lastWeight(database)).toEqual({ date: '2026-09-10', value: 81 });
  });
});

describe('session repository', () => {
  it('lastExerciseLogs returns most recent first, only completed sessions and only logs with sets', async () => {
    await saveSession(
      session('s1', '2026-09-01', {
        exercises: [{ exerciseId: 'bench_press', sets: benchSets(80, 3) }],
      }),
      database,
    );
    await saveSession(
      session('s2', '2026-09-03', {
        exercises: [{ exerciseId: 'bench_press', sets: [], skipped: true }],
      }),
      database,
    );
    await saveSession(
      session('s3', '2026-09-05', {
        exercises: [
          { exerciseId: 'weighted_pullup', sets: benchSets(20, 3) },
          { exerciseId: 'bench_press', sets: benchSets(82.5, 2) },
        ],
      }),
      database,
    );
    await saveSession(
      session('s4', '2026-09-07', {
        completed: false,
        exercises: [{ exerciseId: 'bench_press', sets: benchSets(85, 1) }],
      }),
      database,
    );

    const entries = await lastExerciseLogs('bench_press', {}, database);
    expect(entries.map((e) => e.session.id)).toEqual(['s3', 's1']);
    expect(entries[0].log.sets).toHaveLength(2);
    expect(entries[0].log.sets[0].loadKg).toBe(82.5);

    expect(
      (await lastExerciseLogs('bench_press', { count: 1 }, database)).map((e) => e.session.id),
    ).toEqual(['s3']);
    expect(
      (await lastExerciseLogs('bench_press', { before: '2026-09-05' }, database)).map(
        (e) => e.session.id,
      ),
    ).toEqual(['s1']);
    expect(await lastExerciseLogs('hack_squat', {}, database)).toEqual([]);
  });

  it('activeSession finds the unfinished one (most recent first)', async () => {
    expect(await activeSession(database)).toBeUndefined();

    await saveSession(session('done', '2026-09-07'), database);
    expect(await activeSession(database)).toBeUndefined();

    await saveSession(session('open-old', '2026-09-08', { completed: false }), database);
    await saveSession(
      session('open-am', '2026-09-10', { completed: false, startedAt: '2026-09-10T07:30:00' }),
      database,
    );
    await saveSession(
      session('open-pm', '2026-09-10', { completed: false, startedAt: '2026-09-10T18:00:00' }),
      database,
    );
    expect((await activeSession(database))?.id).toBe('open-pm');

    await saveSession(session('open-pm', '2026-09-10', { completed: true }), database);
    expect((await activeSession(database))?.id).toBe('open-am');
  });

  it('listSessions filters by gym, range and completion, most recent first; helpers agree', async () => {
    await saveSession(session('c1', '2026-09-07', { gymId: 'cantera' }), database);
    await saveSession(session('y1', '2026-09-08', { gymId: 'yunque' }), database);
    await saveSession(session('c2', '2026-09-14', { gymId: 'cantera' }), database);
    await saveSession(
      session('c3', '2026-09-21', { gymId: 'cantera', completed: false }),
      database,
    );
    await saveSession(
      session('y2', '2026-09-22', { gymId: 'yunque', startedAt: '2026-09-22T07:00:00' }),
      database,
    );
    await saveSession(
      session('y3', '2026-09-22', { gymId: 'yunque', startedAt: '2026-09-22T18:00:00' }),
      database,
    );

    const ids = (rows: SessionLog[]) => rows.map((s) => s.id);
    expect(ids(await listSessions({}, database))).toEqual(['y3', 'y2', 'c3', 'c2', 'y1', 'c1']);
    expect(ids(await listSessions({ gymId: 'cantera' }, database))).toEqual(['c3', 'c2', 'c1']);
    expect(ids(await listSessions({ gymId: 'cantera', completedOnly: true }, database))).toEqual([
      'c2',
      'c1',
    ]);
    expect(ids(await listSessions({ from: '2026-09-08', to: '2026-09-21' }, database))).toEqual([
      'c3',
      'c2',
      'y1',
    ]);
    expect(ids(await listSessions({ gymId: 'yunque', from: '2026-09-22' }, database))).toEqual([
      'y3',
      'y2',
    ]);
    expect(ids(await listSessions({ limit: 2 }, database))).toEqual(['y3', 'y2']);

    expect((await lastCompletedSession('cantera', database))?.id).toBe('c2');
    expect(await lastCompletedSession('resorte', database)).toBeUndefined();
    expect(ids(await sessionsOnDate('2026-09-22', database))).toEqual(['y2', 'y3']);
    expect(await sessionsOnDate('2026-09-01', database)).toEqual([]);

    expect((await getSession('c1', database))?.gymId).toBe('cantera');
    await deleteSession('c1', database);
    expect(await getSession('c1', database)).toBeUndefined();
    expect(ids(await listSessions({ gymId: 'cantera' }, database))).toEqual(['c3', 'c2']);
  });
});

describe('week repository', () => {
  it('ensureWeek creates the plan once, then returns the stored one', async () => {
    expect(await getWeek('2026-09-07', database)).toBeUndefined();

    const created = await ensureWeek({ weekStart: '2026-09-07', weekOfBlock: 1 }, database);
    expect(created).toEqual(buildWeekPlan({ weekStart: '2026-09-07', weekOfBlock: 1 }));
    expect(created.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 60 });
    expect(await getWeek('2026-09-07', database)).toEqual(created);

    const edited = {
      ...created,
      substitutions: [{ date: '2026-09-11', removed: 'Ruta bici', reason: 'MTB del sábado' }],
    };
    await saveWeek(edited, database);

    const again = await ensureWeek(
      { weekStart: '2026-09-07', weekOfBlock: 1, template: 'surf' },
      database,
    );
    expect(again).toEqual(edited);
    expect(again.template).toBe('estandar');

    const second = await ensureWeek(
      { weekStart: '2026-09-14', weekOfBlock: 2, template: 'montana' },
      database,
    );
    expect(second.template).toBe('montana');
    expect(second.wave).toBe(1);

    const deload = await ensureWeek({ weekStart: '2026-09-28', weekOfBlock: 4 }, database);
    expect(deload.wave).toBe('deload');

    expect((await listWeeks(database)).map((w) => w.weekStart)).toEqual([
      '2026-09-07',
      '2026-09-14',
      '2026-09-28',
    ]);
  });
});

describe('route / wild / regen logs', () => {
  it('lists ascending by date within the range and deletes by id', async () => {
    await saveRoute(
      { id: 'r2', date: '2026-09-11', kind: 'bike', minutes: 50, rpe: 4, countsAs: 'z2' },
      database,
    );
    await saveRoute(
      { id: 'r1', date: '2026-09-08', kind: 'run', minutes: 45, rpe: 5, countsAs: 'z2' },
      database,
    );
    await saveWild(
      { id: 'w1', date: '2026-09-12', kind: 'mtb', minutes: 120, intensity: 'dura' },
      database,
    );
    await saveRegen({ id: 'g1', date: '2026-09-09', kind: 'yoga', minutes: 40 }, database);
    await saveRegen({ id: 'g2', date: '2026-09-13', kind: 'sauna', minutes: 15 }, database);

    expect((await listRoutes({}, database)).map((r) => r.id)).toEqual(['r1', 'r2']);
    expect((await listRoutes({ from: '2026-09-09' }, database)).map((r) => r.id)).toEqual(['r2']);
    expect((await listWild({}, database)).map((w) => w.id)).toEqual(['w1']);
    expect((await listRegen({ to: '2026-09-09' }, database)).map((g) => g.id)).toEqual(['g1']);

    await deleteRoute('r1', database);
    await deleteWild('w1', database);
    await deleteRegen('g2', database);
    expect((await listRoutes({}, database)).map((r) => r.id)).toEqual(['r2']);
    expect(await listWild({}, database)).toEqual([]);
    expect((await listRegen({}, database)).map((g) => g.id)).toEqual(['g1']);
  });
});

describe('league repository', () => {
  it('ensureMedals creates the 4 medals in gym order, then is idempotent', async () => {
    expect(await listMedals(database)).toEqual([]);

    const medals = await ensureMedals(database);
    expect(medals.map((m) => m.id)).toEqual([...GYM_ORDER]);
    expect(medals.every((m) => m.progress === 0)).toBe(true);
    expect(await database.medals.count()).toBe(4);

    await saveMedal({ id: 'cantera', progress: 50 }, database);
    const again = await ensureMedals(database);
    expect(again).toHaveLength(4);
    expect(again[0]).toEqual({ id: 'cantera', progress: 50 });
    expect(await database.medals.count()).toBe(4);
    expect(await getMedal('cantera', database)).toEqual({ id: 'cantera', progress: 50 });

    // A missing medal is recreated without touching the others.
    await database.medals.delete('resorte');
    const restored = await ensureMedals(database);
    expect(restored.map((m) => m.id)).toEqual([...GYM_ORDER]);
    expect(restored[0].progress).toBe(50);
    expect(restored[2]).toEqual({ id: 'resorte', progress: 0 });
  });

  it('tests list ascending and adjustments descending by date', async () => {
    await saveTest({ id: 't8', date: '2026-11-01', weekOfBlock: 8 }, database);
    await saveTest(
      { id: 't4', date: '2026-10-04', weekOfBlock: 4, pullupRir2: { loadKg: 20, reps: 6 } },
      database,
    );
    expect((await listTests(database)).map((t) => t.id)).toEqual(['t4', 't8']);

    await saveAdjustment(
      { id: 'a1', date: '2026-09-27', kind: 'kcal', detail: '+150 kcal/día', source: 'app' },
      database,
    );
    await saveAdjustment(
      { id: 'a2', date: '2026-10-11', kind: 'plan', detail: 'Semana surf', source: 'daniel' },
      database,
    );
    expect((await listAdjustments(database)).map((a) => a.id)).toEqual(['a2', 'a1']);
  });
});
