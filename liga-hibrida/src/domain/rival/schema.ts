// zod schema of what "Pregunta al Rival" sends (SPEC §10.2): profile without email, last 7
// check-ins, last 6 sessions summarised, routes and adventures of 14 days, the current WeekPlan,
// active advisories and the question. Strict objects: anything else is rejected by the function.
// No path aliases: api/rival.ts imports this file directly.
import { z } from 'zod';
import { RIVAL_MAX_QUESTION_CHARS } from './prompt';

const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Scale5 = z.number().int().min(1).max(5);
const Symptom = z.number().min(0).max(10);

export const RIVAL_CONTEXT_VERSION = 1;
export const RIVAL_CHECKIN_DAYS = 7;
export const RIVAL_SESSION_COUNT = 6;
export const RIVAL_LOG_DAYS = 14;

export const RivalProfileSchema = z
  .object({
    name: z.string().max(60),
    heightCm: z.number(),
    startWeightKg: z.number().optional(),
    targetWeightKg: z.tuple([z.number(), z.number()]),
    form: z.number().int().min(1).max(4),
    blockStart: ISODate,
    weekOfBlock: z.number().int(),
    wave: z.string(),
    squatVariant: z.enum(['tolerated', 'barbell']).optional(),
    calorieMode: z.enum(['contar', 'porciones']).optional(),
    kcalBaseline: z.number().optional(),
    kcalTarget: z.number().optional(),
    dietNotes: z.string().max(400).optional(),
  })
  .strict();

export const RivalCheckinSchema = z
  .object({
    date: ISODate,
    sleepHours: z.number(),
    energy: Scale5,
    legs: Scale5,
    wrist: Symptom,
    adductor: Symptom,
    weightKg: z.number().optional(),
    pv: z.number(),
    status: z.enum(['ok', 'cargado', 'ko']),
  })
  .strict();

export const RivalSessionSchema = z
  .object({
    date: ISODate,
    gym: z.string(),
    version: z.number(),
    statusAtStart: z.enum(['ok', 'cargado', 'ko']),
    mainLifts: z.string().max(400),
    energy: z.string(),
    wristDuring: Symptom.optional(),
    adductorDuring: Symptom.optional(),
    adductorAfter: Symptom.optional(),
    feel: z.enum(['facil', 'normal', 'pesado']).optional(),
    sportLast24h: z.string().max(120).optional(),
    durationMin: z.number().optional(),
  })
  .strict();

export const RivalRouteSchema = z
  .object({
    date: ISODate,
    kind: z.enum(['run', 'bike', 'swim', 'walk']),
    minutes: z.number(),
    rpe: z.number(),
    countsAs: z.enum(['z2', 'medio', 'duro']),
    elevationM: z.number().optional(),
    note: z.string().max(200).optional(),
  })
  .strict();

export const RivalWildSchema = z
  .object({
    date: ISODate,
    kind: z.string(),
    minutes: z.number(),
    intensity: z.enum(['facil', 'moderada', 'dura']),
    note: z.string().max(200).optional(),
  })
  .strict();

export const RivalWeekSchema = z
  .object({
    weekStart: ISODate,
    weekOfBlock: z.number().int(),
    wave: z.string(),
    template: z.string(),
    days: z.array(
      z
        .object({
          day: z.string(),
          am: z.string().optional(),
          pm: z.string().optional(),
          fuel: z.string(),
        })
        .strict(),
    ),
    substitutions: z.array(z.string().max(200)),
  })
  .strict();

export const RivalAdvisorySchema = z
  .object({
    level: z.number().int().min(1).max(5),
    message: z.string().max(300),
    source: z.string(),
  })
  .strict();

export const RivalContextSchema = z
  .object({
    app: z.literal('liga-hibrida'),
    version: z.literal(RIVAL_CONTEXT_VERSION),
    today: ISODate,
    question: z.string().trim().min(1).max(RIVAL_MAX_QUESTION_CHARS),
    profile: RivalProfileSchema,
    checkins: z.array(RivalCheckinSchema).max(RIVAL_CHECKIN_DAYS),
    sessions: z.array(RivalSessionSchema).max(RIVAL_SESSION_COUNT),
    routes: z.array(RivalRouteSchema).max(60),
    wild: z.array(RivalWildSchema).max(30),
    week: RivalWeekSchema.nullable(),
    advisories: z.array(RivalAdvisorySchema).max(20),
  })
  .strict();

export type RivalContext = z.infer<typeof RivalContextSchema>;

export const RivalRequestSchema = z.object({ context: RivalContextSchema }).strict();
export type RivalRequest = z.infer<typeof RivalRequestSchema>;

export interface RivalAnswer {
  answer: string;
  model: string;
  usage?: { input: number; output: number };
}

/** Keys that must never leave the device (the schema is strict, this is the explicit list for tests). */
export const RIVAL_FORBIDDEN_KEYS: readonly string[] = ['email', 'token', 'apiKey', 'id'];
