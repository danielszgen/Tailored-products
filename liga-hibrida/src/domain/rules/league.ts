// R10 · Block progress, medals and evolution — SPEC §7 R10 over §6.2 (stats 0–100, SMART),
// §6.3 (Formas), §6.10 (medals, trainer level) and the 12-week report of §10.
// Pure: records of the block → progress numbers, conditions and Markdown. No React, no Dexie.
import type {
  Adjustment,
  Checkin,
  Form,
  GymId,
  ISODate,
  LeagueTest,
  Medal,
  Profile,
  RegenLog,
  RouteLog,
  SessionLog,
  SmartManual,
  StatKey,
  Wave,
  WeekPlan,
  WeekTemplate,
  WildLog,
} from '../types';
import { BLOCK_WEEKS, TEST_WEEKS, waveForWeek, waveLabel } from '../content/block';
import { FORMS } from '../content/phases';
import { SMART_OBJECTIVES, STATS } from '../content/smart';
import { MEDALS, trainerLevelFor, TRAINER_LEVEL_NOTE, type TrainerLevel } from '../content/tests';
import { WEEK_TEMPLATE_NAMES } from '../content/week';
import { addDaysISO, daysBetween, formatShort } from '@/lib/date';
import { formatKg, formatPct } from '@/lib/format';
import { clamp, mean, roundTo } from '@/lib/math';
import { deloadRouteMinutes } from './deload';
import { bestMark, exerciseHistory, markScore, relativeStrength, type ExerciseMark } from './marks';
import { evaluateSymptoms, hasRisingRun, KO_THRESHOLD, symptomSeries } from './symptoms';
import { weeklyTrend, type WeightPoint } from './weight';

// ---------------------------------------------------------------------------
// Input and constants
// ---------------------------------------------------------------------------

export interface LeagueInput {
  profile: Profile;
  today: ISODate;
  checkins: Checkin[];
  sessions: SessionLog[];
  routes: RouteLog[];
  wild: WildLog[];
  regen: RegenLog[];
  tests: LeagueTest[];
  /** Stored weeks (their template decides which weeks are "viaje"). */
  weeks: WeekPlan[];
  /** Stored medals: an earned medal stays earned. */
  medals: Medal[];
  adjustments: Adjustment[];
}

export const LOWER_GYMS: readonly GymId[] = ['cantera', 'resorte'];
export const UPPER_GYMS: readonly GymId[] = ['yunque', 'vertigo'];
/** "adductorAfter ≤ 3 en Cantera y Resorte" (§6.10). */
export const CANTERA_ADDUCTOR_MAX = 3;
export const CANTERA_WEEKS = 4;
/** "+15 % en split squat/step-up vs baseline" (§6.10). */
export const RESORTE_GAIN = 0.15;
/** "Muñecas sin síntomas crecientes 8 semanas" (§6.10). */
export const VERTIGO_WEEKS = 8;
/** "90–150 min/sem fáciles sostenibles" (SMART 5). */
export const Z2_WEEKLY_RANGE: [number, number] = [90, 150];
/** "Ganancia 0,15–0,30 % del peso/semana en semanas de construcción" (SMART 9). */
export const COMPOSITION_BAND: [number, number] = [0.15, 0.3];
/** MASA: "penalización si la tendencia semanal > 0,40 %" — 20 points. // DECISION: see docs/PREGUNTAS.md (R10). */
export const MASA_TREND_LIMIT = 0.4;
export const MASA_TREND_PENALTY = 20;
export const MASA_TARGET_KG = 85;
/** A sessions per week: 2 Lower + 2 Upper + 1 Z2 + 1 movilidad (§6.4). */
export const ANCHORS_PER_WEEK = 6;
export const LEVEL_WEEKS = 4;
export const SPLIT_SQUAT_IDS: readonly string[] = [
  'bulgarian_split_squat',
  'front_foot_elevated_split_squat',
];
export const STRENGTH_STAT_IDS: readonly string[] = [
  'bench_press',
  'weighted_pullup',
  'trap_bar_deadlift',
  'bulgarian_split_squat',
];

const TORSO: readonly { id: string; label: string; test: 'pullupRir2' | 'dipRir2' }[] = [
  { id: 'weighted_pullup', label: 'Dominada lastrada', test: 'pullupRir2' },
  { id: 'weighted_dip', label: 'Fondos lastrados', test: 'dipRir2' },
];

// ---------------------------------------------------------------------------
// Weeks of the block
// ---------------------------------------------------------------------------

export interface BlockWeekRecords {
  weekOfBlock: number;
  start: ISODate;
  end: ISODate;
  wave: Wave;
  /** Template of the stored plan (null when the week was never stored). */
  template: WeekTemplate | null;
  /** The week is over (its Sunday is before today). */
  completed: boolean;
  sessions: SessionLog[];
  routes: RouteLog[];
  wild: WildLog[];
  regen: RegenLog[];
  checkins: Checkin[];
}

/** Weeks 1…12 that have started, with their records. */
export function blockWeekRecords(input: LeagueInput): BlockWeekRecords[] {
  const out: BlockWeekRecords[] = [];
  for (let w = 1; w <= BLOCK_WEEKS; w++) {
    const start = addDaysISO(input.profile.blockStart, (w - 1) * 7);
    if (start > input.today) break;
    const end = addDaysISO(start, 6);
    const within = (date: ISODate) => date >= start && date <= end;
    out.push({
      weekOfBlock: w,
      start,
      end,
      wave: waveForWeek(w),
      template: input.weeks.find((x) => x.weekStart === start)?.template ?? null,
      completed: end < input.today,
      sessions: input.sessions.filter((s) => s.completed && within(s.date)),
      routes: input.routes.filter((r) => within(r.date)),
      wild: input.wild.filter((x) => within(x.date)),
      regen: input.regen.filter((g) => within(g.date)),
      checkins: input.checkins.filter((c) => within(c.date)),
    });
  }
  return out;
}

type WeekVerdict = 'ok' | 'fail' | 'skip';

/** Consecutive 'ok' weeks ending at the latest week ('skip' weeks are transparent). */
function currentStreak(weeks: BlockWeekRecords[], judge: (w: BlockWeekRecords) => WeekVerdict) {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const v = judge(weeks[i]);
    if (v === 'skip') continue;
    if (v === 'fail') break;
    streak++;
  }
  return streak;
}

/** The day after the week in which the streak first reached `target`. */
function streakReachedOn(
  weeks: BlockWeekRecords[],
  judge: (w: BlockWeekRecords) => WeekVerdict,
  target: number,
): ISODate | undefined {
  let streak = 0;
  for (const w of weeks) {
    const v = judge(w);
    if (v === 'skip') continue;
    streak = v === 'ok' ? streak + 1 : 0;
    if (streak >= target) return addDaysISO(w.end, 1);
  }
  return undefined;
}

/**
 * Cantera / SMART 2: a week of Lower counts when every Lower session has `adductorAfter` ≤ 3
 * (falls back to `adductorDuring`; unrecorded = no cramp reported) and the adductor series of the
 * week never rises 3 records in a row. Travel weeks are skipped. // DECISION: see docs/PREGUNTAS.md (R10).
 */
