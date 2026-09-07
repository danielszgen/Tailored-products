// R2 · Double progression — SPEC §7 R2 (document 05). Pure: (spec, history, state) → suggestion.
import type {
  Baseline,
  Checkin,
  ExerciseSpec,
  ISODate,
  RouteLog,
  SetLog,
  Status,
  Wave,
  WildLog,
} from '../types';
import { addDaysISO } from '@/lib/date';
import { formatKg } from '@/lib/format';
import { roundToStep } from '@/lib/math';
import { DELOAD_LOAD_FACTOR, DELOAD_RIR, deloadSets } from './deload';

export interface ProgressionSession {
  date: ISODate;
  wave: Wave;
  statusAtStart?: Status;
  feel?: 'facil' | 'normal' | 'pesado';
  sets: SetLog[];
}

export interface ProgressionInput {
  spec: ExerciseSpec;
  /**
   * Completed sessions of this exercise, most recent first. Two are enough for the rule; pass
   * three or more so a deload week can find "la última sesión no-deload".
   */
  history: ProgressionSession[];
  status: Status;
  wave: Wave;
  baseline?: Baseline;
  /** WildLog 'dura' (or route 'duro') in the previous 24 h. */
  hardSportLast24h?: boolean;
  /** The last 3 check-ins all had sleep < 7 h. */
  lowSleepStreak?: boolean;
  /** R1 adjustments merged into the targets (CARGADO → accessories −1 set, RIR +1). */
  accessorySetDelta?: 0 | -1;
  rirDelta?: 0 | 1;
}

export type ProgressionKind = 'first' | 'increase' | 'hold' | 'deload';

export interface ProgressionSuggestion {
  kind: ProgressionKind;
  /** Undefined only when there is no history and no baseline. */
  loadKg?: number;
  /** Reps, or seconds for isometric exercises. */
  repTarget: [number, number];
  sets: number;
  rir: number;
  reason: string;
  /** Blockers that stopped an increase (Spanish, from the "Cuándo NO subir carga" list). */
  blocked: string[];
  deltaKg?: number;
  isometric: boolean;
}

/** "Sesión dura de trail/MTB/surf el día anterior": a hard adventure or route on the previous day. */
export function hardSportBefore(
  date: ISODate,
  wild: Pick<WildLog, 'date' | 'intensity'>[],
  routes: Pick<RouteLog, 'date' | 'countsAs'>[],
): boolean {
  const yesterday = addDaysISO(date, -1);
  return (
    wild.some((w) => w.date === yesterday && w.intensity === 'dura') ||
    routes.some((r) => r.date === yesterday && r.countsAs === 'duro')
  );
}

/** "Sueño caído varias noches": the last 3 check-ins (up to `date`) all below 7 h. */
export function lowSleepStreak(
  checkins: Pick<Checkin, 'date' | 'sleepHours'>[],
  date: ISODate,
): boolean {
  const last = checkins
    .filter((c) => c.date <= date)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-3);
  return last.length === 3 && last.every((c) => c.sleepHours < 7);
}

/** Working RIR goal: a plain number, or the lower bound of a range ("3→2" → 2, "1–2" → 1). */
export function rirGoal(rirTarget: number | [number, number]): number {
  return typeof rirTarget === 'number' ? rirTarget : Math.min(rirTarget[0], rirTarget[1]);
}

function isIsometric(spec: ExerciseSpec): boolean {
  return !!spec.isometric && spec.secondsMin !== undefined && spec.secondsMax !== undefined;
}

function repRange(spec: ExerciseSpec): [number, number] {
  return isIsometric(spec) ? [spec.secondsMin!, spec.secondsMax!] : [spec.repMin, spec.repMax];
}

function reachedTop(spec: ExerciseSpec, set: SetLog): boolean {
  return isIsometric(spec) ? (set.seconds ?? 0) >= spec.secondsMax! : set.reps >= spec.repMax;
}

