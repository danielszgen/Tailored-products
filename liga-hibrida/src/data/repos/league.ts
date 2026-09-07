// League repository — tests (weeks 4/8/12), the four gym medals and coach adjustments.
import { GYM_ORDER } from '@/domain/content/gyms';
import type { Adjustment, LeagueTest, Medal } from '@/domain/types';
import { db, type LigaDB } from '../db';

// --- League tests -----------------------------------------------------------

export async function saveTest(test: LeagueTest, database: LigaDB = db): Promise<void> {
  await database.tests.put(test);
}

/** Ascending by date. */
export async function listTests(database: LigaDB = db): Promise<LeagueTest[]> {
  return database.tests.orderBy('date').toArray();
}

// --- Medals -----------------------------------------------------------------

function inGymOrder(medals: Medal[]): Medal[] {
  const rank = (id: Medal['id']) => GYM_ORDER.indexOf(id);
  return [...medals].sort((a, b) => rank(a.id) - rank(b.id));
}

export async function getMedal(id: Medal['id'], database: LigaDB = db): Promise<Medal | undefined> {
  return database.medals.get(id);
}

/** Stored medals in gym order (cantera, yunque, resorte, vertigo). */
export async function listMedals(database: LigaDB = db): Promise<Medal[]> {
  return inGymOrder(await database.medals.toArray());
}

export async function saveMedal(medal: Medal, database: LigaDB = db): Promise<void> {
  await database.medals.put(medal);
}

/** Creates any missing medal with progress 0 and returns all four in gym order. Idempotent. */
export async function ensureMedals(database: LigaDB = db): Promise<Medal[]> {
  return await database.transaction('rw', database.medals, async () => {
    const existing = new Map((await database.medals.toArray()).map((m) => [m.id, m]));
    const missing: Medal[] = GYM_ORDER.filter((id) => !existing.has(id)).map((id) => ({
      id,
      progress: 0,
    }));
    if (missing.length > 0) await database.medals.bulkPut(missing);
    return GYM_ORDER.map((id) => existing.get(id) ?? { id, progress: 0 });
  });
}

// --- Adjustments ------------------------------------------------------------

export async function saveAdjustment(adjustment: Adjustment, database: LigaDB = db): Promise<void> {
  await database.adjustments.put(adjustment);
}

export async function getAdjustment(
  id: string,
  database: LigaDB = db,
): Promise<Adjustment | undefined> {
  return database.adjustments.get(id);
}

/** Most recent first. */
export async function listAdjustments(database: LigaDB = db): Promise<Adjustment[]> {
  return database.adjustments.orderBy('date').reverse().toArray();
}
