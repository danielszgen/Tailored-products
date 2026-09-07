// Gym session repository — indexed by date and gymId (SPEC §5 "Dexie").
import Dexie from 'dexie';
import type { ExerciseLog, GymId, ISODate, SessionLog } from '@/domain/types';
import { db, type LigaDB } from '../db';

export interface ListSessionsOptions {
  gymId?: GymId;
  from?: ISODate; // inclusive
  to?: ISODate; // inclusive
  /** Keep only the most recent N. */
  limit?: number;
  completedOnly?: boolean;
}

export interface LastExerciseLogsOptions {
  /** Maximum number of entries (default 3). */
  count?: number;
  /** Only sessions dated strictly before this day. */
  before?: ISODate;
}

export interface ExerciseLogEntry {
  session: SessionLog;
  log: ExerciseLog;
}

function startedAtMs(session: SessionLog): number {
  if (!session.startedAt) return 0;
  const ms = Date.parse(session.startedAt);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Most recent first: by date, then by startedAt (sessions without startedAt go last). */
export function compareSessionsDesc(a: SessionLog, b: SessionLog): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return startedAtMs(b) - startedAtMs(a);
}

export async function saveSession(session: SessionLog, database: LigaDB = db): Promise<void> {
  await database.sessions.put(session);
}

export async function getSession(
  id: string,
  database: LigaDB = db,
): Promise<SessionLog | undefined> {
  return database.sessions.get(id);
}

export async function deleteSession(id: string, database: LigaDB = db): Promise<void> {
  await database.sessions.delete(id);
}

/** Sessions matching the filters, most recent first (date, then startedAt). */
export async function listSessions(
  opts: ListSessionsOptions = {},
  database: LigaDB = db,
): Promise<SessionLog[]> {
  const { gymId, from, to, limit, completedOnly } = opts;
  let rows: SessionLog[];
  if (gymId !== undefined) {
    rows = await database.sessions.where('gymId').equals(gymId).toArray();
    rows = rows.filter(
      (s) => (from === undefined || s.date >= from) && (to === undefined || s.date <= to),
    );
  } else {
    rows = await database.sessions
      .where('date')
      .between(from ?? Dexie.minKey, to ?? Dexie.maxKey, true, true)
      .toArray();
  }
  if (completedOnly) rows = rows.filter((s) => s.completed);
  rows.sort(compareSessionsDesc);
  if (limit !== undefined) rows = rows.slice(0, Math.max(0, limit));
  return rows;
}

export async function lastCompletedSession(
  gymId: GymId,
  database: LigaDB = db,
): Promise<SessionLog | undefined> {
  const [latest] = await listSessions({ gymId, completedOnly: true, limit: 1 }, database);
  return latest;
}

/** The most recent session that has not been completed (a combat in progress). */
export async function activeSession(database: LigaDB = db): Promise<SessionLog | undefined> {
  const open = await database.sessions.filter((s) => !s.completed).toArray();
  open.sort(compareSessionsDesc);
  return open[0];
}

/**
 * Logs of `exerciseId` from completed sessions, most recent first, skipping logs without sets.
 * Feeds the load suggestion (R2) and the exercise history.
 */
export async function lastExerciseLogs(
  exerciseId: string,
  opts: LastExerciseLogsOptions = {},
  database: LigaDB = db,
): Promise<ExerciseLogEntry[]> {
  const { count = 3, before } = opts;
  if (count <= 0) return [];
  const collection =
    before === undefined
      ? database.sessions.toCollection()
      : database.sessions.where('date').below(before);
  const sessions = await collection.filter((s) => s.completed).toArray();
  sessions.sort(compareSessionsDesc);

  const entries: ExerciseLogEntry[] = [];
  for (const session of sessions) {
    for (const log of session.exercises) {
      if (log.exerciseId !== exerciseId || log.sets.length === 0) continue;
      entries.push({ session, log });
      if (entries.length >= count) return entries;
    }
  }
  return entries;
}

/** Every session logged on `date`, in chronological order (AM before PM). */
export async function sessionsOnDate(date: ISODate, database: LigaDB = db): Promise<SessionLog[]> {
  const rows = await database.sessions.where('date').equals(date).toArray();
  return rows.sort((a, b) => startedAtMs(a) - startedAtMs(b));
}
