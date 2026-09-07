// Route, Zona Salvaje and Regen logs — three small tables with the same shape of queries.
import Dexie, { type Table } from 'dexie';
import type { ISODate, RegenLog, RouteLog, WildLog } from '@/domain/types';
import { db, type LigaDB } from '../db';

export interface DateRangeOptions {
  from?: ISODate; // inclusive
  to?: ISODate; // inclusive
}

/** Rows with `from ≤ date ≤ to`, ascending by date (open bounds when omitted). */
function listByDate<T, TKey, TInsert>(
  table: Table<T, TKey, TInsert>,
  range: DateRangeOptions,
): Promise<T[]> {
  return table
    .where('date')
    .between(range.from ?? Dexie.minKey, range.to ?? Dexie.maxKey, true, true)
    .toArray();
}

// --- Routes -----------------------------------------------------------------

export async function saveRoute(route: RouteLog, database: LigaDB = db): Promise<void> {
  await database.routes.put(route);
}

export async function listRoutes(
  opts: DateRangeOptions = {},
  database: LigaDB = db,
): Promise<RouteLog[]> {
  return listByDate(database.routes, opts);
}

export async function deleteRoute(id: string, database: LigaDB = db): Promise<void> {
  await database.routes.delete(id);
}

// --- Zona Salvaje -----------------------------------------------------------

export async function saveWild(wild: WildLog, database: LigaDB = db): Promise<void> {
  await database.wild.put(wild);
}

export async function listWild(
  opts: DateRangeOptions = {},
  database: LigaDB = db,
): Promise<WildLog[]> {
  return listByDate(database.wild, opts);
}

export async function deleteWild(id: string, database: LigaDB = db): Promise<void> {
  await database.wild.delete(id);
}

// --- Regen ------------------------------------------------------------------

export async function saveRegen(regen: RegenLog, database: LigaDB = db): Promise<void> {
  await database.regen.put(regen);
}

export async function listRegen(
  opts: DateRangeOptions = {},
  database: LigaDB = db,
): Promise<RegenLog[]> {
  return listByDate(database.regen, opts);
}

export async function deleteRegen(id: string, database: LigaDB = db): Promise<void> {
  await database.regen.delete(id);
}
