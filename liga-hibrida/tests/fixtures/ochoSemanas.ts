// "ocho_semanas" — the 8-week fixture of SPEC Appendix B, built deterministically as an export file.
// Profile at 79,0 kg; 56 check-ins (sleep 7–8,5 h, wrist 3→4→5 in week 6); 32 sessions (8 per gym,
// bench press 70→77,5 kg, Bulgarian 16→22 kg per hand); 14 Z2 routes of 40–60'; 6 adventures
// (2 hard MTB, 2 surf, 1 trail, 1 boulder); daily weights trending +0,18 %/sem from week 3
// (+0,07 %/sem while "measuring" in weeks 1–2); tests of week 4 and 8 (plus a week-0 baseline).
// Expected: Cantera medal in week 5, wrist advisory in week 6, "+150 a +200 kcal" proposal in
// week 3 and "Mantener" in week 5. The JSON snapshot lives next to this file (ocho_semanas.json).
import type { ExportFile } from '@/data/schema';
import type {
  Adjustment,
  Checkin,
  GymId,
  ISODate,
  LeagueTest,
  Medal,
  Profile,
  RegenLog,
  RouteLog,
  SessionLog,
  SetLog,
  WeekPlan,
  WildLog,
} from '@/domain/types';
import { classifyRoute } from '@/domain/content/routes';
import { buildWeekPlan } from '@/domain/content/week';
import { applyDeloadToWeek } from '@/domain/rules/deload';
import { kcalProposal, toAdjustment } from '@/domain/rules/weight';
import { addDaysISO } from '@/lib/date';
import { makeCheckin } from './checkins';

export const OCHO_SEMANAS_START: ISODate = '2026-09-07';
/** Monday of week 9: the 8 weeks are complete. */
export const OCHO_SEMANAS_TODAY: ISODate = '2026-11-02';
export const OCHO_SEMANAS_WEEKS = 8;
export const OCHO_SEMANAS_START_WEIGHT = 79;

const round2 = (v: number) => Math.round(v * 100) / 100;
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Day-of-week wobble that sums to zero over any 7 consecutive days (keeps weekly means exact). */
const ZIGZAG = [0, 0.2, -0.1, 0.1, -0.2, 0.1, -0.1];
const RATE_MEASURE = 0.0007; // +0,07 %/sem during weeks 1–2 ("solo medir")
const RATE_BUILD = 0.0018; // +0,18 %/sem from week 3
const KINK_DAY = 13;

/** Weight on day `d` of the block (0 = 7 Sep), two decimals. */
export function ochoSemanasWeight(d: number): number {
  const w0 = OCHO_SEMANAS_START_WEIGHT;
  const atKink = w0 * (1 + (RATE_MEASURE * KINK_DAY) / 7);
  const base =
    d <= KINK_DAY
      ? w0 * (1 + (RATE_MEASURE * d) / 7)
      : atKink * (1 + (RATE_BUILD * (d - KINK_DAY)) / 7);
  return round2(base + ZIGZAG[d % 7]);
}

function dateOf(day: number): ISODate {
  return addDaysISO(OCHO_SEMANAS_START, day);
}

function weekMonday(week: number): ISODate {
  return dateOf((week - 1) * 7);
}

/** Mean weight of the 7 days ending at `day`, one decimal (what a test's weightAvg7 would hold). */
function weightAvg7On(day: number): number {
  const values = [];
  for (let i = Math.max(0, day - 6); i <= day; i++) values.push(ochoSemanasWeight(i));
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}

// --- Check-ins ----------------------------------------------------------------

const SLEEP_BY_DOW = [8, 7.5, 8, 8.5, 7.5, 8, 8.5];
/** Week 6 wrist streak (days 35–41 = 12–18 Oct): Tue 3 → Wed 4 → Thu 5, Fri 5 (KO), then down. */
const WEEK6_WRIST: Record<number, number> = { 36: 3, 37: 4, 38: 5, 39: 5, 40: 3, 41: 2 };

