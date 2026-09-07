// Domain model — SPEC §5. Pure TypeScript: no React, no Dexie.
// Additions beyond the spec are marked with "// +" and kept optional.

export type StatKey = 'masa' | 'fuerza' | 'motor' | 'control' | 'aventura';
export type GymId = 'cantera' | 'yunque' | 'resorte' | 'vertigo'; // LOWER A, UPPER A, LOWER B, UPPER B
export type Status = 'ok' | 'cargado' | 'ko';
export type DayFuel = 'muy_alta' | 'alta' | 'media_alta' | 'media' | 'media_baja';
export type Form = 1 | 2 | 3 | 4;
export type ISODate = string; // 'YYYY-MM-DD'

// + Convenience aliases used across the app
export type Scale5 = 1 | 2 | 3 | 4 | 5;
export type SessionVersion = 45 | 60 | 75;
export type Wave = 1 | 2 | 3 | 'deload' | 'eval';
export type WeekTemplate = 'estandar' | 'montana' | 'surf' | 'fatiga' | 'viaje';
/** Day index inside a week. 0 = Monday … 6 = Sunday (SPEC D13: week starts on Monday). */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SessionCode = 'LOWER_A' | 'UPPER_A' | 'LOWER_B' | 'UPPER_B';

export interface Checkin {
  date: ISODate;
  sleepHours: number; // 0–12, step 0.5
  energy: Scale5;
  legs: Scale5; // 1 wrecked … 5 fresh
  wrist: number; // 0–10 pain/discomfort
  adductor: number; // 0–10
  weightKg?: number; // optional, on waking
  note?: string;
  pv: number; // computed (rule R1) and stored
  status: Status; // computed
}

export interface ExerciseSpec {
  id: string; // 'hack_squat'
  name: string; // 'Hack squat o goblet squat con talones elevados'
  slot: string; // 'A1', 'A2', 'B1'…
  sets: number;
  repMin: number;
  repMax: number; // or secondsMin/secondsMax for isometrics
  secondsMin?: number; // +
  secondsMax?: number; // +
  isometric?: boolean;
  perSide?: boolean;
  rirTarget: number | [number, number]; // 2 or [3,2] = "3→2"
  restSec: [number, number];
  note: string;
  types: StatKey[];
  loadStepKg: number; // minimum suggested increment (2.5 upper / 5 lower / 1 dumbbell)
  weightedBodyweight?: boolean; // weighted pull-up/dip: load = added weight
  accessory?: boolean; // + true for accessories (status adjustments touch accessories only)
  superset?: string; // + human-readable description when the slot is a superset
  alternatives?: string[]; // + accepted alternative names (e.g. "Copenhagen corto o aducción en polea")
}

export interface WarmupItem {
  id: string; // +
  name: string;
  dose: string;
  cue: string;
  tags?: WarmupTag[]; // +
}
// + Tags let rules omit warm-up blocks (e.g. handstand when the wrist is KO).
export type WarmupTag = 'handstand' | 'wrist_support' | 'adductor' | 'jump' | 'ramp_up';

export interface GymSpec {
  id: GymId;
  name: string;
  sessionCode: SessionCode;
  goal: string;
  cost: 'alto' | 'medio';
  primaryTypes: StatKey[];
  warmup: WarmupItem[]; // cannot be skipped
  warmupTitle: string; // + e.g. "Calentamiento (9–11 min, obligatorio)"
  warmupMinutes: [number, number]; // +
  main: ExerciseSpec[];
  fuelPre: string;
  fuelPost: string; // text from 03/05
  versions: { min45: string[]; min60: string[]; min75: string[] }; // ids of included exercises
  versionNotes: { min45: string; min60: string; min75: string }; // + literal version text from SPEC
  transitionNote?: string; // + e.g. barbell squat transition for Cantera
}

export interface SetLog {
  setIndex: number;
  loadKg: number;
  reps: number;
  rir: number;
  seconds?: number;
  side?: 'L' | 'R';
}
export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  skipped?: boolean;
  substitutedBy?: string;
}
export interface SessionLog {
  id: string;
  date: ISODate;
  gymId: GymId;
  weekOfBlock: number;
  version: SessionVersion;
  statusAtStart: Status;
  energyStart: Scale5;
  energyEnd?: Scale5;
  wristDuring?: number;
  adductorDuring?: number;
  adductorAfter?: number; // 0–10 (30–60 min later)
  feel?: 'facil' | 'normal' | 'pesado';
  sportLast24h?: string;
  exercises: ExerciseLog[];
  durationMin?: number;
  completed: boolean;
  warmupDone?: boolean; // + warm-up checklist completed (or "done outside")
  startedAt?: string; // + ISO datetime, for duration/rest timers
  finishedAt?: string; // +
}

