import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAll } from '@/data/clear';
import { LigaDB, PROFILE_ID, SCHEMA_VERSION, TABLE_NAMES } from '@/data/db';
import { exportAll, exportFileName, serializeExport } from '@/data/export';
import { ImportError, importAll, parseExport } from '@/data/import';
import { ensureMedals, ensureWeek, listCheckins, saveCheckin } from '@/data/repos';
import { EXPORT_APP, type ExportFile } from '@/data/schema';
import type { Checkin, ISODate } from '@/domain/types';

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

/** Writes at least one row into every table. */
async function seedEverything(database: LigaDB): Promise<void> {
  await database.checkins.bulkPut([
    checkin('2026-09-07', { weightKg: 80.2, note: 'Primer día' }),
    checkin('2026-09-08', {
      sleepHours: 6.5,
      energy: 3,
      legs: 2,
      adductor: 5,
      pv: 55,
      status: 'ko',
    }),
  ]);
  await database.sessions.bulkPut([
    {
      id: 'ses-1',
      date: '2026-09-07',
      gymId: 'cantera',
      weekOfBlock: 1,
      version: 60,
      statusAtStart: 'ok',
      energyStart: 4,
      energyEnd: 3,
      adductorAfter: 2,
      feel: 'normal',
      exercises: [
        {
          exerciseId: 'hack_squat',
          sets: [
            { setIndex: 0, loadKg: 60, reps: 8, rir: 3 },
            { setIndex: 1, loadKg: 60, reps: 8, rir: 2 },
          ],
        },
        {
          exerciseId: 'bulgarian_split_squat',
          sets: [{ setIndex: 0, loadKg: 12, reps: 8, rir: 2, side: 'L' }],
        },
        { exerciseId: 'standing_calf_raise', sets: [], skipped: true },
      ],
      durationMin: 58,
      completed: true,
      warmupDone: true,
      startedAt: '2026-09-07T07:30:00.000Z',
      finishedAt: '2026-09-07T08:28:00.000Z',
    },
    {
      id: 'ses-2',
      date: '2026-09-08',
      gymId: 'yunque',
      weekOfBlock: 1,
      version: 45,
      statusAtStart: 'ko',
      energyStart: 3,
      exercises: [],
      completed: false,
      startedAt: '2026-09-08T07:30:00.000Z',
    },
  ]);
  await database.routes.put({
    id: 'route-1',
    date: '2026-09-08',
    kind: 'run',
    minutes: 50,
    rpe: 4,
    elevationM: 120,
    countsAs: 'z2',
  });
  await database.wild.put({
    id: 'wild-1',
    date: '2026-09-12',
    kind: 'mtb',
    minutes: 120,
    intensity: 'dura',
    note: 'Sierra',
  });
  await database.regen.put({ id: 'regen-1', date: '2026-09-13', kind: 'yoga', minutes: 40 });
  await ensureWeek({ weekStart: '2026-09-07', weekOfBlock: 1 }, database);
  await ensureWeek({ weekStart: '2026-09-14', weekOfBlock: 2, template: 'viaje' }, database);
  await database.tests.put({
    id: 'test-1',
    date: '2026-10-04',
    weekOfBlock: 4,
    pullupRir2: { loadKg: 20, reps: 6 },
    dipRir2: { loadKg: 25, reps: 8 },
    splitSquat: [
      { loadKg: 20, reps: 8, side: 'L' },
      { loadKg: 20, reps: 8, side: 'R' },
    ],
    z2Standard: { routeKind: 'run', minutes: 45, rpe: 4, hrAvg: 140 },
    handstand: { wallSec: 30, freeSec: 5 },
    mobility: { ankleCm: 12, wristExtDeg: 70 },
    waistCm: 84,
    weightAvg7: 80.4,
    transferNote: 'Sin cambios',
  });
  await ensureMedals(database);
  await database.medals.put({ id: 'cantera', progress: 40 });
  await database.adjustments.put({
    id: 'adj-1',
    date: '2026-09-27',
    kind: 'kcal',
    detail: '+150 a +200 kcal/día',
    source: 'app',
  });
  await database.profile.put({
    id: PROFILE_ID,
    name: 'Daniel',
    heightCm: 190,
    startWeightKg: 80,
    targetWeightKg: [85, 88],
    amWindow: ['07:00', '09:00'],
    pmWindow: ['18:00', '20:00'],
    blockStart: '2026-09-07',
    form: 1,
    baselines: { bench_press: { loadKg: 80, reps: 8, date: '2026-09-01' } },
    kcalBaseline: 3000,
    calorieMode: 'porciones',
    defaultTemplate: 'estandar',
  });
}