/** Sets that session was supposed to log (per side ×2; CARGADO accessories −1). */
export function expectedSets(spec: ExerciseSpec, statusAtStart?: Status): number {
  const reduced = spec.accessory && statusAtStart === 'cargado' ? 1 : 0;
  const base = Math.max(1, spec.sets - reduced);
  return spec.perSide ? base * 2 : base;
}

/** "8/8/8/8" or "25/25 s" (seconds for isometrics). */
export function describeSets(spec: ExerciseSpec, sets: SetLog[]): string {
  if (sets.length === 0) return '—';
  if (isIsometric(spec)) return `${sets.map((s) => s.seconds ?? 0).join('/')} s`;
  return sets.map((s) => s.reps).join('/');
}

export function bestLoad(sets: SetLog[]): number | undefined {
  if (sets.length === 0) return undefined;
  return Math.max(...sets.map((s) => s.loadKg));
}

function minRir(sets: SetLog[]): number {
  return Math.min(...sets.map((s) => s.rir));
}

/**
 * "todas las series de la última sesión alcanzaron repMax con rir ≥ rirTarget"
 * (and the session logged every planned set).
 */
export function completedRange(spec: ExerciseSpec, session: ProgressionSession): boolean {
  const goal = rirGoal(spec.rirTarget);
  if (session.sets.length < expectedSets(spec, session.statusAtStart)) return false;
  return session.sets.every((s) => reachedTop(spec, s) && s.rir >= goal);
}

/** "+ loadStepKg (o +2,5–5 %, el mayor)", rounded to the load step. */
export function loadIncrement(spec: ExerciseSpec, loadKg: number): number {
  const step = spec.loadStepKg;
  if (step <= 0) return 0;
  const percent = loadKg * 0.025;
  return Math.max(step, roundToStep(percent, step));
}

function roundLoad(spec: ExerciseSpec, loadKg: number): number {
  return roundToStep(loadKg, spec.loadStepKg > 0 ? spec.loadStepKg : 0.5);
}

/** The five "Cuándo NO subir carga" blockers of R2 that apply, in Spanish. */
export function increaseBlockers(input: ProgressionInput): string[] {
  const { spec, history, status } = input;
  const goal = rirGoal(spec.rirTarget);
  const blocked: string[] = [];
  const lastTwo = history.slice(0, 2);
  if (lastTwo.length === 2 && lastTwo.every((s) => s.sets.length > 0 && minRir(s.sets) < goal)) {
    blocked.push('el RIR real quedó por debajo del objetivo en las 2 últimas sesiones');
  }
  if (history[0]?.feel === 'pesado') blocked.push('la última sesión fue pesada');
  if (status !== 'ok') blocked.push(`hoy estás ${status.toUpperCase()}`);
  if (input.hardSportLast24h) blocked.push('hubo deporte duro en las 24 h previas');
  if (input.lowSleepStreak) blocked.push('los 3 últimos check-ins tienen sueño < 7 h');
  return blocked;
}

function targetSets(input: ProgressionInput): number {
  const { spec } = input;
  const delta = spec.accessory ? (input.accessorySetDelta ?? 0) : 0;
  return Math.max(1, spec.sets + delta);
}

function targetRir(input: ProgressionInput): number {
  return rirGoal(input.spec.rirTarget) + (input.rirDelta ?? 0);
}

function withUnit(spec: ExerciseSpec, range: [number, number]): string {
  return isIsometric(spec) ? `${range[0]}–${range[1]} s` : `${range[0]}–${range[1]}`;
}

function loadLabel(spec: ExerciseSpec, loadKg: number): string {
  return spec.weightedBodyweight ? `lastre ${formatKg(loadKg)} kg` : `${formatKg(loadKg)} kg`;
}

