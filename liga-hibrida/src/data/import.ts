// JSON import validated with zod (SPEC §5 "Dexie": "import valida con zod").
import { z } from 'zod';
import { db, SCHEMA_VERSION, TABLE_NAMES, type LigaDB, type TableName } from './db';
import { ExportFileSchema, type ExportFile, type ExportTables } from './schema';

export type ImportMode = 'replace' | 'merge';

/** Thrown when a file cannot be imported. `message` is user-facing (Spanish); `issues` lists paths. */
export class ImportError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'ImportError';
    this.issues = issues;
  }
}

const MAX_ISSUES = 10;

const TYPE_NAMES_ES: Record<string, string> = {
  string: 'texto',
  number: 'número',
  integer: 'entero',
  float: 'decimal',
  boolean: 'booleano',
  object: 'objeto',
  array: 'lista',
  undefined: 'vacío',
  null: 'nulo',
  nan: 'NaN',
  date: 'fecha',
};

function typeName(type: string): string {
  return TYPE_NAMES_ES[type] ?? type;
}

/** Spanish messages for the zod issues an export file can produce. */
const spanishErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message:
          issue.received === 'undefined'
            ? 'campo obligatorio'
            : `se esperaba ${typeName(issue.expected)} y llegó ${typeName(issue.received)}`,
      };
    case z.ZodIssueCode.invalid_literal:
      return { message: `valor no válido (se esperaba ${JSON.stringify(issue.expected)})` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `valor no válido (opciones: ${issue.options.join(', ')})` };
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: `tipo no válido (opciones: ${issue.options.join(', ')})` };
    case z.ZodIssueCode.invalid_union:
      return { message: 'valor no válido' };
    case z.ZodIssueCode.invalid_string:
      return { message: 'formato no válido' };
    case z.ZodIssueCode.too_small:
      return { message: `demasiado pequeño (mínimo ${issue.minimum})` };
    case z.ZodIssueCode.too_big:
      return { message: `demasiado grande (máximo ${issue.maximum})` };
    default:
      return { message: ctx.defaultError };
  }
};

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
  return `${path}: ${issue.message}`;
}

function assertSupportedVersion(schemaVersion: number): void {
  if (schemaVersion > SCHEMA_VERSION) {
    throw new ImportError(
      `El archivo viene de una versión más nueva de la app (esquema ${schemaVersion}; esta app entiende hasta el ${SCHEMA_VERSION}). Actualiza la app e inténtalo de nuevo.`,
      [`schemaVersion: ${schemaVersion} > ${SCHEMA_VERSION}`],
    );
  }
}

/**
 * Validates a JSON string or an already-parsed object. Throws ImportError (Spanish message plus up
 * to 10 issue paths) when it is not a Liga Híbrida export this app can read.
 */
export function parseExport(json: unknown): ExportFile {
  let data: unknown = json;
  if (typeof json === 'string') {
    try {
      data = JSON.parse(json);
    } catch {
      throw new ImportError('El archivo no es un JSON válido.', ['(raíz): JSON mal formado']);
    }
  }

  const result = ExportFileSchema.safeParse(data, { errorMap: spanishErrorMap });
  if (!result.success) {
    const issues = result.error.issues.slice(0, MAX_ISSUES).map(formatIssue);
    const wrongApp = result.error.issues.some((issue) => issue.path[0] === 'app');
    throw new ImportError(
      wrongApp
        ? 'El archivo no es una exportación de Liga Híbrida.'
        : 'El archivo está dañado o no tiene el formato de exportación de Liga Híbrida.',
      issues,
    );
  }

  assertSupportedVersion(result.data.schemaVersion);
  return result.data;
}

function countRows(tables: ExportTables): Record<TableName, number> {
  const counts = {} as Record<TableName, number>;
  for (const name of TABLE_NAMES) counts[name] = tables[name].length;
  return counts;
}

/**
 * Writes a parsed export into the database inside ONE read-write transaction.
 * - 'replace' (default): clears every table first, so the result equals the file.
 * - 'merge': puts the file's rows over the existing ones (same key → replaced; others kept).
 * Returns the number of rows written per table.
 */
export async function importAll(
  file: ExportFile,
  mode: ImportMode = 'replace',
  database: LigaDB = db,
): Promise<Record<TableName, number>> {
  assertSupportedVersion(file.schemaVersion);
  // Files from older schema versions would be migrated here before writing (none yet: v1 only).
  const { tables } = file;

  return await database.transaction('rw', database.tables, async () => {
    if (mode === 'replace') {
      await Promise.all(database.tables.map((table) => table.clear()));
    }
    await Promise.all([
      database.checkins.bulkPut(tables.checkins),
      database.sessions.bulkPut(tables.sessions),
      database.routes.bulkPut(tables.routes),
      database.wild.bulkPut(tables.wild),
      database.regen.bulkPut(tables.regen),
      database.weeks.bulkPut(tables.weeks),
      database.tests.bulkPut(tables.tests),
      database.medals.bulkPut(tables.medals),
      database.adjustments.bulkPut(tables.adjustments),
      database.profile.bulkPut(tables.profile),
    ]);
    return countRows(tables);
  });
}
