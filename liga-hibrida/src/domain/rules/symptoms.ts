// R8 · Symptoms — SPEC §7 R8 (documents 04/05/06): wrist and adductor time series from check-ins
// and sessions, rising trends, KO thresholds, persistence and the barbell-squat transition.
import type { Advisory, Checkin, ISODate, SessionLog } from '../types';
import { addDaysISO, daysBetween, weekStartOf } from '@/lib/date';

export type SymptomPattern = 'wrist' | 'adductor';

export interface SymptomPoint {
  date: ISODate;
  value: number;
  source: 'checkin' | 'session' | 'after';
}

export interface PatternReport {
  pattern: SymptomPattern;
  points: SymptomPoint[];
  latest?: number;
  rising: boolean;
  ko: boolean;
  persistent: boolean;
  advisories: Advisory[];
}

export interface SymptomReport {
  wrist: PatternReport;
  adductor: PatternReport;
  advisories: Advisory[];
}

export const KO_THRESHOLD = 5;
export const PERSISTENT_THRESHOLD = 4;
export const PERSISTENT_DAYS = 7;
export const PERSISTENT_MIN_RECORDS = 3;
export const TRANSITION_ADDUCTOR_AFTER_MAX = 2;
export const TRANSITION_WEEKS = 3;
const SOURCE = '07 R8 · 06 §6';

const LABEL: Record<SymptomPattern, string> = { wrist: 'Muñeca', adductor: 'Aductor' };

/** Chronological series of one pattern (check-in first, then session values of the same day). */
export function symptomSeries(
  checkins: Checkin[],
  sessions: SessionLog[],
  pattern: SymptomPattern,
): SymptomPoint[] {
  const points: SymptomPoint[] = checkins.map((c) => ({
    date: c.date,
    value: pattern === 'wrist' ? c.wrist : c.adductor,
    source: 'checkin',
  }));
  for (const s of sessions) {
    if (!s.completed) continue;
    const during = pattern === 'wrist' ? s.wristDuring : s.adductorDuring;
    if (during !== undefined) points.push({ date: s.date, value: during, source: 'session' });
    if (pattern === 'adductor' && s.adductorAfter !== undefined) {
      points.push({ date: s.date, value: s.adductorAfter, source: 'after' });
    }
  }
  const rank = { checkin: 0, session: 1, after: 2 };
  return points.sort((a, b) =>
    a.date === b.date ? rank[a.source] - rank[b.source] : a.date < b.date ? -1 : 1,
  );
}

/** "Tendencia creciente = 3 registros consecutivos cada uno mayor que el anterior." */
export function isRisingSeries(values: number[]): boolean {
  if (values.length < 3) return false;
  const [a, b, c] = values.slice(-3);
  return a < b && b < c;
}

/** True when any 3 consecutive records of the series rise (R10 looks inside whole weeks). */
export function hasRisingRun(values: number[]): boolean {
  for (let i = 2; i < values.length; i++) {
    if (values[i - 2] < values[i - 1] && values[i - 1] < values[i]) return true;
  }
  return false;
}

/** Value ≥ 4 in every record of the last 7 days, with at least 3 records. */
export function isPersistent(points: SymptomPoint[], today: ISODate): boolean {
  const from = addDaysISO(today, -(PERSISTENT_DAYS - 1));
  const recent = points.filter((p) => p.date >= from && p.date <= today);
  return (
    recent.length >= PERSISTENT_MIN_RECORDS && recent.every((p) => p.value >= PERSISTENT_THRESHOLD)
  );
}

