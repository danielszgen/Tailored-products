// Block calendar (12 weeks, waves, deloads) — SPEC §6.3, §6.5 "Progresión del bloque",
// §6.7 "Progresión del aeróbico por ola", §6.2 horizons, §7 R3 (wave mapping only).
import type { ISODate, Wave } from '../types';
import { addDaysISO } from '@/lib/date';

export const DEFAULT_BLOCK_START: ISODate = '2026-09-07'; // DECISION: D13 (Monday)
export const BLOCK_WEEKS = 12;
export const BLOCK_END: ISODate = '2026-11-29';
export const TEST_WEEKS: readonly number[] = [4, 8, 12];
export const DELOAD_WEEKS: readonly number[] = [4, 8];

/** Olas: 1–3 → 1, 4 → deload, 5–7 → 2, 8 → deload, 9–11 → 3, 12 → eval (SPEC §7 R3). */
export function waveForWeek(weekOfBlock: number): Wave {
  if (weekOfBlock < 1) return 1;
  if (weekOfBlock > 12) return 'eval';
  if (weekOfBlock === 4 || weekOfBlock === 8) return 'deload';
  if (weekOfBlock === 12) return 'eval';
  if (weekOfBlock <= 3) return 1;
  if (weekOfBlock <= 7) return 2;
  return 3;
}

export function waveLabel(wave: Wave): string {
  switch (wave) {
    case 1:
      return 'Ola 1';
    case 2:
      return 'Ola 2';
    case 3:
      return 'Ola 3';
    case 'deload':
      return 'Descarga';
    case 'eval':
      return 'Final de Liga';
  }
}

export interface BlockWeekInfo {
  weekOfBlock: number;
  start: ISODate;
  end: ISODate;
  wave: Wave;
  label: string;
  isDeload: boolean;
  isTest: boolean;
}

export function blockWeeks(blockStart: ISODate = DEFAULT_BLOCK_START): BlockWeekInfo[] {
  return Array.from({ length: BLOCK_WEEKS }, (_, i) => {
    const weekOfBlock = i + 1;
    const wave = waveForWeek(weekOfBlock);
    return {
      weekOfBlock,
      start: addDaysISO(blockStart, i * 7),
      end: addDaysISO(blockStart, i * 7 + 6),
      wave,
      label: waveLabel(wave),
      isDeload: DELOAD_WEEKS.includes(weekOfBlock),
      isTest: TEST_WEEKS.includes(weekOfBlock),
    };
  });
}

/** SPEC §6.5 "Progresión del bloque (aplica a los 4 gimnasios)". */
export interface BlockProgressionRow {
  weeks: string;
  objective: string;
  mainLifts: string;
  accessories: string;
  feel: string;
}

export const BLOCK_PROGRESSION: readonly BlockProgressionRow[] = [
  {
    weeks: '1–3',
    objective: 'Aprendizaje + volumen base',
    mainLifts: 'RIR 3→2, parte baja del rango',
    accessories: 'RIR 2–3',
    feel: 'Sales con margen',
  },
  {
    weeks: '4',
    objective: 'Descarga',
    mainLifts: '−30 a −40 % series, RIR 4',
    accessories: 'Mitad de volumen',
    feel: 'Fresco',
  },
  {
    weeks: '5–7',
    objective: 'Sobrecarga',
    mainLifts: 'RIR 2, subir reps/carga',
    accessories: 'RIR 2',
    feel: 'Sólido',
  },
  {
    weeks: '8',
    objective: 'Descarga',
    mainLifts: '−30 a −40 % series',
    accessories: 'Mitad de volumen',
    feel: 'Recuperación',
  },
  {
    weeks: '9–11',
    objective: 'Consolidación',
    mainLifts: 'RIR 2→1 en última serie selecta',
    accessories: 'RIR 1–2',
    feel: 'Intenso, técnico',
  },
  {
    weeks: '12',
    objective: 'Revisión',
    mainLifts: 'Sin 1RM; comparar cargas a mismo RIR',
    accessories: 'Reducido',
    feel: 'Medir',
  },
];

export function blockProgressionForWeek(weekOfBlock: number): BlockProgressionRow {
  const w = Math.min(12, Math.max(1, weekOfBlock));
  if (w <= 3) return BLOCK_PROGRESSION[0];
  if (w === 4) return BLOCK_PROGRESSION[1];
  if (w <= 7) return BLOCK_PROGRESSION[2];
  if (w === 8) return BLOCK_PROGRESSION[3];
  if (w <= 11) return BLOCK_PROGRESSION[4];
  return BLOCK_PROGRESSION[5];
}

/** SPEC §6.7 "Progresión del aeróbico por ola". */
export interface AerobicRow {
  weeks: string;
  z2: string;
  adventure: string;
}

export const AEROBIC_PROGRESSION: readonly AerobicRow[] = [
  { weeks: 'sem 1–3', z2: "2× Z2 40–55'", adventure: "aventura 60–90' fácil/moderada" },
  { weeks: 'sem 4 deload', z2: '−25–35 % duración, solo fácil', adventure: 'solo fácil' },
  { weeks: 'sem 5–7', z2: "2× Z2 45–60'", adventure: "aventura 75–120'" },
  { weeks: 'sem 8 deload', z2: '−25–35 % duración, solo fácil', adventure: 'solo fácil' },
  {
    weeks: 'sem 9–11',
    z2: 'Z2 + una progresión suave si todo verde',
    adventure: "aventura 90–150' opcional",
  },
  { weeks: 'sem 12', z2: 'test submáximo en ruta conocida', adventure: '—' },
];

export function aerobicRowForWave(wave: Wave): AerobicRow {
  switch (wave) {
    case 1:
      return AEROBIC_PROGRESSION[0];
    case 'deload':
      return AEROBIC_PROGRESSION[1];
    case 2:
      return AEROBIC_PROGRESSION[2];
    case 3:
      return AEROBIC_PROGRESSION[4];
    case 'eval':
      return AEROBIC_PROGRESSION[5];
  }
}

/** SPEC §6.2 "Horizontes". */
export const HORIZONS: readonly { label: string; date: ISODate }[] = [
  { label: '12 semanas', date: '2026-11-29' },
  { label: '6 meses', date: '2027-03-06' },
  { label: '12 meses', date: '2027-09-06' },
  { label: '3 años', date: '2029-09-06' },
];