function buildCheckins(): Checkin[] {
  const out: Checkin[] = [];
  for (let d = 0; d < OCHO_SEMANAS_WEEKS * 7; d++) {
    const dow = d % 7;
    const history = out.slice(-2).map((c) => ({ wrist: c.wrist, adductor: c.adductor }));
    out.push(
      makeCheckin({
        date: dateOf(d),
        sleepHours: SLEEP_BY_DOW[dow],
        energy: dow === 6 ? 5 : 4,
        legs: dow === 1 || dow === 4 ? 3 : 4,
        wrist: WEEK6_WRIST[d] ?? 1,
        adductor: dow === 1 || dow === 4 ? 2 : 1,
        weightKg: ochoSemanasWeight(d),
        history,
      }),
    );
  }
  return out;
}

// --- Sessions ----------------------------------------------------------------

function sets(loadKg: number, reps: number[], rir: number, perSide = false): SetLog[] {
  if (!perSide) return reps.map((r, i) => ({ setIndex: i + 1, loadKg, reps: r, rir }));
  const out: SetLog[] = [];
  reps.forEach((r, i) => {
    out.push({ setIndex: out.length + 1, loadKg, reps: r, rir, side: 'L' });
    out.push({ setIndex: out.length + 1, loadKg, reps: r, rir, side: 'R' });
    void i;
  });
  return out;
}

interface Row {
  load: number;
  reps: number[];
  rir: number;
}
const DELOAD = (load: number, reps = [6, 6]): Row => ({ load, reps, rir: 4 });

