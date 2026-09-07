// Etapa I load suggestion: "misma carga que la última vez" (no double progression yet — R2 is Etapa II).
import type { ExerciseLog, ExerciseSpec, SessionLog, SetLog } from '@/domain/types';
import type { SessionAdjustment } from '@/domain/rules/pv';

export interface LoadSuggestion {
  loadKg?: number;
  reps?: number;
  rir?: number;
  seconds?: number;
  text: string;
  source: 'last' | 'none';
}

export interface PreviousLog {
  session: SessionLog;
  log: ExerciseLog;
}

/** Spanish decimal formatting: 2.5 → "2,5", 70 → "70". */
export function formatKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

/** Best set = highest load, then most reps (or seconds). */
export function bestSet(log: ExerciseLog | undefined): SetLog | undefined {
  if (!log || log.sets.length === 0) return undefined;
  return [...log.sets].sort((a, b) => {
    if (b.loadKg !== a.loadKg) return b.loadKg - a.loadKg;
    const ra = a.seconds ?? a.reps;
    const rb = b.seconds ?? b.reps;
    return rb - ra;
  })[0];
}

export function lastLoadSuggestion(spec: ExerciseSpec, previous: PreviousLog[]): LoadSuggestion {
  const last = previous.find((p) => p.log.sets.length > 0);
  const best = bestSet(last?.log);
  if (!last || !best) {
    const range =
      spec.isometric && spec.secondsMin !== undefined && spec.secondsMax !== undefined
        ? `${spec.secondsMin}–${spec.secondsMax} s`
        : `${spec.repMin}–${spec.repMax}`;
    return {
      source: 'none',
      text: `Sin historial: elige la carga y completa el rango ${range}`,
    };
  }

  const loadText = spec.weightedBodyweight
    ? `lastre ${formatKg(best.loadKg)} kg`
    : `${formatKg(best.loadKg)} kg`;
  const repsText =
    spec.isometric && best.seconds !== undefined ? `${best.seconds} s` : `${best.reps}`;
  const side = spec.perSide ? ' por lado' : '';
  return {
    source: 'last',
    loadKg: best.loadKg,
    reps: best.reps,
    rir: best.rir,
    seconds: best.seconds,
    text: `Misma carga que la última vez: ${loadText} × ${repsText}${side} (RIR ${best.rir})`,
  };
}

export interface AdjustedTargets {
  sets: number;
  rirTarget: number | [number, number];
}

/** Applies the R1 status adjustment: −1 set on accessories (min 1), RIR +1 on every target. */
export function adjustedTargets(
  spec: ExerciseSpec,
  adjustment: SessionAdjustment,
): AdjustedTargets {
  const sets = spec.accessory ? Math.max(1, spec.sets + adjustment.accessorySetDelta) : spec.sets;
  const rirTarget: number | [number, number] =
    typeof spec.rirTarget === 'number'
      ? spec.rirTarget + adjustment.rirDelta
      : [spec.rirTarget[0] + adjustment.rirDelta, spec.rirTarget[1] + adjustment.rirDelta];
  return { sets, rirTarget };
}

/** Last value of the RIR target ("3→2" → 2). */
export function rirTargetEnd(rir: number | [number, number]): number {
  return typeof rir === 'number' ? rir : rir[1];
}
