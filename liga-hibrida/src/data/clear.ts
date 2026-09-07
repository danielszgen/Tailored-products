// "Borrar todo" (SPEC §8.6 Ajustes): empties every table in one transaction.
import { db, type LigaDB } from './db';

export async function clearAll(database: LigaDB = db): Promise<void> {
  await database.transaction('rw', database.tables, async () => {
    await Promise.all(database.tables.map((table) => table.clear()));
  });
}