// Week-by-week schedules (index 0 = week 1). Weeks 4 and 8 are deloads.
const HACK: Row[] = [
  { load: 60, reps: [6, 6, 6, 6], rir: 3 },
  { load: 60, reps: [8, 8, 7, 7], rir: 2 },
  { load: 65, reps: [6, 6, 6, 6], rir: 3 },
  DELOAD(55),
  { load: 65, reps: [8, 8, 8, 7], rir: 2 },
  { load: 70, reps: [6, 6, 6, 6], rir: 3 },
  { load: 70, reps: [8, 8, 7, 7], rir: 2 },
  DELOAD(60),
];
const RDL: Row[] = [
  { load: 80, reps: [8, 8, 8], rir: 2 },
  { load: 85, reps: [7, 7, 7], rir: 2 },
  { load: 85, reps: [8, 8, 8], rir: 2 },
  DELOAD(75),
  { load: 90, reps: [7, 7, 7], rir: 2 },
  { load: 90, reps: [8, 8, 8], rir: 2 },
  { load: 95, reps: [7, 7, 6], rir: 2 },
  DELOAD(80),
];
/** Bulgarian split squat 16 → 22 kg per hand (3×8/lado). */
const BULGARIAN: Row[] = [
  { load: 16, reps: [8, 8, 8], rir: 2 },
  { load: 18, reps: [8, 8, 8], rir: 2 },
  { load: 18, reps: [8, 8, 8], rir: 2 },
  DELOAD(16, [8, 8]),
  { load: 20, reps: [8, 8, 8], rir: 2 },
  { load: 20, reps: [8, 8, 8], rir: 2 },
  { load: 22, reps: [8, 8, 8], rir: 2 },
  DELOAD(20, [8, 8]),
];
/** Bench press 70 → 77,5 kg (4×5–8). */
const BENCH: Row[] = [
  { load: 70, reps: [8, 8, 7, 6], rir: 2 },
  { load: 70, reps: [8, 8, 8, 8], rir: 2 },
  { load: 72.5, reps: [7, 7, 6, 6], rir: 2 },
  DELOAD(65),
  { load: 72.5, reps: [8, 8, 8, 8], rir: 2 },
  { load: 75, reps: [8, 8, 8, 7], rir: 2 },
  { load: 77.5, reps: [8, 8, 7, 7], rir: 2 },
  DELOAD(70),
];
const PULLUP: Row[] = [
  { load: 10, reps: [6, 6, 6, 6], rir: 2 },
  { load: 10, reps: [6, 6, 6, 6], rir: 2 },
  { load: 12.5, reps: [5, 5, 5, 5], rir: 2 },
  DELOAD(10, [5, 5]),
  { load: 12.5, reps: [6, 6, 6, 6], rir: 2 },
  { load: 12.5, reps: [6, 6, 6, 6], rir: 2 },
  { load: 15, reps: [5, 5, 5, 5], rir: 2 },
  DELOAD(12.5, [5, 5]),
];
const INCLINE: Row[] = [
  { load: 24, reps: [10, 10, 9], rir: 2 },
  { load: 24, reps: [10, 10, 10], rir: 2 },
  { load: 26, reps: [9, 9, 8], rir: 2 },
  DELOAD(22, [8, 8]),
  { load: 26, reps: [10, 10, 9], rir: 2 },
  { load: 26, reps: [10, 10, 10], rir: 2 },
  { load: 28, reps: [9, 9, 8], rir: 2 },
  DELOAD(24, [8, 8]),
];
const TRAP: Row[] = [
  { load: 100, reps: [5, 5, 5, 5], rir: 3 },
  { load: 100, reps: [6, 6, 6, 6], rir: 2 },
  { load: 105, reps: [5, 5, 5, 5], rir: 3 },
  DELOAD(90, [4, 4]),
  { load: 105, reps: [6, 6, 6, 6], rir: 2 },
  { load: 110, reps: [5, 5, 5, 5], rir: 3 },
  { load: 110, reps: [6, 6, 6, 6], rir: 2 },
  DELOAD(100, [4, 4]),
];
const FFE_SPLIT: Row[] = [
  { load: 14, reps: [8, 8, 8], rir: 2 },
  { load: 14, reps: [8, 8, 8], rir: 2 },
  { load: 16, reps: [8, 8, 8], rir: 2 },
  DELOAD(12, [8, 8]),
  { load: 16, reps: [8, 8, 8], rir: 2 },
  { load: 16, reps: [8, 8, 8], rir: 2 },
  { load: 18, reps: [8, 8, 8], rir: 2 },
  DELOAD(16, [8, 8]),
];
const HIP_THRUST: Row[] = [
  { load: 100, reps: [10, 10, 10], rir: 2 },
  { load: 110, reps: [8, 8, 8], rir: 2 },
  { load: 110, reps: [10, 10, 9], rir: 2 },
  DELOAD(90, [8, 8]),
  { load: 120, reps: [8, 8, 8], rir: 2 },
  { load: 120, reps: [10, 9, 9], rir: 2 },
  { load: 120, reps: [10, 10, 10], rir: 2 },
  DELOAD(100, [8, 8]),
];
const DIP: Row[] = [
  { load: 20, reps: [6, 6, 6, 6], rir: 2 },
  { load: 20, reps: [7, 7, 7, 7], rir: 2 },
  { load: 22.5, reps: [6, 6, 6, 6], rir: 2 },
  DELOAD(20, [5, 5]),
  { load: 22.5, reps: [7, 7, 7, 6], rir: 2 },
  { load: 22.5, reps: [7, 7, 7, 7], rir: 2 }, // not performed: week 6 is a wrist KO
  { load: 25, reps: [6, 6, 6, 6], rir: 2 },
  DELOAD(22.5, [5, 5]),
];
const CHINUP: Row[] = [
  { load: 5, reps: [8, 8, 8], rir: 2 },
  { load: 5, reps: [8, 8, 8], rir: 2 },
  { load: 7.5, reps: [8, 8, 7], rir: 2 },
  DELOAD(5),
  { load: 7.5, reps: [8, 8, 8], rir: 2 },
  { load: 7.5, reps: [6, 6, 6], rir: 3 },
  { load: 10, reps: [8, 7, 7], rir: 2 },
  DELOAD(7.5),
];
const DB_PRESS: Row[] = [
  { load: 16, reps: [10, 10, 10], rir: 2 },
  { load: 18, reps: [9, 9, 8], rir: 2 },
  { load: 18, reps: [10, 10, 9], rir: 2 },
  DELOAD(16, [8, 8]),
  { load: 18, reps: [10, 10, 10], rir: 2 },
  { load: 16, reps: [10, 10, 10], rir: 3 },
  { load: 20, reps: [9, 8, 8], rir: 2 },
  DELOAD(18, [8, 8]),
];

