// Daily ticks: the creatina habit (SPEC §8.6) and the Combustible checklist (SPEC §8.2).
//
// Until schema v2 both lived in localStorage, which meant they were per-device and — the part
// that actually hurt — absent from the JSON export. Since export/import is the only bridge
// between the phone and the computer, moving them into Dexie is what makes that bridge lossless.
import { useLiveQuery } from 'dexie-react-hooks';
import type { ChecklistId, DayLog, ISODate } from '@/domain/types';
import { db, type LigaDB } from './db';

/** The row for a date, or undefined while Dexie is still answering. */
export function useDayLog(date: ISODate): DayLog | undefined {
  return useLiveQuery(async () => (await db.days.get(date)) ?? { date }, [date]);
}

export async function getDayLog(date: ISODate, database: LigaDB = db): Promise<DayLog> {
  return (await database.days.get(date)) ?? { date };
}

/** Writes the patch over the row for that date, creating it when it is the first tick of the day. */
async function patchDay(
  date: ISODate,
  patch: Partial<Omit<DayLog, 'date'>>,
  database: LigaDB = db,
): Promise<void> {
  await database.transaction('rw', database.days, async () => {
    const current = (await database.days.get(date)) ?? { date };
    await database.days.put({ ...current, ...patch });
  });
}

export async function setCreatineTaken(
  date: ISODate,
  taken: boolean,
  database: LigaDB = db,
): Promise<void> {
  await patchDay(date, { creatine: taken }, database);
}

export async function setChecklistTick(
  date: ISODate,
  id: ChecklistId,
  on: boolean,
  database: LigaDB = db,
): Promise<void> {
  await database.transaction('rw', database.days, async () => {
    const current = (await database.days.get(date)) ?? { date };
    const checklist = { ...current.checklist, [id]: on };
    if (!on) delete checklist[id];
    await database.days.put({ ...current, checklist });
  });
}

// ---------------------------------------------------------------------------------------------
// One-time migration out of localStorage
// ---------------------------------------------------------------------------------------------

const CREATINE_PREFIX = 'liga-hibrida:creatine:';
const CHECKLIST_PREFIX = 'liga-hibrida:checklist:';

/** Reads every `liga-hibrida:<what>:<date>` key still in localStorage. */
function readLegacyKeys(): { creatine: ISODate[]; checklist: Map<ISODate, unknown> } {
  const creatine: ISODate[] = [];
  const checklist = new Map<ISODate, unknown>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(CREATINE_PREFIX)) {
        if (localStorage.getItem(key) === '1') creatine.push(key.slice(CREATINE_PREFIX.length));
      } else if (key.startsWith(CHECKLIST_PREFIX)) {
        try {
          checklist.set(key.slice(CHECKLIST_PREFIX.length), JSON.parse(localStorage.getItem(key)!));
        } catch {
          // A corrupt entry is not worth failing the migration over.
        }
      }
    }
  } catch {
    // Storage unavailable (private window, blocked): nothing to migrate.
  }
  return { creatine, checklist };
}

function isChecklist(value: unknown): value is Partial<Record<ChecklistId, boolean>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'boolean')
  );
}

/**
 * Moves the old localStorage ticks into `days` and clears the keys.
 *
 * Runs at startup and is idempotent: after the first pass there are no keys left, and a date that
 * already has a row is skipped rather than overwritten — so an import that ran first always wins.
 * Returns how many dates were migrated, which is what the test asserts on.
 */
export async function migrateLegacyDayTicks(database: LigaDB = db): Promise<number> {
  const { creatine, checklist } = readLegacyKeys();
  const dates = new Set<ISODate>([...creatine, ...checklist.keys()]);
  if (dates.size === 0) return 0;

  const taken = new Set(creatine);
  let migrated = 0;
  await database.transaction('rw', database.days, async () => {
    for (const date of dates) {
      if (await database.days.get(date)) continue;
      const row: DayLog = { date };
      if (taken.has(date)) row.creatine = true;
      const ticks = checklist.get(date);
      if (isChecklist(ticks) && Object.keys(ticks).length > 0) row.checklist = ticks;
      if (row.creatine === undefined && row.checklist === undefined) continue;
      await database.days.put(row);
      migrated++;
    }
  });

  try {
    for (const date of dates) {
      localStorage.removeItem(`${CREATINE_PREFIX}${date}`);
      localStorage.removeItem(`${CHECKLIST_PREFIX}${date}`);
    }
  } catch {
    // Leaving the keys behind is harmless: the next pass skips the dates that already have a row.
  }
  return migrated;
}