function withoutExportedAt(file: ExportFile): Omit<ExportFile, 'exportedAt'> {
  const { exportedAt: _ignored, ...rest } = file;
  return rest;
}

function expectImportError(fn: () => unknown): ImportError {
  try {
    fn();
  } catch (error) {
    if (error instanceof ImportError) return error;
    throw error;
  }
  throw new Error('Expected an ImportError to be thrown');
}

let database: LigaDB;

beforeEach(() => {
  database = new LigaDB(`test-${Math.random().toString(36).slice(2)}`);
});

afterEach(async () => {
  await database.delete();
});

describe('export → clear → import round trip', () => {
  it('exportAll → clearAll → importAll(replace) → exportAll is identical (except exportedAt)', async () => {
    await seedEverything(database);

    const first = await exportAll(database);
    expect(first.app).toBe(EXPORT_APP);
    expect(first.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Number.isNaN(Date.parse(first.exportedAt))).toBe(false);
    for (const name of TABLE_NAMES) expect(first.tables[name].length).toBeGreaterThan(0);
    expect(first.tables.checkins).toHaveLength(2);
    expect(first.tables.medals).toHaveLength(4);

    await clearAll(database);
    const empty = await exportAll(database);
    for (const name of TABLE_NAMES) expect(empty.tables[name]).toEqual([]);

    const counts = await importAll(first, 'replace', database);
    expect(counts).toEqual({
      checkins: 2,
      sessions: 2,
      routes: 1,
      wild: 1,
      regen: 1,
      weeks: 2,
      tests: 1,
      medals: 4,
      adjustments: 1,
      profile: 1,
    });

    const second = await exportAll(database);
    expect(withoutExportedAt(second)).toEqual(withoutExportedAt(first));
  });

  it('survives a JSON round trip through serializeExport/parseExport', async () => {
    await seedEverything(database);
    const file = await exportAll(database);

    const json = serializeExport(file);
    expect(json).toBe(JSON.stringify(file, null, 2));
    expect(parseExport(json)).toEqual(file);
    expect(parseExport(JSON.parse(json))).toEqual(file);

    await clearAll(database);
    await importAll(parseExport(json), 'replace', database);
    expect(withoutExportedAt(await exportAll(database))).toEqual(withoutExportedAt(file));
  });

  it('exportFileName uses the local date', () => {
    expect(exportFileName(new Date(2026, 8, 7, 22, 15))).toBe('liga-hibrida-2026-09-07.json');
  });
});

