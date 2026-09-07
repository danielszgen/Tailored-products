// R7 · Weight and calories — SPEC §7 R7 over the fortnightly algorithm of §6.9 (document 03).
// Pure: weight points + block calendar → weekly trend and the kcal proposal (exact table text).
import type { Adjustment, ISODate } from '../types';
import { BIWEEKLY_ALGORITHM, NUTRITION_PHASES } from '../content/nutrition';
import { addDaysISO, daysBetween, weekOfBlock } from '@/lib/date';
import { formatKg, formatPct } from '@/lib/format';
import { mean, roundTo } from '@/lib/math';

export interface WeightPoint {
  date: ISODate;
  value: number;
}

export interface WeeklyTrend {
  /** Mean of the 7 days ending at `until` (inclusive). */
  meanThis?: number;
  /** Mean of the 7 days before those. */
  meanPrev?: number;
  countThis: number;
  countPrev: number;
  /** (meanThis − meanPrev) / meanPrev × 100, in %/week. */
  trendPct?: number;
}

/** Minimum weighings per 7-day window for a trend (document 03: "pesarse 5–7 días/sem"). */
export const MIN_POINTS_PER_WEEK = 2;
/** |trend| below this is "peso estable". // DECISION: see docs/PREGUNTAS.md (R7). */
export const STABLE_BAND_PCT = 0.05;
export const TARGET_ZONE_PCT: [number, number] = [0.1, 0.25];
export const CUT_THRESHOLD_PCT = 0.35;
export const EVALUATION_EVERY_DAYS = 14;

function inWindow(points: WeightPoint[], from: ISODate, to: ISODate): number[] {
  return points.filter((p) => p.date >= from && p.date <= to).map((p) => p.value);
}

/** Weekly trend at `until`: this week vs the previous week, ignoring gaps (R7). */
export function weeklyTrend(points: WeightPoint[], until: ISODate): WeeklyTrend {
  const thisWeek = inWindow(points, addDaysISO(until, -6), until);
  const prevWeek = inWindow(points, addDaysISO(until, -13), addDaysISO(until, -7));
  const meanThis = mean(thisWeek);
  const meanPrev = mean(prevWeek);
  const enough = thisWeek.length >= MIN_POINTS_PER_WEEK && prevWeek.length >= MIN_POINTS_PER_WEEK;
  const trendPct =
    enough && meanThis !== undefined && meanPrev !== undefined && meanPrev > 0
      ? roundTo(((meanThis - meanPrev) / meanPrev) * 100, 3)
      : undefined;
  return {
    meanThis: meanThis === undefined ? undefined : roundTo(meanThis, 2),
    meanPrev: meanPrev === undefined ? undefined : roundTo(meanPrev, 2),
    countThis: thisWeek.length,
    countPrev: prevWeek.length,
    trendPct,
  };
}

/** Evaluation dates: every 14 days from blockStart, the first one at the start of week 3. */
export function evaluationDates(blockStart: ISODate, count = 6): ISODate[] {
  return Array.from({ length: count }, (_, i) =>
    addDaysISO(blockStart, EVALUATION_EVERY_DAYS * (i + 1)),
  );
}

/** The latest evaluation date ≤ today, or null during weeks 1–2 ("solo miden"). */
export function latestEvaluationDate(blockStart: ISODate, today: ISODate): ISODate | null {
  const diff = daysBetween(blockStart, today);
  if (diff < EVALUATION_EVERY_DAYS) return null;
  const n = Math.floor(diff / EVALUATION_EVERY_DAYS);
  return addDaysISO(blockStart, EVALUATION_EVERY_DAYS * n);
}

export function nextEvaluationDate(blockStart: ISODate, today: ISODate): ISODate {
  const diff = Math.max(0, daysBetween(blockStart, today));
  const n = Math.floor(diff / EVALUATION_EVERY_DAYS) + 1;
  return addDaysISO(blockStart, EVALUATION_EVERY_DAYS * n);
}

export type KcalProposalKind = 'increase' | 'hold' | 'decrease' | 'review' | 'insufficient';

export interface KcalProposal {
  evaluationDate: ISODate;
  weekOfBlock: number;
  kind: KcalProposalKind;
  trend: WeeklyTrend;
  /** "Situación" column of the table (or the losing-weight cases). */
  situation: string;
  /** "Decisión" column: the exact text shown to Daniel. */
  decision: string;
  /** Nutrition phase of the block for this week. */
  phase: string;
  text: string;
}

