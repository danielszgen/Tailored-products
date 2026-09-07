// Check-in repository — primary key is the ISO date, so every query is a key-range scan.
import Dexie from 'dexie';
import type { SymptomSample } from '@/domain/rules/pv';
import type { Checkin, ISODate } from '@/domain/types';
import { addDaysISO, todayISO } from '@/lib/date';
import { db, type LigaDB } from '../db';

export interface ListCheckinsOptions {
  from?: ISODate; // inclusive
  to?: ISODate; // inclusive
  /** Keep only the most recent N (the result stays ascending). */
  limit?: number;
}

export interface WeightSeriesOptions {
  /** Window length in days, ending at `until` (inclusive). Omit for the whole history. */
  days?: number;
  /** Last day of the window; defaults to today when `days` is given. */
  until?: ISODate;
}

export interface WeightPoint {
  date: ISODate;
  value: number;
}

/** R1: adductor ≥ 5 is a KO signal (SPEC §7 R1). */
export const ADDUCTOR_KO_THRESHOLD = 5;

/** Check-ins with `from ≤ date ≤ to`, ascending by date. Open bounds when omitted. */
function inDateRange(database: LigaDB, range: { from?: ISODate; to?: ISODate }) {
  return database.checkins
    .where('date')
    .between(range.from ?? Dexie.minKey, range.to ?? Dexie.maxKey, true, true);
}

export async function getCheckin(
  date: ISODate,
  database: LigaDB = db,
): Promise<Checkin | undefined> {
  return database.checkins.get(date);
}

/** Put: saving the same date again replaces the previous check-in. */
export async function saveCheckin(checkin: Checkin, database: LigaDB = db): Promise<void> {
  await database.checkins.put(checkin);
}

export async function listCheckins(
  opts: ListCheckinsOptions = {},
  database: LigaDB = db,
): Promise<Checkin[]> {
  const collection = inDateRange(database, opts);
  if (opts.limit === undefined) return collection.toArray();
  if (opts.limit <= 0) return [];
  const newestFirst = await collection.reverse().limit(opts.limit).toArray();
  return newestFirst.reverse();
}

/**
 * The `count` check-ins strictly before `date`, oldest first — the `history` argument of
 * computePv (R1 "rising" detection). Calendar gaps are ignored: these are the previous records.
 */
export async function symptomHistoryBefore(
  date: ISODate,
  count = 2,
  database: LigaDB = db,
): Promise<SymptomSample[]> {
  if (count <= 0) return [];
  const newestFirst = await database.checkins
    .where('date')
    .below(date)
    .reverse()
    .limit(count)
    .toArray();
  return newestFirst.reverse().map((c) => ({ wrist: c.wrist, adductor: c.adductor }));
}

/**
 * Number of consecutive check-in records (newest first, ending at `date`) whose adductor is
 * ≥ ADDUCTOR_KO_THRESHOLD. Includes `date` when it has a check-in; if it has none, the streak of
 * the latest records before it is returned (add 1 yourself for an unsaved KO check-in).
 * A record below the threshold ends the streak; calendar gaps between records do not.
 */
export async function consecutiveAdductorKo(date: ISODate, database: LigaDB = db): Promise<number> {
  const streak = await database.checkins
    .where('date')
    .belowOrEqual(date)
    .reverse()
    .until((c) => c.adductor < ADDUCTOR_KO_THRESHOLD)
    .toArray();
  return streak.length;
}

/** Check-ins that recorded a weight, ascending by date, limited to the last `days` days. */
export async function weightSeries(
  opts: WeightSeriesOptions = {},
  database: LigaDB = db,
): Promise<WeightPoint[]> {
  const { days } = opts;
  if (days !== undefined && days <= 0) return [];
  const to = opts.until ?? (days !== undefined ? todayISO() : undefined);
  const from = days !== undefined && to !== undefined ? addDaysISO(to, -(days - 1)) : undefined;
  const rows = await inDateRange(database, { from, to }).toArray();
  return rows.flatMap((c) =>
    typeof c.weightKg === 'number' ? [{ date: c.date, value: c.weightKg }] : [],
  );
}

/** The most recent check-in with a weight, or undefined when none has one. */
export async function lastWeight(database: LigaDB = db): Promise<WeightPoint | undefined> {
  const row = await database.checkins
    .orderBy('date')
    .reverse()
    .filter((c) => typeof c.weightKg === 'number')
    .first();
  return row && typeof row.weightKg === 'number'
    ? { date: row.date, value: row.weightKg }
    : undefined;
}