describe('parseExport validation', () => {
  async function validFile(): Promise<ExportFile> {
    await seedEverything(database);
    return exportAll(database);
  }

  it('rejects a wrong app literal', async () => {
    const file = await validFile();
    const error = expectImportError(() => parseExport({ ...file, app: 'otra-app' }));
    expect(error.name).toBe('ImportError');
    expect(error.message).toMatch(/Liga Híbrida/);
    expect(error.issues.length).toBeGreaterThanOrEqual(1);
    expect(error.issues[0]).toMatch(/^app: /);
  });

  it('rejects a future schemaVersion', async () => {
    const file = await validFile();
    const future = { ...file, schemaVersion: SCHEMA_VERSION + 1 };
    const error = expectImportError(() => parseExport(future));
    expect(error.message).toMatch(/versión más nueva/);
    expect(error.issues.length).toBeGreaterThanOrEqual(1);
    expect(error.issues[0]).toContain('schemaVersion');

    await expect(importAll(future, 'replace', database)).rejects.toBeInstanceOf(ImportError);
  });

  it('rejects a malformed check-in (energy 7) and points at the field', async () => {
    const file = await validFile();
    const broken = {
      ...file,
      tables: { ...file.tables, checkins: [{ ...file.tables.checkins[0], energy: 7 }] },
    };
    const error = expectImportError(() => parseExport(broken));
    expect(error.issues.length).toBeGreaterThanOrEqual(1);
    expect(error.issues[0]).toMatch(/^tables\.checkins\.0\.energy: /);
  });

  it('rejects malformed JSON text, missing tables and bad planned items', async () => {
    expect(expectImportError(() => parseExport('{not json')).issues).toHaveLength(1);
    expect(expectImportError(() => parseExport(null)).issues.length).toBeGreaterThanOrEqual(1);

    const file = await validFile();
    const noTables = {
      app: file.app,
      schemaVersion: file.schemaVersion,
      exportedAt: file.exportedAt,
    };
    expect(expectImportError(() => parseExport(noTables)).issues[0]).toMatch(/^tables: /);

    const week = file.tables.weeks[0];
    const badWeek = {
      ...file,
      tables: {
        ...file.tables,
        weeks: [{ ...week, days: { ...week.days, 0: { ...week.days[0], am: { kind: 'swim' } } } }],
      },
    };
    const error = expectImportError(() => parseExport(badWeek));
    expect(error.issues[0]).toMatch(/^tables\.weeks\.0\.days\.0\.am\.kind: /);
  });

  it('caps the reported issues at 10', () => {
    const checkins = Array.from({ length: 12 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    }));
    const bad = {
      app: EXPORT_APP,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: 'x',
      tables: {
        checkins,
        sessions: [],
        routes: [],
        wild: [],
        regen: [],
        weeks: [],
        tests: [],
        medals: [],
        adjustments: [],
        profile: [],
      },
    };
    const error = expectImportError(() => parseExport(bad));
    expect(error.issues).toHaveLength(10);
  });

  it('accepts unknown extra fields (forward compatibility)', async () => {
    const file = await validFile();
    const extended = {
      ...file,
      futureFlag: true,
      tables: { ...file.tables, checkins: [{ ...file.tables.checkins[0], mood: 'bien' }] },
    };
    expect(() => parseExport(extended)).not.toThrow();
  });
});

describe('importAll modes', () => {
  it('merge keeps existing rows not present in the file and replaces the shared ones', async () => {
    await saveCheckin(checkin('2026-09-01', { pv: 70 }), database);
    await saveCheckin(checkin('2026-09-02', { pv: 71 }), database);
    await ensureMedals(database);

    const file: ExportFile = {
      app: EXPORT_APP,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      tables: {
        checkins: [checkin('2026-09-02', { pv: 99 }), checkin('2026-09-03', { pv: 72 })],
        sessions: [],
        routes: [],
        wild: [],
        regen: [],
        weeks: [],
        tests: [],
        medals: [{ id: 'cantera', progress: 25 }],
        adjustments: [],
        profile: [],
      },
    };

    const counts = await importAll(file, 'merge', database);
    expect(counts.checkins).toBe(2);
    expect(counts.medals).toBe(1);

    const merged = await listCheckins({}, database);
    expect(merged.map((c) => [c.date, c.pv])).toEqual([
      ['2026-09-01', 70],
      ['2026-09-02', 99],
      ['2026-09-03', 72],
    ]);
    expect(await database.medals.count()).toBe(4);
    expect((await database.medals.get('cantera'))?.progress).toBe(25);

    await importAll(file, 'replace', database);
    expect((await listCheckins({}, database)).map((c) => c.date)).toEqual([
      '2026-09-02',
      '2026-09-03',
    ]);
    expect(await database.medals.count()).toBe(1);
  });
});
