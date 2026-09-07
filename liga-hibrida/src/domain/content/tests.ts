// League tests, medals and trainer level — SPEC §6.10.
import type { GymId } from '../types';

export type LeagueTestAreaId =
  'composicion' | 'torso' | 'piernas' | 'motor' | 'control' | 'transferencia';

export interface LeagueTestArea {
  id: LeagueTestAreaId;
  name: string;
  test: string;
}

/** "Tests de Liga (cada 4 semanas: semanas 4, 8 y 12)". */
export const LEAGUE_TEST_AREAS: readonly LeagueTestArea[] = [
  {
    id: 'composicion',
    name: 'Composición',
    test: 'Peso medio 7 d + cintura + 3 fotos comparables (fotos fuera de la app en etapas 1–3; solo nota)',
  },
  { id: 'torso', name: 'Torso', test: 'Dominada y fondo lastrado submáximo a RIR 2 fijo' },
  {
    id: 'piernas',
    name: 'Piernas',
    test: 'Split squat o step-up (carga×reps por lado) + patrón bilateral técnico',
  },
  {
    id: 'motor',
    name: 'Motor',
    test: 'Ruta fácil estándar: mismo recorrido/tiempo, comparar RPE/FC',
  },
  {
    id: 'control',
    name: 'Control',
    test: 'Handstand en pared (s) y libre si existe + tobillo (knee-to-wall cm), cadera, hombro, muñeca',
  },
  {
    id: 'transferencia',
    name: 'Transferencia',
    test: 'Nota: MTB, escalada, surf/skate ¿mejor, igual o peor?',
  },
];

export interface MedalSpec {
  id: GymId;
  name: string;
  condition: string;
  progressFormula: string;
  smart: number[];
}

/** "Medallas del Bloque 1". */
export const MEDALS: readonly MedalSpec[] = [
  {
    id: 'cantera',
    name: 'CANTERA',
    condition:
      '4 semanas consecutivas de Lower sin calambre recurrente ni dolor creciente (SMART 2)',
    progressFormula: 'semanas consecutivas con aductor después ≤ 3 en Cantera y Resorte / 4',
    smart: [2],
  },
  {
    id: 'yunque',
    name: 'YUNQUE',
    condition: 'Mantener fuerza relativa de dominada y fondo (SMART 4) con peso subiendo',
    progressFormula: 'test sem 8 o 12 ≥ baseline en (carga+PC)×reps/PC',
    smart: [4],
  },
  {
    id: 'resorte',
    name: 'RESORTE',
    condition: '+15 % en split squat/step-up vs baseline (SMART 3)',
    progressFormula: '(mejor carga×reps actual / baseline) − 1, sobre 0,15',
    smart: [3],
  },
  {
    id: 'vertigo',
    name: 'VÉRTIGO',
    condition:
      'Muñecas sin síntomas crecientes 8 semanas + 1 marcador de handstand mejorado (SMART 7 y 8)',
    progressFormula: 'tendencia de muñeca + test',
    smart: [7, 8],
  },
];

export interface TrainerLevel {
  id: 'liga' | 'entrenador' | 'aprendiz';
  name: string;
  min: number;
  max: number;
}

/** "Nivel de entrenador": % of A sessions completed in the last 4 weeks. */
export const TRAINER_LEVELS: readonly TrainerLevel[] = [
  { id: 'liga', name: 'Entrenador de Liga', min: 85, max: 100 },
  { id: 'entrenador', name: 'Entrenador', min: 70, max: 84 },
  { id: 'aprendiz', name: 'Aprendiz', min: 0, max: 69 },
];

export function trainerLevelFor(percent: number): TrainerLevel {
  if (percent >= 85) return TRAINER_LEVELS[0];
  if (percent >= 70) return TRAINER_LEVELS[1];
  return TRAINER_LEVELS[2];
}

export const TRAINER_LEVEL_NOTE = 'Las semanas marcadas como viaje/enfermedad no cuentan.';