export function suggestProgression(input: ProgressionInput): ProgressionSuggestion {
  const { spec, history, wave, baseline } = input;
  const isometric = isIsometric(spec);
  const range = repRange(spec);
  const last = history.find((s) => s.sets.length > 0);
  const sets = targetSets(input);
  const rir = targetRir(input);

  // Deload week: 90 % of the last non-deload session, reduced sets, RIR 4.
  if (wave === 'deload') {
    const reference = history.find((s) => s.wave !== 'deload' && s.sets.length > 0) ?? last;
    const refLoad = reference ? bestLoad(reference.sets) : baseline?.loadKg;
    const deloaded = deloadSets(spec);
    if (refLoad === undefined) {
      return {
        kind: 'deload',
        repTarget: range,
        sets: deloaded,
        rir: DELOAD_RIR,
        reason: `Descarga: sin historial. Elige una carga cómoda, ${deloaded} series, RIR 4.`,
        blocked: [],
        isometric,
      };
    }
    const loadKg = roundLoad(spec, refLoad * DELOAD_LOAD_FACTOR);
    return {
      kind: 'deload',
      loadKg,
      repTarget: range,
      sets: deloaded,
      rir: DELOAD_RIR,
      reason: `Descarga: ${loadLabel(spec, loadKg)} (90 % de ${formatKg(refLoad)} kg), ${deloaded} series, RIR 4.`,
      blocked: [],
      isometric,
    };
  }

  // First session: baseline if known, otherwise pick a load.
  if (!last) {
    if (baseline) {
      return {
        kind: 'first',
        loadKg: baseline.loadKg,
        repTarget: range,
        sets,
        rir,
        reason: `Primera sesión: baseline ${loadLabel(spec, baseline.loadKg)} × ${baseline.reps}. Completa el rango ${withUnit(spec, range)}.`,
        blocked: [],
        isometric,
      };
    }
    return {
      kind: 'first',
      repTarget: range,
      sets,
      rir,
      reason: `Sin historial: elige la carga y completa el rango ${withUnit(spec, range)}.`,
      blocked: [],
      isometric,
    };
  }

  const load = bestLoad(last.sets)!;
  const done = describeSets(spec, last.sets);
  const complete = completedRange(spec, last);

  if (!complete) {
    const missing =
      last.sets.length < expectedSets(spec, last.statusAtStart)
        ? ` (${last.sets.length}/${expectedSets(spec, last.statusAtStart)} series)`
        : '';
    return {
      kind: 'hold',
      loadKg: load,
      repTarget: range,
      sets,
      rir,
      reason: `Misma carga (${loadLabel(spec, load)}): ${done}${missing} → completa el rango ${withUnit(spec, range)} a RIR ${rirGoal(spec.rirTarget)}.`,
      blocked: [],
      isometric,
    };
  }

  const blocked = increaseBlockers(input);
  if (blocked.length > 0) {
    return {
      kind: 'hold',
      loadKg: load,
      repTarget: range,
      sets,
      rir,
      reason: `Misma carga (${loadLabel(spec, load)}): rango completo (${done}), pero no subo porque ${blocked.join(' y ')}.`,
      blocked,
      isometric,
    };
  }

  const delta = loadIncrement(spec, load);
  if (delta <= 0) {
    return {
      kind: 'hold',
      loadKg: load,
      repTarget: range,
      sets,
      rir,
      reason: `Rango completo (${done}) y sin carga que subir: mantén ${withUnit(spec, range)} con control.`,
      blocked: [],
      isometric,
    };
  }

  const nextLoad = roundLoad(spec, load + delta);
  const nextTarget: [number, number] = isometric ? range : [spec.repMin, spec.repMin + 1];
  return {
    kind: 'increase',
    loadKg: nextLoad,
    repTarget: nextTarget,
    sets,
    rir,
    deltaKg: nextLoad - load,
    reason: `Subo ${formatKg(nextLoad - load)} kg porque completaste ${done} a RIR ${minRir(last.sets)}. Objetivo ${withUnit(spec, nextTarget)}.`,
    blocked: [],
    isometric,
  };
}