export interface KcalParams {
  points: WeightPoint[];
  blockStart: ISODate;
  today: ISODate;
  /** Performance drop / extreme hunger signals ("Rendimiento cae / hambre extrema"). */
  performanceDrop?: boolean;
  /** Poor recovery (e.g. mean PV < 60 or repeated KO in the last week). */
  exhausted?: boolean;
}

export function nutritionPhaseFor(weekOfBlock: number): string {
  const w = Math.min(12, Math.max(1, weekOfBlock));
  const row =
    w <= 2
      ? NUTRITION_PHASES[0]
      : w <= 5
        ? NUTRITION_PHASES[1]
        : w <= 8
          ? NUTRITION_PHASES[2]
          : w <= 11
            ? NUTRITION_PHASES[3]
            : NUTRITION_PHASES[4];
  return `${row.weeks}: ${row.action}`;
}

export function kcalAdjustmentId(evaluationDate: ISODate): string {
  return `kcal_${evaluationDate}`;
}

/**
 * The fortnightly proposal (null during weeks 1–2 and before the block). The decision text is
 * the literal "Decisión" of the table; losing weight uses the two R7 sentences.
 */
export function kcalProposal(params: KcalParams): KcalProposal | null {
  const evaluationDate = latestEvaluationDate(params.blockStart, params.today);
  if (!evaluationDate) return null;
  const week = weekOfBlock(evaluationDate, params.blockStart);
  const phase = nutritionPhaseFor(week);
  const trend = weeklyTrend(params.points, addDaysISO(evaluationDate, -1));
  const base = { evaluationDate, weekOfBlock: week, trend, phase };

  if (trend.trendPct === undefined) {
    return {
      ...base,
      kind: 'insufficient',
      situation: 'Faltan pesos',
      decision: 'Pésate 5–7 días/sem al levantarse para poder evaluar la quincena.',
      text: `Sin tendencia (${trend.countPrev}+${trend.countThis} pesos en 14 días). Pésate 5–7 días/sem al levantarse.`,
    };
  }

  const t = trend.trendPct;
  const trendText = `${formatPct(t)}/sem (${formatKg(trend.meanPrev!)} → ${formatKg(trend.meanThis!)} kg)`;
  let row = BIWEEKLY_ALGORITHM[0];
  let kind: KcalProposalKind = 'increase';
  let situation: string;
  let decision: string;

  if (t < -STABLE_BAND_PCT) {
    situation = 'Pierde peso';
    if (params.exhausted) {
      kind = 'review';
      decision = 'Revisa carga + energía antes de añadir más comida a ciegas.';
    } else {
      kind = 'increase';
      decision = 'Añade comida.';
    }
  } else if (t < STABLE_BAND_PCT) {
    row = BIWEEKLY_ALGORITHM[0];
    situation = row.situation;
    decision = row.decision;
    kind = 'increase';
  } else if (t < TARGET_ZONE_PCT[0]) {
    row = BIWEEKLY_ALGORITHM[1];
    situation = row.situation;
    decision = row.decision;
    kind = 'increase';
  } else if (t <= TARGET_ZONE_PCT[1]) {
    row = BIWEEKLY_ALGORITHM[2];
    situation = row.situation;
    decision = row.decision;
    kind = 'hold';
  } else if (t <= CUT_THRESHOLD_PCT) {
    situation = 'Sube 0,25–0,35 %/sem';
    decision =
      'Mantener y vigilar cintura (por encima de la zona objetivo, por debajo del umbral de recorte).';
    kind = 'hold';
  } else {
    row = BIWEEKLY_ALGORITHM[3];
    situation = row.situation;
    decision = `${row.decision} (solo si la cintura acelera)`;
    kind = 'decrease';
  }

  if (params.performanceDrop && (kind === 'decrease' || kind === 'hold')) {
    row = BIWEEKLY_ALGORITHM[4];
    situation = row.situation;
    decision = row.decision;
    kind = 'review';
  }

  return {
    ...base,
    kind,
    situation,
    decision,
    text: `Semana ${week} · ${trendText}. ${situation} → ${decision}`,
  };
}

/** Adjustment row to store when Daniel accepts a proposal. */
export function toAdjustment(proposal: KcalProposal, date: ISODate): Adjustment {
  return {
    id: kcalAdjustmentId(proposal.evaluationDate),
    date,
    kind: 'kcal',
    detail: proposal.text,
    source: 'app',
  };
}
