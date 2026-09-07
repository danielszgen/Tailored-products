// Week plan repository — one row per week, keyed by its Monday (SPEC D13).
import { buildWeekPlan } from '@/domain/content/week';
import type { ISODate, WeekPlan, WeekTemplate } from '@/domain/types';
import { db, type LigaDB } from '../db';

export interface EnsureWeekParams {
  weekStart: ISODate;
  weekOfBlock: number;
  template?: WeekTemplate;
}

export async function getWeek(
  weekStart: ISODate,
  database: LigaDB = db,
): Promise<WeekPlan | undefined> {
  return database.weeks.get(weekStart);
}

export async function saveWeek(plan: WeekPlan, database: LigaDB = db): Promise<void> {
  await database.weeks.put(plan);
}

/** All stored weeks, ascending by weekStart. */
export async function listWeeks(database: LigaDB = db): Promise<WeekPlan[]> {
  return database.weeks.orderBy('weekStart').toArray();
}

/**
 * Returns the stored plan for `weekStart`, or builds one from the template (default 'estandar'),
 * stores it and returns it. A stored plan always wins, even if `template` differs.
 */
export async function ensureWeek(
  params: EnsureWeekParams,
  database: LigaDB = db,
): Promise<WeekPlan> {
  return await database.transaction('rw', database.weeks, async () => {
    const existing = await database.weeks.get(params.weekStart);
    if (existing) return existing;
    const plan = buildWeekPlan(params);
    await database.weeks.put(plan);
    return plan;
  });
}
