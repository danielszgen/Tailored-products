// Rutas and Zona Salvaje (document 04) — SPEC §6.7. Tables only; rules R4/R5 are Etapa II.
import type { RouteKind, WildKind } from '../types';

export interface InterferenceRule {
  id: number;
  name: string;
  text: string;
}

/** "Reglas de interferencia (las 7)". */
export const INTERFERENCE_RULES: readonly InterferenceRule[] = [
  {
    id: 1,
    name: 'Piernas primero',
    text: 'si el día es Lower, llega fresco; cardio previo solo calentamiento.',
  },
  { id: 2, name: 'Duro + fácil en dobles', text: 'nunca duro + duro de piernas.' },
  {
    id: 3,
    name: '24 h de protección',
    text: 'sin intervalos ni desnivel fuerte en las 24 h previas a Lower.',
  },
  {
    id: 4,
    name: 'El sábado manda',
    text: 'si la aventura sale intensa, viernes PM se elimina y domingo es recuperación real.',
  },
  { id: 5, name: 'Running conservador', text: 'en las 12 semanas casi todo Z2.' },
  {
    id: 6,
    name: 'Escalada cuenta como upper',
    text: 'boulder duro sustituye parte de Vértigo.',
  },
  { id: 7, name: 'Dolor ≠ adaptación', text: 'Dolor ≠ adaptación.' },
];

export type Light = 'verde' | 'ambar' | 'rojo';

export const LIGHT_LABELS: Record<Light, string> = {
  verde: 'VERDE',
  ambar: 'ÁMBAR',
  rojo: 'ROJO',
};

export interface CompatibilityRow {
  combo: string;
  light: Light;
  reading: string;
}

/** "Semáforo de compatibilidad (mismo día)". */
export const COMPATIBILITY_TABLE: readonly CompatibilityRow[] = [
  { combo: 'Lower AM + natación suave PM', light: 'verde', reading: 'VERDE' },
  { combo: 'Upper AM + running Z2 PM', light: 'verde', reading: 'VERDE' },
  { combo: 'Yoga AM + escalada técnica PM', light: 'verde', reading: 'VERDE (vigilar muñeca)' },
  { combo: 'Upper + natación Z2', light: 'verde', reading: 'VERDE si hombros bien' },
  { combo: 'Lower AM + running intenso PM', light: 'rojo', reading: 'ROJO' },
  { combo: 'Lower + MTB fuerte', light: 'rojo', reading: 'ROJO' },
  {
    combo: 'MTB duro sábado + trail largo domingo',
    light: 'rojo',
    reading: 'ROJO (elegir uno; el otro pasa a paseo/yoga)',
  },
  { combo: 'Trail largo + gimnasio de pierna', light: 'rojo', reading: 'ROJO' },
  {
    combo: 'Escalada dura + upper pesado mismo día',
    light: 'ambar',
    reading: 'ÁMBAR (reducir volumen en uno)',
  },
  {
    combo: 'Skate suave + Z2',
    light: 'ambar',
    reading: 'ÁMBAR (ok si técnico y piernas frescas)',
  },
];

export interface SubstitutionRow {
  appears: string;
  canReplace: string;
  mustNotReplace: string;
  adjustment: string;
}

export const SUBSTITUTION_PRINCIPLE = 'nunca añadir: intercambiar';

/** "Matriz de sustituciones". */
export const SUBSTITUTION_MATRIX: readonly SubstitutionRow[] = [
  {
    appears: "MTB 90–150' con desnivel",
    canReplace: 'Z2 viernes + Zona Salvaje',
    mustNotReplace: 'Lower A/B',
    adjustment: 'Reduce carrera esa semana si piernas cargadas',
  },
  {
    appears: "Trail 60–90'",
    canReplace: 'Running Z2 + Zona Salvaje',
    mustNotReplace: 'Lower A/B',
    adjustment: 'Ritmo conversacional al inicio',
  },
  {
    appears: "Surf 60–120'",
    canReplace: 'Zona Salvaje / natación',
    mustNotReplace: 'Lower',
    adjustment: 'Si exige mucho, cuenta como carga media torso+piernas',
  },
  {
    appears: 'Escalada / boulder duro',
    canReplace: 'Deporte miércoles + parte de Vértigo',
    mustNotReplace: 'Lower',
    adjustment: 'Reduce tirón/antebrazo del gym',
  },
  {
    appears: "Skate 45–90'",
    canReplace: 'Deporte miércoles o Z2 opcional',
    mustNotReplace: 'Lower',
    adjustment: 'Si hay saltos, no es recuperación',
  },
  {
    appears: 'Natación técnica suave',
    canReplace: 'Z2 opcional / recuperación',
    mustNotReplace: 'Fuerza',
    adjustment: 'Excelente PM tras gym',
  },
  {
    appears: 'Yoga intenso',
    canReplace: 'Movilidad del miércoles',
    mustNotReplace: 'Fuerza',
    adjustment: 'Cuenta como sesión media',
  },
];

/** "Escenarios de semana viva". */
export const LIVE_WEEK_SCENARIOS: readonly string[] = [
  'Olas el sábado → surf reemplaza Zona Salvaje y se elimina viernes PM si prevés 2 h.',
  'MTB con amigos el domingo → sábado pasa a descanso/skill suave y el Lower A del lunes se ajusta si piernas pesadas.',
  'Semana de mucha escalada → miércoles escalada dura, Vértigo reduce tirón/antebrazo, mantener los dos Lower.',
  'Viaje → 2 full-body + Z2 + movilidad.',
  'Fatiga laboral → eliminar C, luego B, luego reducir A.',
];

/** "Clasificación de una ruta". */
export const ROUTE_CLASSIFICATION = {
  z2: 'RPE ≤ 6 y conversacional = Z2',
  medio: 'RPE 7 = medio',
  duro: 'RPE ≥ 8 = duro',
  warning: 'la ruta se ha vuelto combate',
} as const;

export function classifyRoute(rpe: number): 'z2' | 'medio' | 'duro' {
  if (rpe <= 6) return 'z2';
  if (rpe < 8) return 'medio';
  return 'duro';
}

export const ROUTE_KIND_LABELS: Record<RouteKind, string> = {
  run: 'Carrera',
  bike: 'Bici',
  swim: 'Natación',
  walk: 'Paseo',
};

export const WILD_KIND_LABELS: Record<WildKind, string> = {
  mtb: 'MTB',
  trail: 'Trail',
  surf: 'Surf',
  climb_outdoor: 'Escalada exterior',
  boulder: 'Boulder',
  skate: 'Skate',
  swim_long: 'Natación larga',
  other: 'Otro',
};
