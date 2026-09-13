// The daily ticks (creatina and Combustible checklist) and their move out of localStorage.
//
// These used to be per-device values that never appeared in the export, so moving between a
// phone and a computer silently dropped them. The tests that matter here are the ones proving
// the move loses nothing and that a file written before the move still imports.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LigaDB, SCHEMA_VERSION } from '@/data/db';
import { getDayLog, migrateLegacyDayTicks, setChecklistTick, setCreatineTaken } from '@/data/days';
import { exportAll } from '@/data/export';
import { importAll, parseExport } from '@/data/import';
import { EXPORT_APP } from '@/data/schema';

let database: LigaDB;

beforeEach(() => {
  localStorage.clear();
  database = new LigaDB(`test-${Math.random().toString(36).slice(2)}`);
});

afterEach(async () => {
  await database.delete();
  localStorage.clear();
});

describe('the daily ticks', () => {
  it('starts empty and keeps the creatina tick per date', async () => {
    expect(await getDayLog('2026-09-07', database)).toEqual({ date: '2026-09-07' });

    await setCreatineTaken('2026-09-07', true, database);
    expect((await getDayLog('2026-09-07', database)).creatine).toBe(true);
    expect((await getDayLog('2026-09-08', database)).creatine).toBeUndefined();

    await setCreatineTaken('2026-09-07', false, database);
    expect((await getDayLog('2026-09-07', database)).creatine).toBe(false);
  });

  it('adds and removes checklist ticks without touching the rest of the day', async () => {
    await setCreatineTaken('2026-09-07', true, database);
    await setChecklistTick('2026-09-07', 'proteina', true, database);
    await setChecklistTick('2026-09-07', 'fruta', true, database);

    let day = await getDayLog('2026-09-07', database);
    expect(day.checklist).toEqual({ proteina: true, fruta: true });
    expect(day.creatine).toBe(true);

    // Unticking removes the key rather than storing false, so the row stays small.
    await setChecklistTick('2026-09-07', 'fruta', false, database);
    day = await getDayLog('2026-09-07', database);
    expect(day.checklist).toEqual({ proteina: true });
    expect(day.creatine).toBe(true);
  });
});

describe('the export', () => {
  it('carries the ticks, which is what makes phone → computer lossless', async () => {
    await setCreatineTaken('2026-09-07', true, database);
    await setChecklistTick('2026-09-07', 'hidratar', true, database);

    const file = await exportAll(database);
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.tables.days).toEqual([
      { date: '2026-09-07', creatine: true, checklist: { hidratar: true } },
    ]);

    const other = new LigaDB(`test-${Math.random().toString(36).slice(2)}`);
    try {
      await importAll(file, 'replace', other);
      expect(await getDayLog('2026-09-07', other)).toEqual({
        date: '2026-09-07',
        creatine: true,
        checklist: { hidratar: true },
      });
    } finally {
      await other.delete();
    }
  });

  it('accepts a file written before the ticks existed (no `days` key)', async () => {
    const v1 = {
      app: EXPORT_APP,
      schemaVersion: 1,
      exportedAt: '2026-09-07T07:00:00.000Z',
      tables: {
        checkins: [],
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

    const parsed = parseExport(JSON.stringify(v1));
    expect(parsed.tables.days).toEqual([]);
    const counts = await importAll(parsed, 'replace', database);
    expect(counts.days).toBe(0);
  });
});

describe('the migration out of localStorage', () => {
  it('folds the old keys into the database and clears them', async () => {
    localStorage.setItem('liga-hibrida:creatine:2026-09-07', '1');
    localStorage.setItem('liga-hibrida:creatine:2026-09-08', '1');
    localStorage.setItem(
      'liga-hibrida:checklist:2026-09-07',
      JSON.stringify({ proteina: true, fruta: true }),
    );

    expect(await migrateLegacyDayTicks(database)).toBe(2);
    expect(await getDayLog('2026-09-07', database)).toEqual({
      date: '2026-09-07',
      creatine: true,
      checklist: { proteina: true, fruta: true },
    });
    expect((await getDayLog('2026-09-08', database)).creatine).toBe(true);

    expect(localStorage.getItem('liga-hibrida:creatine:2026-09-07')).toBeNull();
    expect(localStorage.getItem('liga-hibrida:checklist:2026-09-07')).toBeNull();
  });

  it('runs to nothing the second time', async () => {
    localStorage.setItem('liga-hibrida:creatine:2026-09-07', '1');
    expect(await migrateLegacyDayTicks(database)).toBe(1);
    expect(await migrateLegacyDayTicks(database)).toBe(0);
  });

  it('never overwrites a row that is already there, so an import always wins', async () => {
    await setCreatineTaken('2026-09-07', false, database);
    localStorage.setItem('liga-hibrida:creatine:2026-09-07', '1');

    expect(await migrateLegacyDayTicks(database)).toBe(0);
    expect((await getDayLog('2026-09-07', database)).creatine).toBe(false);
  });

  it('ignores unticked days, other keys and corrupt entries', async () => {
    localStorage.setItem('liga-hibrida:creatine:2026-09-07', '0'); // unticked
    localStorage.setItem('liga-hibrida:checklist:2026-09-07', '{not json'); // corrupt
    localStorage.setItem('liga-hibrida:notifications', '1'); // not a daily tick
    localStorage.setItem('otra-app:creatine:2026-09-07', '1'); // another app

    expect(await migrateLegacyDayTicks(database)).toBe(0);
    expect(await database.days.count()).toBe(0);
    expect(localStorage.getItem('liga-hibrida:notifications')).toBe('1');
    expect(localStorage.getItem('otra-app:creatine:2026-09-07')).toBe('1');
  });

  it('does nothing when there is nothing to migrate', async () => {
    expect(await migrateLegacyDayTicks(database)).toBe(0);
  });
});
