// R3 · Deloads — SPEC §7 R3 (document 05 "Progresión del bloque", document 04 aerobic waves).
// Pure functions: wave of a week, set/RIR/duration reductions and their application to a WeekPlan.
import type { ExerciseSpec, PlannedItem, Wave, WeekPlan } from '../types';
import { waveForWeek } from '../content/block';

export const DELOAD_RIR = 4;
/** "carga de la última sesión no-deload × 0.9" (R2). */
export const DELOAD_LOAD_FACTOR = 0.9;
/** "series −30/−40 % (main × 0.65, accesorios × 0.5)". */
export const DELOAD_MAIN_SET_FACTOR = 0.65;
export const DELOAD_ACCESSORY_SET_FACTOR = 0.5;
/** "Z2 −25/−35 % duración" → the planned range shrinks to 65–75 % of itself. */
export const DELOAD_Z2_FACTOR: [number, number] = [0.65, 0.75];
export const DELOAD_ADVENTURE_NOTE = 'Descarga: aventura solo fácil.';
export const EVAL_WEEK_NOTE = 'Semana 12: volumen reducido, tests de Liga activos.';

export type WeekKind = 'normal' | 'deload' | 'eval';

export { waveForWeek };

export function weekKind(weekOfBlock: number): WeekKind {
  const wave = waveForWeek(weekOfBlock);
  if (wave === 'deload') return 'deload';
  if (wave === 'eval') return 'eval';
  return 'normal';
}

export function isDeloadWave(wave: Wave): boolean {
  return wave === 'deload';
}

/**
 * Sets of an exercise in a deload week: main lifts × 0.65, accessories × 0.5, rounded down.
 * Main lifts keep at least 2 sets (R2 "mín. 2"); accessories at least 1 ("mitad de volumen").
 */
export function deloadSets(spec: Pick<ExerciseSpec, 'sets' | 'accessory'>): number {
  if (spec.accessory) return Math.max(1, Math.floor(spec.sets * DELOAD_ACCESSORY_SET_FACTOR));
  return Math.max(2, Math.floor(spec.sets * DELOAD_MAIN_SET_FACTOR));
}

/** Planned Z2 range reduced 25–35 %, rounded to 5 minutes (min 20'). */
export function deloadRouteMinutes(range: [number, number]): [number, number] {
  const lo = Math.max(20, Math.round((range[0] * DELOAD_Z2_FACTOR[0]) / 5) * 5);
  const hi = Math.max(lo, Math.round((range[1] * DELOAD_Z2_FACTOR[1]) / 5) * 5);
  return [lo, hi];
}

function deloadItem(item: PlannedItem): PlannedItem {
  if (item.kind === 'route') return { ...item, minutes: deloadRouteMinutes(item.minutes) };
  if (item.kind === 'wild') return { ...item, note: DELOAD_ADVENTURE_NOTE };
  return item;
}

/**
 * Applies R3 to a plan whose wave is 'deload': routes shrink, the adventure becomes "solo fácil".
 * Set counts and RIR are handled per exercise by R2 (progression.ts). Other waves are returned as-is.
 */
export function applyDeloadToWeek(plan: WeekPlan): WeekPlan {
  if (plan.wave !== 'deload') return plan;
  const days = { ...plan.days };
  for (const key of Object.keys(days) as unknown as (keyof WeekPlan['days'])[]) {
    const day = days[key];
    days[key] = {
      ...day,
      am: day.am ? deloadItem(day.am) : undefined,
      pm: day.pm ? deloadItem(day.pm) : undefined,
    };
  }
  return { ...plan, days };
}

/** Spanish lines describing what a deload/eval week changes (SPEC §7 R3). */
export function deloadSummary(wave: Wave): string[] {
  if (wave === 'deload') {
    return [
      'Series −30/−40 % (principales × 0,65; accesorios × 0,5), RIR 4.',
      'Carga sugerida: 90 % de la última sesión sin descarga.',
      'Z2 −25/−35 % de duración; aventura solo fácil.',
    ];
  }
  if (wave === 'eval') return [EVAL_WEEK_NOTE];
  return [];
}