export type RouteKind = 'run' | 'bike' | 'swim' | 'walk';
export interface RouteLog {
  id: string;
  date: ISODate;
  kind: RouteKind;
  minutes: number;
  rpe: number;
  elevationM?: number;
  note?: string;
  countsAs: 'z2' | 'medio' | 'duro';
}

export type WildKind =
  'mtb' | 'trail' | 'surf' | 'climb_outdoor' | 'boulder' | 'skate' | 'swim_long' | 'other';
export interface WildLog {
  id: string;
  date: ISODate;
  kind: WildKind;
  minutes: number;
  intensity: 'facil' | 'moderada' | 'dura';
  note?: string;
}

export type RegenKind =
  'yoga' | 'movilidad' | 'muneca' | 'aductor' | 'sauna' | 'frio' | 'siesta' | 'paseo';
export interface RegenLog {
  id: string;
  date: ISODate;
  kind: RegenKind;
  minutes: number;
  note?: string;
}

export interface PlannedDay {
  am?: PlannedItem;
  pm?: PlannedItem;
  fuel: DayFuel;
}
export interface WeekPlan {
  weekStart: ISODate;
  weekOfBlock: number;
  wave: Wave;
  template: WeekTemplate;
  days: Record<DayIndex, PlannedDay>;
  substitutions: { date: ISODate; removed: string; reason: string }[];
}
export type PlannedItem =
  | { kind: 'gym'; gymId: GymId; version: SessionVersion }
  | { kind: 'route'; routeKind: RouteKind; minutes: [number, number]; optional?: boolean }
  | { kind: 'wild'; wildKind?: WildKind }
  | { kind: 'regen'; what: 'yoga' | 'movilidad' | 'natacion_suave' | 'paseo' }
  | { kind: 'off' }
  // + Technical sport slot (e.g. Wednesday "escalada o skate técnico 45–60' RPE ≤ 6")
  | {
      kind: 'sport';
      sport: 'escalada' | 'skate' | 'natacion' | 'otro';
      minutes: [number, number];
      rpeMax?: number;
      optional?: boolean;
    }
  // + Literal item the app cannot model yet (e.g. "2 full-body de mantenimiento" in the travel template)
  | { kind: 'note'; text: string };

export interface LeagueTest {
  id: string;
  date: ISODate;
  weekOfBlock: 4 | 8 | 12;
  pullupRir2?: { loadKg: number; reps: number };
  dipRir2?: { loadKg: number; reps: number };
  splitSquat?: { loadKg: number; reps: number; side: 'L' | 'R' }[];
  z2Standard?: { routeKind: RouteKind; minutes: number; rpe: number; hrAvg?: number };
  handstand?: { wallSec: number; freeSec?: number; videoNote?: string };
  mobility?: { ankleCm?: number; hipNote?: string; shoulderNote?: string; wristExtDeg?: number };
  waistCm?: number;
  weightAvg7?: number;
  transferNote?: string;
}

export interface Medal {
  id: 'cantera' | 'yunque' | 'resorte' | 'vertigo';
  progress: number;
  earnedOn?: ISODate;
}

export interface Baseline {
  loadKg: number;
  reps: number;
  date: ISODate;
}
export interface Profile {
  name: string;
  heightCm: number;
  startWeightKg?: number;
  targetWeightKg: [number, number];
  amWindow: [string, string];
  pmWindow: [string, string];
  blockStart: ISODate;
  form: Form;
  baselines: Partial<Record<string, Baseline>>;
  kcalBaseline?: number;
  kcalTarget?: number;
  dietNotes?: string;
  calorieMode?: 'contar' | 'porciones'; // + onboarding question (SPEC §8.1)
  defaultTemplate?: WeekTemplate; // + settings: default week template
}
export interface Adjustment {
  id: string;
  date: ISODate;
  kind: 'kcal' | 'volumen' | 'plan' | 'nota';
  detail: string;
  source: 'app' | 'rival' | 'daniel';
}

/** + Every warning produced by a rule carries the Constitution level it protects (SPEC §7). */
export interface Advisory {
  level: 1 | 2 | 3 | 4 | 5;
  message: string;
  source: string; // document reference, e.g. "06 §6"
}