const CANTERA_AFTER = [2, 2, 1, 1, 2, 1, 2, 1];
const RESORTE_AFTER = [1, 2, 1, 1, 2, 2, 1, 1];
const WRIST_DURING_UPPER = [1, 1, 1, 1, 1, 3, 2, 1];

function session(
  gymId: GymId,
  date: ISODate,
  week: number,
  exercises: SessionLog['exercises'],
  patch: Partial<SessionLog> = {},
): SessionLog {
  const deload = week === 4 || week === 8;
  const durationMin = deload ? 45 : 62;
  return {
    id: `s_${gymId}_${date}`,
    date,
    gymId,
    weekOfBlock: week,
    version: 60,
    statusAtStart: 'ok',
    energyStart: 4,
    energyEnd: 3,
    feel: 'normal',
    exercises,
    durationMin,
    completed: true,
    warmupDone: true,
    startedAt: `${date}T08:00:00`,
    finishedAt: `${date}T0${8 + Math.floor(durationMin / 60)}:${String(durationMin % 60).padStart(2, '0')}:00`,
    ...patch,
  };
}

function ex(exerciseId: string, row: Row, perSide = false) {
  return { exerciseId, sets: sets(row.load, row.reps, row.rir, perSide) };
}

function buildSessions(): SessionLog[] {
  const out: SessionLog[] = [];
  for (let week = 1; week <= OCHO_SEMANAS_WEEKS; week++) {
    const i = week - 1;
    const monday = weekMonday(week);
    const deload = week === 4 || week === 8;
    const sportAfterWild = week === 2 || week === 3 || week === 6 || week === 7 || week === 4;
    out.push(
      session(
        'cantera',
        monday,
        week,
        [
          ex('hack_squat', HACK[i]),
          ex('romanian_deadlift', RDL[i]),
          ex('bulgarian_split_squat', BULGARIAN[i], true),
          ...(deload ? [] : [ex('leg_press_or_extension', { load: 100, reps: [12, 12], rir: 2 })]),
        ],
        {
          adductorDuring: 1,
          adductorAfter: CANTERA_AFTER[i],
          sportLast24h: sportAfterWild ? 'Zona Salvaje el sábado, domingo paseo' : undefined,
        },
      ),
    );
    out.push(
      session(
        'yunque',
        addDaysISO(monday, 1),
        week,
        [
          ex('bench_press', BENCH[i]),
          ex('weighted_pullup', PULLUP[i]),
          ex('incline_db_press', INCLINE[i]),
        ],
        { wristDuring: WRIST_DURING_UPPER[i], adductorDuring: 0 },
      ),
    );
    out.push(
      session(
        'resorte',
        addDaysISO(monday, 3),
        week,
        [
          ex('trap_bar_deadlift', TRAP[i]),
          ex('front_foot_elevated_split_squat', FFE_SPLIT[i], true),
          ex('hip_thrust', HIP_THRUST[i]),
        ],
        { adductorDuring: 1, adductorAfter: RESORTE_AFTER[i] },
      ),
    );
    if (week === 6) {
      // Wrist KO (5/10 in the morning check-in): Vértigo omits handstand and dips (R1/R8).
      out.push(
        session(
          'vertigo',
          addDaysISO(monday, 4),
          week,
          [
            { exerciseId: 'weighted_dip', sets: [], skipped: true },
            ex('chinup_neutral', CHINUP[i]),
            ex('db_military_or_landmine_press', DB_PRESS[i]),
          ],
          {
            version: 45,
            statusAtStart: 'ko',
            energyStart: 3,
            energyEnd: 3,
            wristDuring: 4,
            adductorDuring: 0,
            feel: 'pesado',
            durationMin: 40,
          },
        ),
      );
    } else {
      out.push(
        session(
          'vertigo',
          addDaysISO(monday, 4),
          week,
          [
            ex('weighted_dip', DIP[i]),
            ex('chinup_neutral', CHINUP[i]),
            ex('db_military_or_landmine_press', DB_PRESS[i]),
          ],
          { wristDuring: WRIST_DURING_UPPER[i], adductorDuring: 0 },
        ),
      );
    }
  }
  return out;
}

