// zod (v3) schemas mirroring src/domain/types.ts, one per Dexie table row, plus the export file
// envelope (SPEC §5 "Dexie": export = JSON with every table + schemaVersion; import validates with zod).
// Objects are deliberately non-strict so future optional fields never break an older import.
// Keep this file in sync with types.ts: export.ts / import.ts type-check both directions.
import { z } from 'zod';
import { PROFILE_ID } from './db';

// ---------------------------------------------------------------------------
// Primitives and literal unions
// ---------------------------------------------------------------------------

export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'debe ser una fecha YYYY-MM-DD');
export const StatKeySchema = z.enum(['masa', 'fuerza', 'motor', 'control', 'aventura']);
export const GymIdSchema = z.enum(['cantera', 'yunque', 'resorte', 'vertigo']);
export const StatusSchema = z.enum(['ok', 'cargado', 'ko']);
export const DayFuelSchema = z.enum(['muy_alta', 'alta', 'media_alta', 'media', 'media_baja']);
export const FormSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const Scale5Schema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export const SessionVersionSchema = z.union([z.literal(45), z.literal(60), z.literal(75)]);
export const WaveSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal('deload'),
  z.literal('eval'),
]);
export const WeekTemplateSchema = z.enum(['estandar', 'montana', 'surf', 'fatiga', 'viaje']);
export const RouteKindSchema = z.enum(['run', 'bike', 'swim', 'walk']);
export const WildKindSchema = z.enum([
  'mtb',
  'trail',
  'surf',
  'climb_outdoor',
  'boulder',
  'skate',
  'swim_long',
  'other',
]);
export const RegenKindSchema = z.enum([
  'yoga',
  'movilidad',
  'muneca',
  'aductor',
  'sauna',
  'frio',
  'siesta',
  'paseo',
]);
const SideSchema = z.enum(['L', 'R']);
const MinutesRangeSchema = z.tuple([z.number(), z.number()]);

// ---------------------------------------------------------------------------
// Table rows
// ---------------------------------------------------------------------------

export const CheckinSchema = z.object({
  date: ISODateSchema,
  sleepHours: z.number(),
  energy: Scale5Schema,
  legs: Scale5Schema,
  wrist: z.number(),
  adductor: z.number(),
  weightKg: z.number().optional(),
  note: z.string().optional(),
  pv: z.number(),
  status: StatusSchema,
});

export const SetLogSchema = z.object({
  setIndex: z.number(),
  loadKg: z.number(),
  reps: z.number(),
  rir: z.number(),
  seconds: z.number().optional(),
  side: SideSchema.optional(),
});

export const ExerciseLogSchema = z.object({
  exerciseId: z.string(),
  sets: z.array(SetLogSchema),
  skipped: z.boolean().optional(),
  substitutedBy: z.string().optional(),
});

export const SessionLogSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  gymId: GymIdSchema,
  weekOfBlock: z.number(),
  version: SessionVersionSchema,
  statusAtStart: StatusSchema,
  energyStart: Scale5Schema,
  energyEnd: Scale5Schema.optional(),
  wristDuring: z.number().optional(),
  adductorDuring: z.number().optional(),
  adductorAfter: z.number().optional(),
  feel: z.enum(['facil', 'normal', 'pesado']).optional(),
  sportLast24h: z.string().optional(),
  exercises: z.array(ExerciseLogSchema),
  durationMin: z.number().optional(),
  completed: z.boolean(),
  warmupDone: z.boolean().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});

export const RouteLogSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  kind: RouteKindSchema,
  minutes: z.number(),
  rpe: z.number(),
  elevationM: z.number().optional(),
  note: z.string().optional(),
  countsAs: z.enum(['z2', 'medio', 'duro']),
});

export const WildLogSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  kind: WildKindSchema,
  minutes: z.number(),
  intensity: z.enum(['facil', 'moderada', 'dura']),
  note: z.string().optional(),
});

export const RegenLogSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  kind: RegenKindSchema,
  minutes: z.number(),
  note: z.string().optional(),
});

export const PlannedItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('gym'),
    gymId: GymIdSchema,
    version: SessionVersionSchema,
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal('route'),
    routeKind: RouteKindSchema,
    minutes: MinutesRangeSchema,
    optional: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal('wild'),
    wildKind: WildKindSchema.optional(),
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal('regen'),
    what: z.enum(['yoga', 'movilidad', 'natacion_suave', 'paseo']),
  }),
  z.object({ kind: z.literal('off') }),
  z.object({
    kind: z.literal('sport'),
    sport: z.enum(['escalada', 'skate', 'natacion', 'otro']),
    minutes: MinutesRangeSchema,
    rpeMax: z.number().optional(),
    optional: z.boolean().optional(),
  }),
  z.object({ kind: z.literal('note'), text: z.string() }),
]);

