// JSON export of every table (SPEC §8.6 "Exportar/importar JSON completo", §11 "Datos").
import { toISODate } from '@/lib/date';
import { db, SCHEMA_VERSION, type LigaDB } from './db';
import { EXPORT_APP, type ExportFile, type ExportTables } from './schema';

/** Snapshot of all tables, read inside one read-only transaction. Rows are in primary-key order. */
export async function exportAll(database: LigaDB = db): Promise<ExportFile> {
  const tables = await database.transaction('r', database.tables, async () => {
    const [checkins, sessions, routes, wild, regen, weeks, tests, medals, adjustments, profile] =
      await Promise.all([
        database.checkins.toArray(),
        database.sessions.toArray(),
        database.routes.toArray(),
        database.wild.toArray(),
        database.regen.toArray(),
        database.weeks.toArray(),
        database.tests.toArray(),
        database.medals.toArray(),
        database.adjustments.toArray(),
        database.profile.toArray(),
      ]);
    const snapshot: ExportTables = {
      checkins,
      sessions,
      routes,
      wild,
      regen,
      weeks,
      tests,
      medals,
      adjustments,
      profile,
    };
    return snapshot;
  });

  return {
    app: EXPORT_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Pretty-printed JSON (2-space indent) ready to be written to a file or shared. */
export function serializeExport(file: ExportFile): string {
  return JSON.stringify(file, null, 2);
}

/** 'liga-hibrida-YYYY-MM-DD.json' using the local date. */
export function exportFileName(now: Date = new Date()): string {
  return `liga-hibrida-${toISODate(now)}.json`;
}
