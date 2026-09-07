// Helpers around the R2 suggestion for the combat screen (formatting, R1 targets, best sets).
import type { ExerciseLog, ExerciseSpec, SessionLog, SetLog } from '@/domain/types';
import type { SessionAdjustment } from '@/domain/rules/pv';
import type { ProgressionSuggestion } from '@/domain/rules/progression';

export { formatKg } from '@/lib/format';

export interface PreviousLog {
  session: SessionLog;
  log: ExerciseLog;
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

/** Targets of the day from the R2 suggestion (sets and RIR already include R1 and deloads). */
export function targetsFromSuggestion(
  spec: ExerciseSpec,
  suggestion: ProgressionSuggestion,
): AdjustedTargets {
  const rirTarget: number | [number, number] =
    suggestion.kind === 'deload' || typeof spec.rirTarget === 'number'
      ? suggestion.rir
      : [spec.rirTarget[0] + (suggestion.rir - Math.min(...spec.rirTarget)), suggestion.rir];
  return { sets: suggestion.sets, rirTarget };
}

/** Last value of the RIR target ("3→2" → 2). */
export function rirTargetEnd(rir: number | [number, number]): number {
  return typeof rir === 'number' ? rir : rir[1];
}

export const SUGGESTION_KIND_LABEL: Record<ProgressionSuggestion['kind'], string> = {
  first: 'Primera vez',
  increase: 'Subir carga',
  hold: 'Misma carga',
  deload: 'Descarga',
};