// --- Routes, adventures, regen -------------------------------------------------

function route(date: ISODate, kind: RouteLog['kind'], minutes: number, rpe: number): RouteLog {
  return { id: `r_${date}_${kind}`, date, kind, minutes, rpe, countsAs: classifyRoute(rpe) };
}

/** 14 Z2 routes: two per normal week (Tue run + Fri bike), one easy bike in each deload week. */
function buildRoutes(): RouteLog[] {
  const out: RouteLog[] = [];
  for (let week = 1; week <= OCHO_SEMANAS_WEEKS; week++) {
    const monday = weekMonday(week);
    if (week === 4 || week === 8) {
      out.push(route(addDaysISO(monday, 1), 'bike', 60, 4));
      continue;
    }
    out.push(route(addDaysISO(monday, 1), 'run', week >= 5 ? 50 : 45, 5));
    out.push(route(addDaysISO(monday, 4), 'bike', week === 7 ? 60 : 55, 4));
  }
  return out;
}

const WILD: {
  week: number;
  kind: WildLog['kind'];
  minutes: number;
  intensity: WildLog['intensity'];
  note?: string;
}[] = [
  { week: 1, kind: 'mtb', minutes: 120, intensity: 'dura', note: 'Con amigos, 900 m+' },
  { week: 2, kind: 'surf', minutes: 90, intensity: 'moderada' },
  { week: 3, kind: 'trail', minutes: 75, intensity: 'moderada', note: 'Ritmo conversacional' },
  { week: 5, kind: 'mtb', minutes: 150, intensity: 'dura', note: 'Enduro, 1.200 m+' },
  { week: 6, kind: 'surf', minutes: 90, intensity: 'facil' },
  { week: 7, kind: 'boulder', minutes: 60, intensity: 'moderada' },
];

function buildWild(): WildLog[] {
  return WILD.map((w) => {
    const date = addDaysISO(weekMonday(w.week), 5);
    return {
      id: `w_${date}_${w.kind}`,
      date,
      kind: w.kind,
      minutes: w.minutes,
      intensity: w.intensity,
      note: w.note,
    };
  });
}

/** Per week: yoga Wed 45', movilidad Sun 30', wrist microdose Mon/Wed/Fri 10', adductor Tue/Thu 10'. */
function buildRegen(): RegenLog[] {
  const out: RegenLog[] = [];
  const add = (date: ISODate, kind: RegenLog['kind'], minutes: number) =>
    out.push({ id: `g_${date}_${kind}`, date, kind, minutes });
  for (let week = 1; week <= OCHO_SEMANAS_WEEKS; week++) {
    const monday = weekMonday(week);
    add(addDaysISO(monday, 2), 'yoga', 45);
    add(addDaysISO(monday, 6), 'movilidad', 30);
    for (const d of [0, 2, 4]) add(addDaysISO(monday, d), 'muneca', 10);
    for (const d of [1, 3]) add(addDaysISO(monday, d), 'aductor', 10);
  }
  return out;
}

// --- Tests ---------------------------------------------------------------------

