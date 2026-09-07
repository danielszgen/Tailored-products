// R1 · PV and daily status — SPEC §7 R1. Pure functions, no side effects.
import type { Advisory, GymId, Scale5, Status } from '../types';

export interface PvInput {
  sleepHours: number;
  energy: Scale5;
  legs: Scale5;
  wrist: number; // 0–10
  adductor: number; // 0–10
}

/** A previous check-in's symptom values, oldest first, most recent last (today excluded). */
export interface SymptomSample {
  wrist: number;
  adductor: number;
}

export interface PvBreakdown {
  sleep: number;
  energy: number;
  legs: number;
  pain: number;
}

export type KoSource = 'wrist' | 'adductor' | 'greens' | null;

export interface PvResult {
  pv: number; // 0–100
  status: Status;
  greens: number; // 0–4
  breakdown: PvBreakdown;
  koSource: KoSource;
  risingWrist: boolean;
  risingAdductor: boolean;
  reasons: string[]; // Spanish, shown in the UI
}

export function sleepScore(sleepHours: number): number {
  if (sleepHours >= 7.5) return 25;
  if (sleepHours >= 6.5) return 15;
  if (sleepHours >= 6) return 8;
  return 0;
}

export function scale5Score(value: Scale5): number {
  return ((value - 1) / 4) * 25;
}

export function painScore(wrist: number, adductor: number): number {
  const worst = Math.max(wrist, adductor);
  if (worst >= 10) return 0;
  return Math.max(0, 25 - worst * 2.5);
}

/**
 * "Rising" = three consecutive records, each strictly greater than the previous
 * (SPEC §7 R8 definition, applied in R1 to the last two check-ins plus today).
 */
export function isRising(previous: number[], today: number): boolean {
  if (previous.length < 2) return false;
  const a = previous[previous.length - 2];
  const b = previous[previous.length - 1];
  return a < b && b < today;
}

export function computePv(input: PvInput, history: SymptomSample[] = []): PvResult {
  const breakdown: PvBreakdown = {
    sleep: sleepScore(input.sleepHours),
    energy: scale5Score(input.energy),
    legs: scale5Score(input.legs),
    pain: painScore(input.wrist, input.adductor),
  };
  const pv = Math.round(breakdown.sleep + breakdown.energy + breakdown.legs + breakdown.pain);
  const worstPain = Math.max(input.wrist, input.adductor);
  const greens = [
    input.sleepHours >= 7.5,
    input.energy >= 4,
    input.legs >= 4,
    worstPain <= 2,
  ].filter(Boolean).length;

  const risingWrist = isRising(
    history.map((h) => h.wrist),
    input.wrist,
  );
  const risingAdductor = isRising(
    history.map((h) => h.adductor),
    input.adductor,
  );

  const reasons: string[] = [];
  let status: Status = 'ok';
  let koSource: KoSource = null;

  const wristKo = input.wrist >= 5 || risingWrist;
  const adductorKo = input.adductor >= 5 || risingAdductor;

  if (wristKo || adductorKo || greens <= 1) {
    status = 'ko';
    if (wristKo && adductorKo) {
      koSource = input.wrist >= input.adductor ? 'wrist' : 'adductor';
    } else if (wristKo) {
      koSource = 'wrist';
    } else if (adductorKo) {
      koSource = 'adductor';
    } else {
      koSource = 'greens';
    }
    if (input.wrist >= 5) reasons.push(`Muñeca ${input.wrist}/10 (≥ 5)`);
    if (risingWrist) reasons.push('Muñeca subiendo 3 check-ins seguidos');
    if (input.adductor >= 5) reasons.push(`Aductor ${input.adductor}/10 (≥ 5)`);
    if (risingAdductor) reasons.push('Aductor subiendo 3 check-ins seguidos');
    if (greens <= 1) reasons.push(`Solo ${greens} señal${greens === 1 ? '' : 'es'} en verde`);
  } else if (greens === 2 || pv < 60) {
    status = 'cargado';
    if (greens === 2) reasons.push('2 señales en verde');
    if (pv < 60) reasons.push(`PV ${pv} (< 60)`);
  } else {
    reasons.push(`${greens} señales en verde · PV ${pv}`);
  }

  return { pv, status, greens, breakdown, koSource, risingWrist, risingAdductor, reasons };
}