export function lowerWeekVerdict(week: BlockWeekRecords): WeekVerdict {
  if (week.template === 'viaje') return 'skip';
  const lower = week.sessions.filter((s) => LOWER_GYMS.includes(s.gymId));
  if (lower.length === 0) return 'fail';
  const cramp = lower.some(
    (s) => (s.adductorAfter ?? s.adductorDuring ?? 0) > CANTERA_ADDUCTOR_MAX,
  );
  const rising = hasRisingRun(
    symptomSeries(week.checkins, week.sessions, 'adductor').map((p) => p.value),
  );
  return cramp || rising ? 'fail' : 'ok';
}

/** Vértigo / SMART 7: a week is clean when the wrist series never rises 3 in a row nor reaches KO. */
export function wristWeekVerdict(week: BlockWeekRecords): WeekVerdict {
  if (week.template === 'viaje') return 'skip';
  const values = symptomSeries(week.checkins, week.sessions, 'wrist').map((p) => p.value);
  if (values.length === 0) return 'skip';
  return hasRisingRun(values) || Math.max(...values) >= KO_THRESHOLD ? 'fail' : 'ok';
}

// ---------------------------------------------------------------------------
// Weight helpers
// ---------------------------------------------------------------------------

export function weightPoints(checkins: Checkin[]): WeightPoint[] {
  return checkins
    .filter((c) => typeof c.weightKg === 'number')
    .map((c) => ({ date: c.date, value: c.weightKg! }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Mean of the weights of the 7 days ending at `date`; else the last weight of the 30 days before. */
export function weightAt(points: WeightPoint[], date: ISODate): number | undefined {
  const week = points.filter((p) => p.date <= date && daysBetween(p.date, date) < 7);
  const m = mean(week.map((p) => p.value));
  if (m !== undefined) return roundTo(m, 2);
  const earlier = points.filter((p) => p.date <= date && daysBetween(p.date, date) < 30);
  return earlier.length > 0 ? earlier[earlier.length - 1].value : undefined;
}

// ---------------------------------------------------------------------------
// Medals (§6.10)
// ---------------------------------------------------------------------------

export interface MedalProgress {
  id: GymId;
  name: string;
  condition: string;
  /** 0–1 (1 when earned). */
  progress: number;
  earned: boolean;
  earnedOn?: ISODate;
  /** Spanish explanation of the number. */
  detail: string;
  /** Earned by this evaluation while the stored medal had no `earnedOn` yet (animate it). */
  isNew: boolean;
}

interface Computed {
  progress: number;
  earnedOn?: ISODate;
  detail: string;
}

function withStored(stored: Medal[], id: GymId, computed: Computed): MedalProgress {
  const spec = MEDALS.find((m) => m.id === id)!;
  const prev = stored.find((m) => m.id === id);
  const earnedOn = prev?.earnedOn ?? computed.earnedOn;
  return {
    id,
    name: spec.name,
    condition: spec.condition,
    progress: earnedOn ? 1 : clamp(roundTo(computed.progress, 2), 0, 1),
    earned: !!earnedOn,
    earnedOn,
    detail: computed.detail,
    isNew: !prev?.earnedOn && !!computed.earnedOn,
  };
}

function canteraMedal(weeks: BlockWeekRecords[]): Computed {
  const streak = currentStreak(weeks, lowerWeekVerdict);
  const earnedOn = streakReachedOn(weeks, lowerWeekVerdict, CANTERA_WEEKS);
  return {
    progress: Math.min(CANTERA_WEEKS, streak) / CANTERA_WEEKS,
    earnedOn,
    detail: `${Math.min(CANTERA_WEEKS, streak)}/${CANTERA_WEEKS} semanas seguidas de Lower con aductor después ≤ ${CANTERA_ADDUCTOR_MAX} y sin dolor creciente.`,
  };
}

interface RelMark {
  loadKg: number;
  reps: number;
  bodyweightKg?: number;
  date: ISODate;
  source: 'baseline' | 'test' | 'sesión';
}

/** current/baseline, relative to body weight when both weights are known (SMART 4), else absolute. */
function ratioOf(current: RelMark, baseline: RelMark): number {
  if (current.bodyweightKg && baseline.bodyweightKg) {
    const c = relativeStrength(current.loadKg, current.reps, current.bodyweightKg);
    const b = relativeStrength(baseline.loadKg, baseline.reps, baseline.bodyweightKg);
    return b > 0 ? c / b : 0;
  }
  const b = markScore(baseline);
  return b > 0 ? markScore(current) / b : 0;
}

function describeRel(m: RelMark): string {
  return `${formatKg(m.loadKg)} kg × ${m.reps}${m.bodyweightKg ? ` a ${formatKg(m.bodyweightKg)} kg` : ''}`;
}

function testsAscending(tests: LeagueTest[]): LeagueTest[] {
  return [...tests].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export interface TorsoStatus {
  id: string;
  label: string;
  baseline?: RelMark;
  current?: RelMark;
  ratio?: number;
}

/** Baseline and current relative strength of pull-up and dip (Yunque, SMART 4). */
export function torsoStatus(input: LeagueInput): TorsoStatus[] {
  const points = weightPoints(input.checkins);
  const tests = testsAscending(input.tests);
  return TORSO.map((m) => {
    let baseline: RelMark | undefined;
    const b = input.profile.baselines[m.id];
    if (b) {
      baseline = {
        loadKg: b.loadKg,
        reps: b.reps,
        bodyweightKg: weightAt(points, b.date) ?? input.profile.startWeightKg,
        date: b.date,
        source: 'baseline',
      };
    } else {
      const t = tests.find((x) => x[m.test]);
      if (t) {
        baseline = {
          loadKg: t[m.test]!.loadKg,
          reps: t[m.test]!.reps,
          bodyweightKg: t.weightAvg7 ?? weightAt(points, t.date) ?? input.profile.startWeightKg,
          date: t.date,
          source: 'test',
        };
      }
    }
    let current: RelMark | undefined;
    const later = [...tests].reverse().find((x) => x.weekOfBlock >= 8 && x[m.test]);
    if (later) {
      current = {
        loadKg: later[m.test]!.loadKg,
        reps: later[m.test]!.reps,
        bodyweightKg:
          later.weightAvg7 ?? weightAt(points, later.date) ?? input.profile.startWeightKg,
        date: later.date,
        source: 'test',
      };
    } else {
      const mark = bestMark(input.sessions, m.id, {
        from: baseline ? addDaysISO(baseline.date, 1) : undefined,
        until: input.today,
      });
      if (mark) {
        current = {
          loadKg: mark.loadKg,
          reps: mark.reps,
          bodyweightKg: weightAt(points, mark.date) ?? input.profile.startWeightKg,
          date: mark.date,
          source: 'sesión',
        };
      }
    }
    const ratio = baseline && current ? roundTo(ratioOf(current, baseline), 3) : undefined;
    return { id: m.id, label: m.label, baseline, current, ratio };
  });
}

function yunqueMedal(input: LeagueInput): Computed {
  const status = torsoStatus(input);
  const measured = status.filter((s) => s.ratio !== undefined);
  if (measured.length === 0) {
    return {
      progress: 0,
      detail: 'Sin baseline de dominada ni fondos: anótalo en la ficha o en el Combate de Liga.',
    };
  }
  const worst = Math.min(...measured.map((s) => s.ratio!));
  const fromTest = measured.every((s) => s.current!.source === 'test');
  const weightUp = measured.every(
    (s) =>
      s.current!.bodyweightKg !== undefined &&
      s.baseline!.bodyweightKg !== undefined &&
      s.current!.bodyweightKg > s.baseline!.bodyweightKg,
  );
  const earned = fromTest && worst >= 1 && weightUp;
  const earnedOn = earned
    ? measured.map((s) => s.current!.date).sort()[measured.length - 1]
    : undefined;
  const parts = measured.map(
    (s) =>
      `${s.label} ${describeRel(s.baseline!)} → ${describeRel(s.current!)} (${formatPct((s.ratio! - 1) * 100, 1)}, ${s.current!.source})`,
  );
  const suffix = fromTest
    ? weightUp
      ? ''
      : ' Falta que el peso medio suba respecto al baseline.'
    : ' Se confirma con el Combate de Liga de la semana 8 o 12.';
  return { progress: worst, earnedOn, detail: `${parts.join(' · ')}.${suffix}` };
}

export interface UnilateralStatus {
  baseline?: { score: number; label: string; date: ISODate; source: string };
  current?: { score: number; label: string; date: ISODate; source: string };
  /** current/baseline − 1 (e.g. 0.1 = +10 %). */
  gain?: number;
}

function splitSquatTestBest(t: LeagueTest): { loadKg: number; reps: number } | undefined {
  if (!t.splitSquat || t.splitSquat.length === 0) return undefined;
  return [...t.splitSquat].sort((a, b) => markScore(b) - markScore(a))[0];
}

/** Baseline vs best "carga×reps" of split squat / step-up (Resorte, SMART 3). */
export function unilateralStatus(input: LeagueInput): UnilateralStatus {
  const tests = testsAscending(input.tests);
  const label = (m: { loadKg: number; reps: number }) => `${formatKg(m.loadKg)} kg × ${m.reps}`;
  let baseline: UnilateralStatus['baseline'];
  const b = input.profile.baselines.bulgarian_split_squat;
  if (b) baseline = { score: markScore(b), label: label(b), date: b.date, source: 'ficha' };
  else {
    const t0 = tests.find((t) => t.weekOfBlock === 0 && splitSquatTestBest(t));
    if (t0) {
      const best = splitSquatTestBest(t0)!;
      baseline = { score: markScore(best), label: label(best), date: t0.date, source: 'test' };
    } else {
      // The oldest split-squat session: its best set is the baseline ("primera sesión").
      const first = SPLIT_SQUAT_IDS.flatMap((id) =>
        exerciseHistory(input.sessions, id, Number.MAX_SAFE_INTEGER).slice(-1),
      ).sort((x, y) => (x.date < y.date ? -1 : 1))[0];
      if (first) {
        baseline = {
          score: markScore(first.best),
          label: label(first.best),
          date: first.date,
          source: 'primera sesión',
        };
      }
    }
  }
  const candidates: NonNullable<UnilateralStatus['current']>[] = [];
  for (const t of tests) {
    const best = splitSquatTestBest(t);
    if (best && t.weekOfBlock > 0) {
      candidates.push({ score: markScore(best), label: label(best), date: t.date, source: 'test' });
    }
  }
  for (const id of SPLIT_SQUAT_IDS) {
    const mark = bestMark(input.sessions, id, { until: input.today });
    if (mark) {
      candidates.push({
        score: markScore(mark),
        label: label(mark),
        date: mark.date,
        source: 'sesión',
      });
    }
  }
  const current = candidates.sort((x, y) => y.score - x.score)[0];
  const gain =
    baseline && current && baseline.score > 0
      ? roundTo(current.score / baseline.score - 1, 4)
      : undefined;
  return { baseline, current, gain };
}

function resorteMedal(input: LeagueInput): Computed {
  const u = unilateralStatus(input);
  if (u.gain === undefined) {
    return {
      progress: 0,
      detail: 'Sin baseline de split squat: anótalo en la ficha o en un test.',
    };
  }
  const progress = u.gain / RESORTE_GAIN;
  return {
    progress,
    earnedOn: progress >= 1 ? u.current!.date : undefined,
    detail: `${u.baseline!.label} (${u.baseline!.source}) → ${u.current!.label} (${u.current!.source}): ${formatPct(u.gain * 100, 1)} sobre +15 %.`,
  };
}

export interface HandstandStatus {
  latest?: LeagueTest;
  previous?: LeagueTest;
  improved: boolean;
  /** Mobility ranges improved between the two tests (ankle, wrist extension, hip, shoulder). */
  rangesImproved: string[];
  bestWallSec?: number;
}

function noteImproved(note: string | undefined): boolean {
  return !!note && note.trim().toLowerCase().startsWith('mejor');
}

/** Handstand marker and mobility ranges of the latest test vs the previous one (SMART 8, CONTROL). */
export function handstandStatus(tests: LeagueTest[]): HandstandStatus {
  const withData = testsAscending(tests).filter((t) => t.handstand || t.mobility);
  const latest = withData[withData.length - 1];
  const previous = withData[withData.length - 2];
  const wall = tests.map((t) => t.handstand?.wallSec ?? 0);
  const bestWallSec = wall.length > 0 && Math.max(...wall) > 0 ? Math.max(...wall) : undefined;
  if (!latest || !previous)
    return { latest, previous, improved: false, rangesImproved: [], bestWallSec };
  const improved =
    (latest.handstand?.wallSec ?? 0) > (previous.handstand?.wallSec ?? 0) ||
    (latest.handstand?.freeSec ?? 0) > (previous.handstand?.freeSec ?? 0);
  const rangesImproved: string[] = [];
  const lm = latest.mobility;
  const pm = previous.mobility;
  if (lm && pm) {
    if (lm.ankleCm !== undefined && pm.ankleCm !== undefined && lm.ankleCm > pm.ankleCm) {
      rangesImproved.push('tobillo');
    }
    if (
      lm.wristExtDeg !== undefined &&
      pm.wristExtDeg !== undefined &&
      lm.wristExtDeg > pm.wristExtDeg
    ) {
      rangesImproved.push('muñeca');
    }
    if (noteImproved(lm.hipNote)) rangesImproved.push('cadera');
    if (noteImproved(lm.shoulderNote)) rangesImproved.push('hombro');
  }
  return { latest, previous, improved, rangesImproved, bestWallSec };
}

function vertigoMedal(input: LeagueInput, completed: BlockWeekRecords[]): Computed {
  const streak = Math.min(VERTIGO_WEEKS, currentStreak(completed, wristWeekVerdict));
  const hs = handstandStatus(input.tests);
  const half = streak / VERTIGO_WEEKS / 2 + (hs.improved ? 0.5 : 0);
  let earnedOn: ISODate | undefined;
  if (streak >= VERTIGO_WEEKS && hs.improved) {
    const reached = streakReachedOn(completed, wristWeekVerdict, VERTIGO_WEEKS)!;
    earnedOn = reached > hs.latest!.date ? reached : hs.latest!.date;
  }
  return {
    progress: half,
    earnedOn,
    detail: `${streak}/${VERTIGO_WEEKS} semanas sin síntomas crecientes de muñeca · handstand ${hs.improved ? 'mejorado' : 'sin mejora medida'} (${hs.latest && hs.previous ? 'último test vs anterior' : 'faltan 2 tests'}).`,
  };
}

/** Progress of the four medals (§6.10); earned medals are kept from the stored rows. */
export function medalProgress(
  input: LeagueInput,
  weeks = blockWeekRecords(input),
): MedalProgress[] {
  const completed = weeks.filter((w) => w.completed);
  return [
    withStored(input.medals, 'cantera', canteraMedal(completed)),
    withStored(input.medals, 'yunque', yunqueMedal(input)),
    withStored(input.medals, 'resorte', resorteMedal(input)),
    withStored(input.medals, 'vertigo', vertigoMedal(input, completed)),
  ];
}

/** Rows to store after an evaluation (progress plus any newly earned date). */
export function toMedalRows(progress: MedalProgress[]): Medal[] {
  return progress.map((m) => ({ id: m.id, progress: m.progress, earnedOn: m.earnedOn }));
}

// ---------------------------------------------------------------------------
// Trainer level (§6.10)
// ---------------------------------------------------------------------------

export interface WeekAnchors {
  weekOfBlock: number;
  done: number;
  lower: number;
  upper: number;
  z2: number;
  mobility: number;
  z2Minutes: number;
}

/** A sessions done in a week: min(2, Lower) + min(2, Upper) + min(1, Z2) + min(1, movilidad). */
export function weekAnchors(week: BlockWeekRecords): WeekAnchors {
  const lower = week.sessions.filter((s) => LOWER_GYMS.includes(s.gymId)).length;
  const upper = week.sessions.filter((s) => UPPER_GYMS.includes(s.gymId)).length;
  const z2Routes = week.routes.filter((r) => r.countsAs === 'z2');
  const mobility = week.regen.filter((g) => g.kind === 'yoga' || g.kind === 'movilidad').length;
  return {
    weekOfBlock: week.weekOfBlock,
    done:
      Math.min(2, lower) +
      Math.min(2, upper) +
      Math.min(1, z2Routes.length) +
      Math.min(1, mobility),
    lower,
    upper,
    z2: z2Routes.length,
    mobility,
    z2Minutes: z2Routes.reduce((sum, r) => sum + r.minutes, 0),
  };
}

export interface TrainerLevelResult {
  percent: number | null;
  level: TrainerLevel | null;
  weeks: WeekAnchors[];
  excluded: number;
  detail: string;
}

/** "% de sesiones A completadas en las últimas 4 semanas" (completed weeks; viaje weeks excluded). */
export function trainerLevel(weeks: BlockWeekRecords[]): TrainerLevelResult {
  const completed = weeks.filter((w) => w.completed);
  const counted = completed.filter((w) => w.template !== 'viaje').slice(-LEVEL_WEEKS);
  const excluded = completed.slice(-LEVEL_WEEKS).filter((w) => w.template === 'viaje').length;
  if (counted.length === 0) {
    return {
      percent: null,
      level: null,
      weeks: [],
      excluded,
      detail: 'Se calcula al cerrar la primera semana del bloque.',
    };
  }
  const anchors = counted.map(weekAnchors);
  const done = anchors.reduce((sum, a) => sum + a.done, 0);
  const planned = anchors.length * ANCHORS_PER_WEEK;
  const percent = Math.round((done / planned) * 100);
  return {
    percent,
    level: trainerLevelFor(percent),
    weeks: anchors,
    excluded,
    detail: `${done}/${planned} sesiones A en ${anchors.length} semana${anchors.length === 1 ? '' : 's'}${excluded > 0 ? ` (${excluded} de viaje no cuentan)` : ''}. ${TRAINER_LEVEL_NOTE}`,
  };
}

// ---------------------------------------------------------------------------
// Stats 0–100 (§6.2)
// ---------------------------------------------------------------------------

export interface StatValue {
  key: StatKey;
  name: string;
  value: number | null;
  detail: string;
}

export interface StrengthGain {
  id: string;
  baseline: { loadKg: number; reps: number };
  best?: ExerciseMark;
  /** % improvement of carga×reps at RIR ≤ 2 vs baseline. */
  gainPct?: number;
}

/** Improvement of bench press, weighted pull-up, trap bar and split squat vs their baselines. */
export function strengthGains(input: LeagueInput): StrengthGain[] {
  return STRENGTH_STAT_IDS.flatMap((id) => {
    const baseline = input.profile.baselines[id];
    if (!baseline || baseline.reps <= 0) return [];
    const best = bestMark(input.sessions, id, { until: input.today });
    const gainPct = best
      ? roundTo((markScore(best) / markScore(baseline) - 1) * 100, 1)
      : undefined;
    return [{ id, baseline: { loadKg: baseline.loadKg, reps: baseline.reps }, best, gainPct }];
  });
}

function z2MinutesInWindow(routes: RouteLog[], from: ISODate, to: ISODate): number {
  return routes
    .filter((r) => r.countsAs === 'z2' && r.date >= from && r.date <= to)
    .reduce((sum, r) => sum + r.minutes, 0);
}

/** Distinct block weeks with a Zona Salvaje log inside the last 28 days. */
function wildWindows(wild: WildLog[], today: ISODate): number {
  const from = addDaysISO(today, -27);
  const weeks = new Set(
    wild
      .filter((w) => w.date >= from && w.date <= today)
      .map((w) => addDaysISO(w.date, -daysBetween(from, w.date) % 7)),
  );
  return weeks.size;
}

function transferScore(note: string | undefined): number | undefined {
  const t = note?.trim().toLowerCase() ?? '';
  if (t.startsWith('mejor')) return 1;
  if (t.startsWith('igual')) return 0.5;
  if (t.startsWith('peor')) return 0;
  return undefined;
}

/** The five 0–100 numbers of the trainer card; null ("—") until there is data. */
export function statValues(input: LeagueInput): StatValue[] {
  const { profile, today } = input;
  const points = weightPoints(input.checkins);
  const name = (key: StatKey) => STATS.find((s) => s.key === key)!.name;

  // MASA
  let masa: StatValue;
  const avg7 = weightAt(points, today);
  const start = profile.startWeightKg;
  if (avg7 === undefined || start === undefined) {
    masa = {
      key: 'masa',
      name: name('masa'),
      value: null,
      detail: 'Faltan el peso inicial o pesos recientes.',
    };
  } else {
    const span = MASA_TARGET_KG - start;
    let value = span > 0 ? clamp(((avg7 - start) / span) * 100, 0, 100) : 100;
    const trend = weeklyTrend(points, today).trendPct;
    const penalised = trend !== undefined && trend > MASA_TREND_LIMIT;
    if (penalised) value = Math.max(0, value - MASA_TREND_PENALTY);
    masa = {
      key: 'masa',
      name: name('masa'),
      value: Math.round(value),
      detail: `Media 7 d ${formatKg(avg7)} kg desde ${formatKg(start)} hacia ${MASA_TARGET_KG} kg${penalised ? ` · −${MASA_TREND_PENALTY} por tendencia ${formatPct(trend)}/sem > ${formatPct(MASA_TREND_LIMIT)}` : ''}.`,
    };
  }

  // FUERZA
  const gains = strengthGains(input).filter((g) => g.gainPct !== undefined);
  const fuerza: StatValue =
    gains.length === 0
      ? {
          key: 'fuerza',
          name: name('fuerza'),
          value: null,
          detail: 'Faltan baselines o marcas a RIR ≤ 2.',
        }
      : {
          key: 'fuerza',
          name: name('fuerza'),
          value: Math.round(clamp(mean(gains.map((g) => g.gainPct!))!, 0, 100)),
          detail: `Media de mejora carga×reps: ${gains.map((g) => `${g.id.replace(/_/g, ' ')} ${formatPct(g.gainPct!, 1)}`).join(' · ')}.`,
        };

  // MOTOR
  const z2Week = z2MinutesInWindow(input.routes, addDaysISO(today, -6), today);
  const recentRoutes = input.routes.filter(
    (r) => daysBetween(r.date, today) < 28 && r.date <= today,
  );
  const longest = recentRoutes.reduce((m, r) => Math.max(m, r.minutes), 0);
  const motor: StatValue =
    recentRoutes.length === 0
      ? {
          key: 'motor',
          name: name('motor'),
          value: null,
          detail: 'Sin rutas en los últimos 28 días.',
        }
      : {
          key: 'motor',
          name: name('motor'),
          value: Math.round(
            (Math.min(1, z2Week / 150) * 0.5 + Math.min(1, longest / 60) * 0.5) * 100,
          ),
          detail: `Z2 ${z2Week}'/150' en 7 días · ruta más larga ${longest}'/60' en 28 días.`,
        };

  // CONTROL
  const hs = handstandStatus(input.tests);
  const control: StatValue =
    hs.bestWallSec === undefined && hs.rangesImproved.length === 0
      ? {
          key: 'control',
          name: name('control'),
          value: null,
          detail: 'Sin test de handstand todavía.',
        }
      : {
          key: 'control',
          name: name('control'),
          value: Math.round(
            (Math.min(1, (hs.bestWallSec ?? 0) / 60) * 0.5 +
              Math.min(1, hs.rangesImproved.length / 4) * 0.5) *
              100,
          ),
          detail: `Handstand en pared ${hs.bestWallSec ?? 0} s/60 s · rangos mejorados ${hs.rangesImproved.length}/4${hs.rangesImproved.length > 0 ? ` (${hs.rangesImproved.join(', ')})` : ''}.`,
        };

  // AVENTURA
  const windows = wildWindows(input.wild, today);
  const latestTest = testsAscending(input.tests)
    .reverse()
    .find((t) => t.transferNote);
  const transfer = transferScore(latestTest?.transferNote);
  const parts: number[] = [];
  if (input.wild.length > 0) parts.push(Math.min(1, windows / 4));
  if (transfer !== undefined) parts.push(transfer);
  const aventura: StatValue =
    parts.length === 0
      ? {
          key: 'aventura',
          name: name('aventura'),
          value: null,
          detail: 'Sin Zona Salvaje registrada.',
        }
      : {
          key: 'aventura',
          name: name('aventura'),
          value: Math.round(mean(parts)! * 100),
          detail: `${windows}/4 ventanas de Zona Salvaje en 4 semanas${transfer !== undefined ? ` · transferencia «${latestTest!.transferNote}»` : ' · sin nota de transferencia'}.`,
        };

  return [masa, fuerza, motor, control, aventura];
}

// ---------------------------------------------------------------------------
// SMART objectives (§6.2)
// ---------------------------------------------------------------------------

export type SmartStatus = 'done' | 'progress' | 'pending' | 'manual';

export interface SmartProgress {
  id: number;
  title: string;
  target: string;
  /** 0–1, null when it cannot be computed yet. */
  progress: number | null;
  status: SmartStatus;
  detail: string;
  manual?: SmartManual;
}

function z2TargetMin(wave: Wave): number {
  return wave === 'deload' ? deloadRouteMinutes(Z2_WEEKLY_RANGE)[0] : Z2_WEEKLY_RANGE[0];
}

/** Weeks (of the last 4 completed) whose Z2 minutes reach the wave's minimum (SMART 5). */
export function aerobicWeeks(weeks: BlockWeekRecords[]): { ok: number; rows: string[] } {
  const recent = weeks.filter((w) => w.completed).slice(-LEVEL_WEEKS);
  const rows: string[] = [];
  let ok = 0;
  for (const w of recent) {
    const minutes = weekAnchors(w).z2Minutes;
    const target = z2TargetMin(w.wave);
    if (minutes >= target) ok++;
    rows.push(`S${w.weekOfBlock} ${minutes}'/${target}'`);
  }
  return { ok, rows };
}

function longestEasyRun(
  routes: RouteLog[],
  checkins: Checkin[],
): { minutes: number; qualifies: boolean } {
  let minutes = 0;
  let qualifies = false;
  for (const r of routes) {
    if (r.kind !== 'run' || r.rpe > 6) continue;
    minutes = Math.max(minutes, r.minutes);
    if (r.minutes < 45) continue;
    const next = checkins.find((c) => c.date === addDaysISO(r.date, 1));
    if (!next || Math.max(next.wrist, next.adductor) <= 2) qualifies = true;
  }
  return { minutes, qualifies };
}

function sustainedSleepDrop(checkins: Checkin[]): boolean {
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? -1 : 1));
  let run = 0;
  for (const c of sorted) {
    run = c.sleepHours < 7 ? run + 1 : 0;
    if (run > 7) return true;
  }
  return false;
}

export function smartProgress(
  input: LeagueInput,
  weeks = blockWeekRecords(input),
  medals = medalProgress(input, weeks),
): SmartProgress[] {
  const { profile, today } = input;
  const completed = weeks.filter((w) => w.completed);
  const points = weightPoints(input.checkins);
  const out: Omit<SmartProgress, 'title' | 'target' | 'manual'>[] = [];

  // 1 · Baseline completo
  {
    const twoWeeksEnd = addDaysISO(profile.blockStart, 13);
    const weighIns = points.filter(
      (p) => p.date >= profile.blockStart && p.date <= twoWeeksEnd,
    ).length;
    const baselines = Object.values(profile.baselines).filter((b) => b && b.reps > 0).length;
    const mobility = input.tests.some((t) => t.mobility);
    const score = (weighIns >= 5 ? 1 : 0) + Math.min(1, baselines / 3) + (mobility ? 1 : 0);
    out.push({
      id: 1,
      progress: score / 3,
      status: score >= 3 ? 'done' : score > 0 ? 'progress' : 'pending',
      detail: `Pesos en semanas 1–2: ${weighIns} (mín. 5) · baselines de fuerza: ${baselines}/3 · test de movilidad: ${mobility ? 'sí' : 'no'}.`,
    });
  }

  // 2 · Piernas entrenables = medalla Cantera
  const cantera = medals.find((m) => m.id === 'cantera')!;
  out.push({
    id: 2,
    progress: cantera.progress,
    status: cantera.earned ? 'done' : cantera.progress > 0 ? 'progress' : 'pending',
    detail: cantera.detail,
  });

  // 3 · Fuerza unilateral
  const u = unilateralStatus(input);
  out.push({
    id: 3,
    progress: u.gain === undefined ? null : clamp(u.gain / RESORTE_GAIN, 0, 1),
    status: u.gain === undefined ? 'pending' : u.gain >= RESORTE_GAIN ? 'done' : 'progress',
    detail:
      u.gain === undefined
        ? 'Sin baseline de split squat.'
        : `${u.baseline!.label} → ${u.current!.label}: ${formatPct(u.gain * 100, 1)} (meta +15–25 %).`,
  });

  // 4 · Mantener torso
  const torso = torsoStatus(input).filter((s) => s.ratio !== undefined);
  out.push({
    id: 4,
    progress: torso.length === 0 ? null : clamp(Math.min(...torso.map((s) => s.ratio!)), 0, 1),
    status:
      torso.length === 0 ? 'pending' : torso.every((s) => s.ratio! >= 1) ? 'done' : 'progress',
    detail:
      torso.length === 0
        ? 'Sin baseline de dominada ni fondos.'
        : torso
            .map((s) => `${s.label} ${formatPct((s.ratio! - 1) * 100, 1)} (${s.current!.source})`)
            .join(' · ') + '.',
  });

  // 5 · Base aeróbica
  const aero = aerobicWeeks(weeks);
  out.push({
    id: 5,
    progress: aero.ok / LEVEL_WEEKS,
    status: aero.ok >= LEVEL_WEEKS ? 'done' : aero.rows.length > 0 ? 'progress' : 'pending',
    detail:
      aero.rows.length === 0
        ? 'Se evalúa al cerrar la primera semana.'
        : `${aero.ok}/${LEVEL_WEEKS} de las últimas semanas con Z2 ≥ mínimo: ${aero.rows.join(' · ')}.`,
  });

  // 6 · Carrera progresiva
  const run = longestEasyRun(input.routes, input.checkins);
  out.push({
    id: 6,
    progress: run.qualifies ? 1 : Math.min(1, run.minutes / 45),
    status: run.qualifies ? 'done' : run.minutes > 0 ? 'progress' : 'pending',
    detail: run.qualifies
      ? 'Carrera fácil continua ≥ 45 min con RPE ≤ 6 y sin dolor al día siguiente.'
      : `Carrera fácil más larga: ${run.minutes}' (meta 45–60' a RPE ≤ 6).`,
  });

  // 7 · Muñecas
  const wristStreak = Math.min(VERTIGO_WEEKS, currentStreak(completed, wristWeekVerdict));
  const symptoms = evaluateSymptoms({ checkins: input.checkins, sessions: input.sessions, today });
  out.push({
    id: 7,
    progress: wristStreak / VERTIGO_WEEKS,
    status:
      wristStreak >= VERTIGO_WEEKS && symptoms.wrist.advisories.length === 0
        ? 'done'
        : wristStreak > 0
          ? 'progress'
          : 'pending',
    detail: `${wristStreak}/${VERTIGO_WEEKS} semanas sin síntomas crecientes de muñeca${symptoms.wrist.advisories.length > 0 ? ' · aviso activo hoy' : ''}.`,
  });

  // 8 · Handstand / movilidad
  const hs = handstandStatus(input.tests);
  const ranges = Math.min(2, hs.rangesImproved.length);
  out.push({
    id: 8,
    progress: (hs.improved ? 0.5 : 0) + (ranges / 2) * 0.5,
    status: hs.improved && ranges >= 2 ? 'done' : hs.latest && hs.previous ? 'progress' : 'pending',
    detail:
      hs.latest && hs.previous
        ? `Handstand ${hs.improved ? 'mejorado' : 'sin mejora'} · rangos mejorados ${hs.rangesImproved.length}/2${hs.rangesImproved.length > 0 ? ` (${hs.rangesImproved.join(', ')})` : ''}.`
        : 'Hacen falta dos Combates de Liga para comparar.',
  });

  // 9 · Composición
  {
    const construction = completed.filter((w) => w.weekOfBlock >= 3);
    const trends = construction
      .map((w) => ({ week: w.weekOfBlock, t: weeklyTrend(points, w.end).trendPct }))
      .filter((x): x is { week: number; t: number } => x.t !== undefined);
    const inBand = trends.filter((x) => x.t >= COMPOSITION_BAND[0] && x.t <= COMPOSITION_BAND[1]);
    const latest = trends[trends.length - 1];
    out.push({
      id: 9,
      progress: trends.length === 0 ? null : inBand.length / trends.length,
      status:
        trends.length === 0
          ? 'pending'
          : trends.length >= 2 && latest.t >= COMPOSITION_BAND[0] && latest.t <= COMPOSITION_BAND[1]
            ? 'done'
            : 'progress',
      detail:
        trends.length === 0
          ? 'Se evalúa desde la semana 3 con pesos diarios.'
          : `${inBand.length}/${trends.length} semanas de construcción en +0,15–0,30 %/sem · última ${formatPct(latest.t)}/sem.`,
    });
  }

  // 10 · Recuperación
  {
    const recent = input.checkins.filter((c) => c.date <= today && daysBetween(c.date, today) < 28);
    const sleep = mean(recent.map((c) => c.sleepHours));
    const drop = sustainedSleepDrop(recent);
    out.push({
      id: 10,
      progress: sleep === undefined ? null : Math.min(1, sleep / 8) * (drop ? 0.5 : 1),
      status:
        sleep === undefined
          ? 'pending'
          : sleep >= 7.5 && !drop && recent.length >= 14
            ? 'done'
            : 'progress',
      detail:
        sleep === undefined
          ? 'Sin check-ins en 28 días.'
          : `Sueño medio ${roundTo(sleep, 1).toString().replace('.', ',')} h en ${recent.length} check-ins${drop ? ' · caída sostenida > 7 días' : ''}.`,
    });
  }

  return out.map((row) => {
    const spec = SMART_OBJECTIVES.find((o) => o.id === row.id)!;
    const manual = profile.smartManual?.[String(row.id)];
    return {
      ...row,
      title: spec.title,
      target: spec.target,
      manual,
      status: manual ? 'manual' : row.status,
      progress: manual?.done ? 1 : row.progress,
    };
  });
}

// ---------------------------------------------------------------------------
// Evolution Forma I → II (§6.3)
// ---------------------------------------------------------------------------

export interface EvolutionCondition {
  id: 'legs' | 'wrists' | 'aerobic' | 'nutrition';
  text: string;
  met: boolean;
  detail: string;
}

export interface EvolutionCheck {
  from: Form;
  to: Form | null;
  /** Only Forma I → II has automatic conditions; later forms say "consulta al entrenador". */
  automatic: boolean;
  conditions: EvolutionCondition[];
  ready: boolean;
  note: string;
}

export function evolutionCheck(
  input: LeagueInput,
  weeks = blockWeekRecords(input),
  medals = medalProgress(input, weeks),
): EvolutionCheck {
  const from = input.profile.form;
  const to: Form | null = from < 4 ? ((from + 1) as Form) : null;
  if (from !== 1) {
    return {
      from,
      to,
      automatic: false,
      conditions: [],
      ready: false,
      note:
        to === null
          ? 'Forma IV: alternar bloques sin reconstruir desde cero.'
          : `Las condiciones de la ${FORMS[from].fullName} se valoran con El Rival: consulta al entrenador.`,
    };
  }
  const completed = weeks.filter((w) => w.completed);
  const cantera = medals.find((m) => m.id === 'cantera')!;
  const wristStreak = currentStreak(completed, wristWeekVerdict);
  const symptoms = evaluateSymptoms({
    checkins: input.checkins,
    sessions: input.sessions,
    today: input.today,
  });
  const aero = aerobicWeeks(weeks);
  const points = weightPoints(input.checkins);
  const weighIns = points.filter(
    (p) => p.date <= input.today && daysBetween(p.date, input.today) < 14,
  ).length;
  const intake =
    input.profile.kcalTarget !== undefined ||
    input.profile.kcalBaseline !== undefined ||
    input.adjustments.some((a) => a.kind === 'kcal');
  const conditions: EvolutionCondition[] = [
    {
      id: 'legs',
      text: 'Piernas entrenables sin calambres recurrentes',
      met: cantera.earned,
      detail: cantera.earned ? 'Medalla CANTERA conseguida.' : cantera.detail,
    },
    {
      id: 'wrists',
      text: 'Muñecas toleran apoyos',
      met: wristStreak >= CANTERA_WEEKS && symptoms.wrist.advisories.length === 0,
      detail: `${Math.min(VERTIGO_WEEKS, wristStreak)} semanas seguidas sin síntomas crecientes (mín. ${CANTERA_WEEKS})${symptoms.wrist.advisories.length > 0 ? ' · aviso de muñeca activo' : ''}.`,
    },
    {
      id: 'aerobic',
      text: '90–150 min/sem aeróbico fácil',
      met: aero.ok >= LEVEL_WEEKS,
      detail: `${aero.ok}/${LEVEL_WEEKS} de las últimas semanas con Z2 ≥ mínimo.`,
    },
    {
      id: 'nutrition',
      text: 'Peso e ingesta monitorizados',
      met: weighIns >= 10 && intake,
      detail: `${weighIns} pesos en 14 días (mín. 10) · ingesta ${intake ? 'registrada' : 'sin ajuste ni objetivo kcal'}.`,
    },
  ];
  return {
    from,
    to,
    automatic: true,
    conditions,
    ready: conditions.every((c) => c.met),
    note: 'La evolución se propone cuando se cumplen las condiciones, nunca solo por fecha.',
  };
}

// ---------------------------------------------------------------------------
// League tests: next test week and comparison (§6.10, §8.5)
// ---------------------------------------------------------------------------

/** The test week for `weekOfBlock`: 0 during weeks ≤ 2 without a baseline test, 4/8/12 on those weeks, else null. */
export function testWeekFor(weekOfBlock: number, tests: LeagueTest[]): 0 | 4 | 8 | 12 | null {
  if (TEST_WEEKS.includes(weekOfBlock)) return weekOfBlock as 4 | 8 | 12;
  if (weekOfBlock >= 1 && weekOfBlock <= 2 && !tests.some((t) => t.weekOfBlock === 0)) return 0;
  return null;
}

export function nextTestWeek(weekOfBlock: number): number | null {
  return TEST_WEEKS.find((w) => w >= weekOfBlock) ?? null;
}

export interface TestDeltaRow {
  area: string;
  label: string;
  current: string;
  previous: string;
  delta: string;
  /** true = better, false = worse, undefined = equal or not comparable. */
  better?: boolean;
}

function fmtNum(v: number | undefined, unit: string): string {
  return v === undefined ? '—' : `${formatKg(v)}${unit}`;
}

function numericRow(
  area: string,
  label: string,
  cur: number | undefined,
  prev: number | undefined,
  unit: string,
  higherIsBetter = true,
): TestDeltaRow {
  const row: TestDeltaRow = {
    area,
    label,
    current: fmtNum(cur, unit),
    previous: fmtNum(prev, unit),
    delta: '—',
  };
  if (cur !== undefined && prev !== undefined) {
    const d = roundTo(cur - prev, 1);
    row.delta = d === 0 ? '=' : `${d > 0 ? '+' : '−'}${formatKg(Math.abs(d))}${unit}`;
    if (d !== 0) row.better = higherIsBetter ? d > 0 : d < 0;
  }
  return row;
}

function textRow(area: string, label: string, cur?: string, prev?: string): TestDeltaRow {
  return { area, label, current: cur ?? '—', previous: prev ?? '—', delta: '—' };
}

/** Field-by-field comparison of a test with the previous one (deltas; "—" when missing). */
export function compareTests(current: LeagueTest, previous?: LeagueTest): TestDeltaRow[] {
  const bestSide = (t?: LeagueTest, side?: 'L' | 'R') => {
    const entries = t?.splitSquat?.filter((s) => s.side === side) ?? [];
    return entries.length > 0 ? Math.max(...entries.map(markScore)) : undefined;
  };
  return [
    numericRow('Composición', 'Peso medio 7 d', current.weightAvg7, previous?.weightAvg7, ' kg'),
    numericRow('Composición', 'Cintura', current.waistCm, previous?.waistCm, ' cm', false),
    numericRow(
      'Torso',
      'Dominada RIR 2 (carga×reps)',
      current.pullupRir2 ? markScore(current.pullupRir2) : undefined,
      previous?.pullupRir2 ? markScore(previous.pullupRir2) : undefined,
      '',
    ),
    numericRow(
      'Torso',
      'Fondo RIR 2 (carga×reps)',
      current.dipRir2 ? markScore(current.dipRir2) : undefined,
      previous?.dipRir2 ? markScore(previous.dipRir2) : undefined,
      '',
    ),
    numericRow(
      'Piernas',
      'Split squat L (carga×reps)',
      bestSide(current, 'L'),
      bestSide(previous, 'L'),
      '',
    ),
    numericRow(
      'Piernas',
      'Split squat R (carga×reps)',
      bestSide(current, 'R'),
      bestSide(previous, 'R'),
      '',
    ),
    textRow('Piernas', 'Patrón bilateral', current.bilateralNote, previous?.bilateralNote),
    numericRow(
      'Motor',
      'Ruta estándar minutos',
      current.z2Standard?.minutes,
      previous?.z2Standard?.minutes,
      "'",
    ),
    numericRow(
      'Motor',
      'Ruta estándar RPE',
      current.z2Standard?.rpe,
      previous?.z2Standard?.rpe,
      '',
      false,
    ),
    numericRow(
      'Motor',
      'FC media',
      current.z2Standard?.hrAvg,
      previous?.z2Standard?.hrAvg,
      ' ppm',
      false,
    ),
    numericRow(
      'Control',
      'Handstand pared',
      current.handstand?.wallSec,
      previous?.handstand?.wallSec,
      ' s',
    ),
    numericRow(
      'Control',
      'Handstand libre',
      current.handstand?.freeSec,
      previous?.handstand?.freeSec,
      ' s',
    ),
    numericRow(
      'Control',
      'Tobillo knee-to-wall',
      current.mobility?.ankleCm,
      previous?.mobility?.ankleCm,
      ' cm',
    ),
    numericRow(
      'Control',
      'Extensión de muñeca',
      current.mobility?.wristExtDeg,
      previous?.mobility?.wristExtDeg,
      '°',
    ),
    textRow('Control', 'Cadera', current.mobility?.hipNote, previous?.mobility?.hipNote),
    textRow('Control', 'Hombro', current.mobility?.shoulderNote, previous?.mobility?.shoulderNote),
    textRow(
      'Transferencia',
      'MTB, escalada, surf/skate',
      current.transferNote,
      previous?.transferNote,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Summary + 12-week report (§10)
// ---------------------------------------------------------------------------

export interface LeagueSummary {
  weekOfBlock: number;
  weeks: BlockWeekRecords[];
  medals: MedalProgress[];
  smart: SmartProgress[];
  level: TrainerLevelResult;
  stats: StatValue[];
  evolution: EvolutionCheck;
}

/** Everything the LIGA tab shows, computed once. */
export function evaluateLeague(input: LeagueInput): LeagueSummary {
  const weeks = blockWeekRecords(input);
  const medals = medalProgress(input, weeks);
  return {
    weekOfBlock: weeks.length,
    weeks,
    medals,
    smart: smartProgress(input, weeks, medals),
    level: trainerLevel(weeks),
    stats: statValues(input),
    evolution: evolutionCheck(input, weeks, medals),
  };
}

const STATUS_ES: Record<SmartStatus, string> = {
  done: 'conseguido',
  progress: 'en progreso',
  pending: 'pendiente',
  manual: 'manual',
};

function pct(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)} %`;
}

/** The 12-week report in Markdown (§10): block state, medals, SMART, tests, weight, marks, symptoms. */
export function blockReport(input: LeagueInput, summary = evaluateLeague(input)): string {
  const { profile, today } = input;
  const points = weightPoints(input.checkins);
  const lines: string[] = [];
  const done = summary.weekOfBlock >= BLOCK_WEEKS && summary.weeks[BLOCK_WEEKS - 1]?.completed;
  const title = done ? 'Final de Liga' : `Semana ${summary.weekOfBlock}/${BLOCK_WEEKS}`;
  lines.push(`# Liga Híbrida · Informe del Bloque 1 — ${title}`);
  lines.push('');
  lines.push(
    `${formatShort(profile.blockStart)} – ${formatShort(today)} · Entrenador: ${profile.name} · ${FORMS[profile.form].fullName} · Nivel: ${summary.level.level?.name ?? 'sin datos'}${summary.level.percent !== null ? ` (${summary.level.percent} %)` : ''}`,
  );
  lines.push('');
  lines.push('> Actúa como El Rival según los documentos Performance Trainee.');
  lines.push('');

  lines.push('## Ficha (0–100)');
  lines.push('');
  lines.push('| Stat | Valor | Detalle |');
  lines.push('|---|---|---|');
  for (const s of summary.stats) lines.push(`| ${s.name} | ${s.value ?? '—'} | ${s.detail} |`);
  lines.push('');

  lines.push('## Medallas');
  lines.push('');
  lines.push('| Medalla | Progreso | Estado | Detalle |');
  lines.push('|---|---|---|---|');
  for (const m of summary.medals) {
    lines.push(
      `| ${m.name} | ${pct(m.progress)} | ${m.earned ? `conseguida el ${formatShort(m.earnedOn!)}` : 'en progreso'} | ${m.detail} |`,
    );
  }
  lines.push('');

  lines.push('## Objetivos SMART');
  lines.push('');
  lines.push('| # | Objetivo | Progreso | Estado | Detalle |');
  lines.push('|---|---|---|---|---|');
  for (const o of summary.smart) {
    lines.push(
      `| ${o.id} | ${o.title} | ${pct(o.progress)} | ${STATUS_ES[o.status]} | ${o.detail} |`,
    );
  }
  lines.push('');

  lines.push('## Combates de Liga');
  lines.push('');
  const tests = testsAscending(input.tests);
  if (tests.length === 0) lines.push('Sin tests registrados.');
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    lines.push(
      `### ${t.weekOfBlock === 0 ? 'Baseline' : `Semana ${t.weekOfBlock}`} · ${formatShort(t.date)}`,
    );
    lines.push('');
    lines.push('| Área | Marcador | Actual | Anterior | Δ |');
    lines.push('|---|---|---|---|---|');
    for (const row of compareTests(t, tests[i - 1])) {
      if (row.current === '—' && row.previous === '—') continue;
      lines.push(
        `| ${row.area} | ${row.label} | ${row.current} | ${row.previous} | ${row.delta} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Peso');
  lines.push('');
  const avg7 = weightAt(points, today);
  const trend = weeklyTrend(points, today);
  lines.push(
    `Inicio ${profile.startWeightKg !== undefined ? `${formatKg(profile.startWeightKg)} kg` : '—'} · media 7 d ${avg7 !== undefined ? `${formatKg(avg7)} kg` : '—'} · tendencia ${trend.trendPct === undefined ? 'sin datos' : `${formatPct(trend.trendPct)}/sem`} · objetivo ${profile.targetWeightKg[0]}–${profile.targetWeightKg[1]} kg.`,
  );
  const kcal = input.adjustments.filter((a) => a.kind === 'kcal');
  if (kcal.length > 0) {
    lines.push('');
    for (const a of [...kcal].sort((x, y) => (x.date < y.date ? -1 : 1))) {
      lines.push(`- ${formatShort(a.date)}: ${a.detail}`);
    }
  }
  lines.push('');

  lines.push('## Fuerza · mejores marcas a RIR ≤ 2');
  lines.push('');
  const gains = strengthGains(input);
  if (gains.length === 0) lines.push('Sin baselines de fuerza en la ficha.');
  else {
    lines.push('| Ejercicio | Baseline | Mejor marca | Δ carga×reps |');
    lines.push('|---|---|---|---|');
    for (const g of gains) {
      lines.push(
        `| ${g.id.replace(/_/g, ' ')} | ${formatKg(g.baseline.loadKg)} kg × ${g.baseline.reps} | ${g.best ? `${formatKg(g.best.loadKg)} kg × ${g.best.reps} (${formatShort(g.best.date)})` : '—'} | ${g.gainPct === undefined ? '—' : formatPct(g.gainPct, 1)} |`,
      );
    }
  }
  lines.push('');

  lines.push('## Semanas');
  lines.push('');
  lines.push('| Semana | Ola | Lower | Upper | Z2 | Movilidad | Aventuras | Sueño | Peso |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const w of summary.weeks) {
    const a = weekAnchors(w);
    const sleep = mean(w.checkins.map((c) => c.sleepHours));
    const wTrend = weeklyTrend(points, w.end).trendPct;
    lines.push(
      `| S${w.weekOfBlock}${w.template && w.template !== 'estandar' ? ` (${WEEK_TEMPLATE_NAMES[w.template]})` : ''} | ${waveLabel(w.wave)} | ${a.lower}/2 | ${a.upper}/2 | ${a.z2} (${a.z2Minutes}') | ${a.mobility}/2 | ${w.wild.map((x) => x.kind).join(', ') || '—'} | ${sleep === undefined ? '—' : `${roundTo(sleep, 1).toString().replace('.', ',')} h`} | ${wTrend === undefined ? '—' : `${formatPct(wTrend)}/sem`} |`,
    );
  }
  lines.push('');

  lines.push('## Síntomas');
  lines.push('');
  const symptoms = evaluateSymptoms({ checkins: input.checkins, sessions: input.sessions, today });
  const maxOf = (values: number[]) => (values.length > 0 ? Math.max(...values) : 0);
  lines.push(
    `Muñeca: máx. ${maxOf(symptoms.wrist.points.map((p) => p.value))}/10 · último ${symptoms.wrist.latest ?? '—'} · ${symptoms.wrist.rising ? 'creciente' : 'sin tendencia creciente'}.`,
  );
  lines.push(
    `Aductor: máx. ${maxOf(symptoms.adductor.points.map((p) => p.value))}/10 · último ${symptoms.adductor.latest ?? '—'} · ${symptoms.adductor.rising ? 'creciente' : 'sin tendencia creciente'}.`,
  );
  for (const a of symptoms.advisories) lines.push(`- Nivel ${a.level}: ${a.message}`);
  lines.push('');

  lines.push('## Evolución');
  lines.push('');
  const ev = summary.evolution;
  if (!ev.automatic) lines.push(ev.note);
  else {
    for (const c of ev.conditions) lines.push(`- ${c.met ? '✅' : '⬜'} ${c.text}: ${c.detail}`);
    lines.push('');
    lines.push(
      ev.ready
        ? `Las 4 condiciones se cumplen: la app ofrece evolucionar a ${FORMS[ev.to!].fullName}.`
        : `Faltan ${ev.conditions.filter((c) => !c.met).length} condiciones para la ${FORMS[ev.to!].fullName}.`,
    );
  }
  lines.push('');

  const others = input.adjustments.filter((a) => a.kind !== 'kcal' && a.kind !== 'plan');
  if (others.length > 0) {
    lines.push('## Ajustes registrados');
    lines.push('');
    for (const a of [...others].sort((x, y) => (x.date < y.date ? -1 : 1))) {
      lines.push(`- ${formatShort(a.date)} (${a.source}): ${a.detail.split('\n')[0]}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