function buildTests(): LeagueTest[] {
  const baseline: LeagueTest = {
    id: 't_0',
    date: dateOf(1),
    weekOfBlock: 0,
    handstand: { wallSec: 20 },
    mobility: { ankleCm: 8.5, wristExtDeg: 55, hipNote: 'igual', shoulderNote: 'igual' },
    waistCm: 84,
    weightAvg7: 79,
    note: 'Baseline de Semana 0: fotos hechas fuera de la app.',
  };
  const week4: LeagueTest = {
    id: 't_4',
    date: dateOf(23), // Wednesday of week 4
    weekOfBlock: 4,
    pullupRir2: { loadKg: 12.5, reps: 5 },
    dipRir2: { loadKg: 22.5, reps: 6 },
    splitSquat: [
      { loadKg: 20, reps: 8, side: 'L' },
      { loadKg: 20, reps: 8, side: 'R' },
    ],
    z2Standard: { routeKind: 'run', minutes: 45, rpe: 5, hrAvg: 138 },
    handstand: { wallSec: 25 },
    mobility: { ankleCm: 9, wristExtDeg: 60, hipNote: 'igual', shoulderNote: 'igual' },
    waistCm: 84,
    weightAvg7: weightAvg7On(23),
    transferNote: 'igual · MTB estable, escalada sin cambios',
    bilateralNote: 'Goblet squat limpio, sin calambre',
  };
  const week8: LeagueTest = {
    id: 't_8',
    date: dateOf(51), // Wednesday of week 8
    weekOfBlock: 8,
    pullupRir2: { loadKg: 15, reps: 5 },
    dipRir2: { loadKg: 25, reps: 6 },
    splitSquat: [
      { loadKg: 22, reps: 8, side: 'L' },
      { loadKg: 22, reps: 8, side: 'R' },
    ],
    z2Standard: { routeKind: 'run', minutes: 45, rpe: 4, hrAvg: 132 },
    handstand: { wallSec: 35, freeSec: 3 },
    mobility: { ankleCm: 10.5, wristExtDeg: 65, hipNote: 'mejor', shoulderNote: 'igual' },
    waistCm: 84.5,
    weightAvg7: weightAvg7On(51),
    transferNote: 'mejor · MTB con más piernas en las subidas',
    bilateralNote: 'Hack squat 70 kg estable',
  };
  return [baseline, week4, week8];
}

// --- Profile, weeks, adjustments ---------------------------------------------------

export function ochoSemanasProfile(): Profile {
  const date = OCHO_SEMANAS_START;
  return {
    name: 'Daniel',
    heightCm: 190,
    startWeightKg: OCHO_SEMANAS_START_WEIGHT,
    targetWeightKg: [85, 88],
    amWindow: ['07:00', '09:00'],
    pmWindow: ['19:00', '21:00'],
    blockStart: OCHO_SEMANAS_START,
    form: 1,
    baselines: {
      bench_press: { loadKg: 70, reps: 8, date },
      weighted_pullup: { loadKg: 10, reps: 6, date },
      weighted_dip: { loadKg: 20, reps: 6, date },
      trap_bar_deadlift: { loadKg: 100, reps: 5, date },
      bulgarian_split_squat: { loadKg: 20, reps: 8, date },
    },
    kcalBaseline: 3000,
    calorieMode: 'porciones',
    defaultTemplate: 'estandar',
  };
}

function buildWeeks(): WeekPlan[] {
  return Array.from({ length: OCHO_SEMANAS_WEEKS }, (_, i) =>
    applyDeloadToWeek(buildWeekPlan({ weekStart: weekMonday(i + 1), weekOfBlock: i + 1 })),
  );
}

function buildAdjustments(checkins: Checkin[]): Adjustment[] {
  const points = checkins.map((c) => ({ date: c.date, value: c.weightKg! }));
  return ['2026-09-21', '2026-10-05'].map((today) => {
    const proposal = kcalProposal({ points, blockStart: OCHO_SEMANAS_START, today })!;
    return toAdjustment(proposal, today);
  });
}

/** The whole export file (deterministic; snapshot in ocho_semanas.json). */
export function buildOchoSemanas(): ExportFile {
  const checkins = buildCheckins();
  const medals: Medal[] = (['cantera', 'yunque', 'resorte', 'vertigo'] as const).map((id) => ({
    id,
    progress: 0,
  }));
  return {
    app: 'liga-hibrida',
    schemaVersion: 1,
    exportedAt: `${OCHO_SEMANAS_TODAY}T07:30:00.000Z`,
    tables: {
      checkins,
      sessions: buildSessions(),
      routes: buildRoutes(),
      wild: buildWild(),
      regen: buildRegen(),
      weeks: buildWeeks(),
      tests: buildTests(),
      medals,
      adjustments: buildAdjustments(checkins),
      profile: [{ ...ochoSemanasProfile(), id: 'me' }],
    },
  };
}