export const PlannedDaySchema = z.object({
  am: PlannedItemSchema.optional(),
  pm: PlannedItemSchema.optional(),
  fuel: DayFuelSchema,
});

export const WeekPlanSchema = z.object({
  weekStart: ISODateSchema,
  weekOfBlock: z.number(),
  wave: WaveSchema,
  template: WeekTemplateSchema,
  // All seven days are required (0 = Monday … 6 = Sunday).
  days: z.object({
    0: PlannedDaySchema,
    1: PlannedDaySchema,
    2: PlannedDaySchema,
    3: PlannedDaySchema,
    4: PlannedDaySchema,
    5: PlannedDaySchema,
    6: PlannedDaySchema,
  }),
  substitutions: z.array(
    z.object({ date: ISODateSchema, removed: z.string(), reason: z.string() }),
  ),
});

const LoadRepsSchema = z.object({ loadKg: z.number(), reps: z.number() });

export const LeagueTestSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  weekOfBlock: z.union([z.literal(4), z.literal(8), z.literal(12)]),
  pullupRir2: LoadRepsSchema.optional(),
  dipRir2: LoadRepsSchema.optional(),
  splitSquat: z.array(LoadRepsSchema.extend({ side: SideSchema })).optional(),
  z2Standard: z
    .object({
      routeKind: RouteKindSchema,
      minutes: z.number(),
      rpe: z.number(),
      hrAvg: z.number().optional(),
    })
    .optional(),
  handstand: z
    .object({
      wallSec: z.number(),
      freeSec: z.number().optional(),
      videoNote: z.string().optional(),
    })
    .optional(),
  mobility: z
    .object({
      ankleCm: z.number().optional(),
      hipNote: z.string().optional(),
      shoulderNote: z.string().optional(),
      wristExtDeg: z.number().optional(),
    })
    .optional(),
  waistCm: z.number().optional(),
  weightAvg7: z.number().optional(),
  transferNote: z.string().optional(),
});

export const MedalSchema = z.object({
  id: GymIdSchema,
  progress: z.number(),
  earnedOn: ISODateSchema.optional(),
});

export const BaselineSchema = z.object({
  loadKg: z.number(),
  reps: z.number(),
  date: ISODateSchema,
});

const TimeWindowSchema = z.tuple([z.string(), z.string()]);

export const ProfileSchema = z.object({
  name: z.string(),
  heightCm: z.number(),
  startWeightKg: z.number().optional(),
  targetWeightKg: z.tuple([z.number(), z.number()]),
  amWindow: TimeWindowSchema,
  pmWindow: TimeWindowSchema,
  blockStart: ISODateSchema,
  form: FormSchema,
  // Partial<Record<string, Baseline>> in types.ts → values may be undefined.
  baselines: z.record(z.string(), BaselineSchema.optional()),
  kcalBaseline: z.number().optional(),
  kcalTarget: z.number().optional(),
  dietNotes: z.string().optional(),
  calorieMode: z.enum(['contar', 'porciones']).optional(),
  defaultTemplate: WeekTemplateSchema.optional(),
  squatVariant: z.enum(['tolerated', 'barbell']).optional(),
});

export const StoredProfileSchema = ProfileSchema.extend({ id: z.literal(PROFILE_ID) });

export const AdjustmentSchema = z.object({
  id: z.string(),
  date: ISODateSchema,
  kind: z.enum(['kcal', 'volumen', 'plan', 'nota']),
  detail: z.string(),
  source: z.enum(['app', 'rival', 'daniel']),
});

// ---------------------------------------------------------------------------
// Export file envelope
// ---------------------------------------------------------------------------

export const EXPORT_APP = 'liga-hibrida' as const;

/** One array per Dexie table, in the same order as TABLE_NAMES in db.ts. */
export const ExportTablesSchema = z.object({
  checkins: z.array(CheckinSchema),
  sessions: z.array(SessionLogSchema),
  routes: z.array(RouteLogSchema),
  wild: z.array(WildLogSchema),
  regen: z.array(RegenLogSchema),
  weeks: z.array(WeekPlanSchema),
  tests: z.array(LeagueTestSchema),
  medals: z.array(MedalSchema),
  adjustments: z.array(AdjustmentSchema),
  profile: z.array(StoredProfileSchema),
});

export const ExportFileSchema = z.object({
  app: z.literal(EXPORT_APP),
  schemaVersion: z.number().int(),
  exportedAt: z.string(),
  tables: ExportTablesSchema,
});

export type ExportTables = z.infer<typeof ExportTablesSchema>;
export type ExportFile = z.infer<typeof ExportFileSchema>;