/** Effect of today's status on the planned session (SPEC §7 R1, "Efecto sobre la sesión del día"). */
export interface SessionAdjustment {
  status: Status;
  /** Sets removed from every accessory exercise (CARGADO → −1). */
  accessorySetDelta: 0 | -1;
  /** RIR added to every target (CARGADO → +1). */
  rirDelta: 0 | 1;
  /** PM item becomes recovery / optional. */
  pmToRecovery: boolean;
  /** KO: session reduced to soft technique / mobility. */
  reducedToTechnique: boolean;
  /** KO by wrist in Vértigo: skip handstand block and weighted dips. */
  omitExerciseIds: string[];
  omitWarmupTags: string[];
  /** KO by adductor in Cantera/Resorte: replace with mobility + low-dose Copenhagen isometrics. */
  substituteLowerWithMobility: boolean;
  advisories: Advisory[];
}

export interface AdjustSessionParams {
  status: Status;
  koSource: KoSource;
  gymId: GymId;
  /** Consecutive check-ins already KO by adductor (including today). Triggers the professional-assessment message at 3. */
  adductorKoStreak?: number;
}

export const WRIST_KO_EXERCISES: readonly string[] = ['weighted_dip'];

export function adjustSessionForStatus(params: AdjustSessionParams): SessionAdjustment {
  const { status, koSource, gymId, adductorKoStreak = 0 } = params;
  const base: SessionAdjustment = {
    status,
    accessorySetDelta: 0,
    rirDelta: 0,
    pmToRecovery: false,
    reducedToTechnique: false,
    omitExerciseIds: [],
    omitWarmupTags: [],
    substituteLowerWithMobility: false,
    advisories: [],
  };

  if (status === 'ok') return base;

  if (status === 'cargado') {
    return {
      ...base,
      accessorySetDelta: -1,
      rirDelta: 1,
      pmToRecovery: true,
      advisories: [
        {
          level: 2,
          message:
            'Estado CARGADO: −1 serie en accesorios, RIR +1 y la sesión PM pasa a recuperación u opcional.',
          source: '07 R1',
        },
      ],
    };
  }

  // KO
  const adjustment: SessionAdjustment = {
    ...base,
    reducedToTechnique: true,
    pmToRecovery: true,
    advisories: [
      {
        level: 1,
        message: 'Estado KO: sesión reducida a técnica suave y movilidad. Hoy no se fuerza.',
        source: '07 R1',
      },
    ],
  };

  if (koSource === 'wrist' && gymId === 'vertigo') {
    adjustment.omitExerciseIds = [...WRIST_KO_EXERCISES];
    adjustment.omitWarmupTags = ['handstand', 'wrist_support'];
    adjustment.advisories.push({
      level: 1,
      message: 'KO por muñeca: Vértigo omite el bloque de handstand y los fondos.',
      source: '07 R1',
    });
  }

  if (koSource === 'adductor' && (gymId === 'cantera' || gymId === 'resorte')) {
    adjustment.substituteLowerWithMobility = true;
    adjustment.advisories.push({
      level: 1,
      message:
        'KO por aductor: la sesión de pierna se sustituye por movilidad + Copenhagen isométrico de baja dosis.',
      source: '07 R1',
    });
    if (adductorKoStreak >= 3) {
      adjustment.advisories.push({
        level: 1,
        message:
          'El aductor lleva 3 registros en KO. Valoración por fisioterapeuta o médico deportivo antes de seguir cargando.',
        source: '07 R1 · 06 §6',
      });
    }
  }

  return adjustment;
}