function evaluatePattern(
  pattern: SymptomPattern,
  points: SymptomPoint[],
  today: ISODate,
): PatternReport {
  const values = points.map((p) => p.value);
  const latest = values[values.length - 1];
  const rising = isRisingSeries(values);
  const ko = latest !== undefined && latest >= KO_THRESHOLD;
  const persistent = isPersistent(points, today);
  const advisories: Advisory[] = [];
  const name = LABEL[pattern];
  const where = pattern === 'wrist' ? 'apoyos' : 'pierna';

  if (ko) {
    advisories.push({
      level: 1,
      message: `${name} ${latest}/10 (≥ ${KO_THRESHOLD}): KO en ${where}.`,
      source: SOURCE,
      id: `r8_${pattern}_ko`,
    });
  }
  if (rising) {
    const last3 = values.slice(-3).join(' → ');
    advisories.push({
      level: 1,
      message: `${name} subiendo 3 registros seguidos (${last3}): reduce exposición.`,
      source: SOURCE,
      id: `r8_${pattern}_rising`,
    });
  }
  if (persistent) {
    advisories.push({
      level: 1,
      message: `${name} ≥ ${PERSISTENT_THRESHOLD}/10 durante ${PERSISTENT_DAYS} días: valoración por fisioterapeuta o médico deportivo antes de seguir cargando.`,
      source: SOURCE,
      id: `r8_${pattern}_persistent_${weekStartOf(today)}`,
      sticky: true,
    });
  }
  return { pattern, points, latest, rising, ko, persistent, advisories };
}

/** Evaluates both patterns from the records up to `today` (inclusive). */
export function evaluateSymptoms(params: {
  checkins: Checkin[];
  sessions: SessionLog[];
  today: ISODate;
}): SymptomReport {
  const upTo = (d: ISODate) => d <= params.today;
  const checkins = params.checkins.filter((c) => upTo(c.date));
  const sessions = params.sessions.filter((s) => upTo(s.date));
  const wrist = evaluatePattern('wrist', symptomSeries(checkins, sessions, 'wrist'), params.today);
  const adductor = evaluatePattern(
    'adductor',
    symptomSeries(checkins, sessions, 'adductor'),
    params.today,
  );
  return { wrist, adductor, advisories: [...wrist.advisories, ...adductor.advisories] };
}

/** Points of the last `days` days for the 28-day chart. */
export function recentPoints(points: SymptomPoint[], today: ISODate, days = 28): SymptomPoint[] {
  return points.filter((p) => daysBetween(p.date, today) < days && p.date <= today);
}

export interface TransitionOffer {
  offer: boolean;
  /** Week starts (Monday) of the Cantera sessions considered, oldest first. */
  weeks: ISODate[];
  reason: string;
}

/**
 * Barbell-squat transition (§6.5): offered when `adductorAfter` ≤ 2 in the Cantera sessions of
 * the last 3 weeks with a Cantera session (at least 3 distinct weeks, every session ≤ 2).
 */
export function barbellSquatTransition(sessions: SessionLog[], today: ISODate): TransitionOffer {
  const cantera = sessions
    .filter((s) => s.completed && s.gymId === 'cantera' && s.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const byWeek = new Map<ISODate, SessionLog[]>();
  for (const s of cantera) {
    const w = weekStartOf(s.date);
    byWeek.set(w, [...(byWeek.get(w) ?? []), s]);
  }
  const weeks = [...byWeek.keys()].sort().slice(-TRANSITION_WEEKS);
  if (weeks.length < TRANSITION_WEEKS) {
    return {
      offer: false,
      weeks,
      reason: `Faltan semanas de Cantera con registro (${weeks.length}/${TRANSITION_WEEKS}).`,
    };
  }
  const all = weeks.flatMap((w) => byWeek.get(w)!);
  const missing = all.filter((s) => s.adductorAfter === undefined);
  if (missing.length > 0) {
    return {
      offer: false,
      weeks,
      reason: `Falta el aductor 30–60 min después en ${missing.length} sesión(es) de Cantera.`,
    };
  }
  const tolerated = all.every((s) => s.adductorAfter! <= TRANSITION_ADDUCTOR_AFTER_MAX);
  return tolerated
    ? {
        offer: true,
        weeks,
        reason: `Aductor después ≤ ${TRANSITION_ADDUCTOR_AFTER_MAX} en las ${TRANSITION_WEEKS} últimas semanas de Cantera: la app ofrece sustituir A1 por high-bar squat 3–4×5–8 RIR 3→2.`,
      }
    : {
        offer: false,
        weeks,
        reason: `Aductor después > ${TRANSITION_ADDUCTOR_AFTER_MAX} en alguna sesión de las ${TRANSITION_WEEKS} últimas semanas: sigue con la variante tolerada.`,
      };
}
