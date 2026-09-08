// Builds the exact JSON sent to El Rival (SPEC §10.2) from the local records. Pure.
// Shown to Daniel before the first call ("Mostrar al usuario el JSON exacto antes de enviar").
import type {
  Advisory,
  Checkin,
  ISODate,
  Profile,
  RouteLog,
  SessionLog,
  WeekPlan,
  WildLog,
} from '../types';
import { GYM_NAMES } from '../content/gyms';
import { waveLabel, waveForWeek } from '../content/block';
import { DAY_FUEL_LABELS, plannedItemLabel } from '../content/week';
import { mainLiftSummary } from '../rules/council';
import { addDaysISO, DAY_SHORT_ES, formatShort, weekOfBlock } from '@/lib/date';
import {
  RIVAL_CHECKIN_DAYS,
  RIVAL_CONTEXT_VERSION,
  RIVAL_LOG_DAYS,
  RIVAL_SESSION_COUNT,
  RivalContextSchema,
  type RivalContext,
} from './schema';

export interface RivalContextInput {
  profile: Profile;
  today: ISODate;
  question: string;
  checkins: Checkin[];
  sessions: SessionLog[];
  routes: RouteLog[];
  wild: WildLog[];
  week: WeekPlan | null;
  advisories: Advisory[];
}

function byDateDesc<T extends { date: ISODate }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function byDateAsc<T extends { date: ISODate }>(rows: T[]): T[] {
  return byDateDesc(rows).reverse();
}

/** The context of §10.2, validated against the strict schema (throws if anything extra sneaks in). */
export function buildRivalContext(input: RivalContextInput): RivalContext {
  const { profile, today } = input;
  const wob = weekOfBlock(today, profile.blockStart);
  const logsFrom = addDaysISO(today, -(RIVAL_LOG_DAYS - 1));
  const context: RivalContext = {
    app: 'liga-hibrida',
    version: RIVAL_CONTEXT_VERSION,
    today,
    question: input.question.trim(),
    profile: {
      name: profile.name,
      heightCm: profile.heightCm,
      startWeightKg: profile.startWeightKg,
      targetWeightKg: profile.targetWeightKg,
      form: profile.form,
      blockStart: profile.blockStart,
      weekOfBlock: wob,
      wave: waveLabel(waveForWeek(wob)),
      squatVariant: profile.squatVariant,
      calorieMode: profile.calorieMode,
      kcalBaseline: profile.kcalBaseline,
      kcalTarget: profile.kcalTarget,
      dietNotes: profile.dietNotes,
    },
    checkins: byDateAsc(
      byDateDesc(input.checkins.filter((c) => c.date <= today)).slice(0, RIVAL_CHECKIN_DAYS),
    ).map((c) => ({
      date: c.date,
      sleepHours: c.sleepHours,
      energy: c.energy,
      legs: c.legs,
      wrist: c.wrist,
      adductor: c.adductor,
      weightKg: c.weightKg,
      pv: c.pv,
      status: c.status,
    })),
    sessions: byDateAsc(
      byDateDesc(input.sessions.filter((s) => s.completed && s.date <= today)).slice(
        0,
        RIVAL_SESSION_COUNT,
      ),
    ).map((s) => ({
      date: s.date,
      gym: GYM_NAMES[s.gymId],
      version: s.version,
      statusAtStart: s.statusAtStart,
      mainLifts: mainLiftSummary(s),
      energy: `${s.energyStart}→${s.energyEnd ?? '—'}`,
      wristDuring: s.wristDuring,
      adductorDuring: s.adductorDuring,
      adductorAfter: s.adductorAfter,
      feel: s.feel,
      sportLast24h: s.sportLast24h || undefined,
      durationMin: s.durationMin,
    })),
    routes: byDateAsc(input.routes.filter((r) => r.date >= logsFrom && r.date <= today)).map(
      (r) => ({
        date: r.date,
        kind: r.kind,
        minutes: r.minutes,
        rpe: r.rpe,
        countsAs: r.countsAs,
        elevationM: r.elevationM,
        note: r.note,
      }),
    ),
    wild: byDateAsc(input.wild.filter((w) => w.date >= logsFrom && w.date <= today)).map((w) => ({
      date: w.date,
      kind: w.kind,
      minutes: w.minutes,
      intensity: w.intensity,
      note: w.note,
    })),
    week: input.week
      ? {
          weekStart: input.week.weekStart,
          weekOfBlock: input.week.weekOfBlock,
          wave: waveLabel(input.week.wave),
          template: input.week.template,
          days: ([0, 1, 2, 3, 4, 5, 6] as const).map((d) => {
            const day = input.week!.days[d];
            return {
              day: DAY_SHORT_ES[d],
              am: day.am ? plannedItemLabel(day.am) : undefined,
              pm: day.pm ? plannedItemLabel(day.pm) : undefined,
              fuel: DAY_FUEL_LABELS[day.fuel],
            };
          }),
          substitutions: input.week.substitutions.map(
            (s) => `${formatShort(s.date)}: ${s.removed} — ${s.reason}`,
          ),
        }
      : null,
    advisories: input.advisories.map((a) => ({
      level: a.level,
      message: a.message,
      source: a.source,
    })),
  };
  return RivalContextSchema.parse(stripUndefined(context));
}

/** JSON.stringify drops undefined anyway; this keeps the preview identical to the wire payload. */
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Pretty JSON exactly as it travels to the function. */
export function serializeRivalContext(context: RivalContext): string {
  return JSON.stringify(context, null, 2);
}
