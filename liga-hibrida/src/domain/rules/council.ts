// R11 · Consejo de la Liga — SPEC §7 R11 (document 04 §8) and the report of §10.1.
// Pure: week records → scorecard with lights, next WeekPlan, Markdown report for El Rival.
import type {
  Advisory,
  Checkin,
  GymId,
  ISODate,
  Profile,
  RegenLog,
  RouteLog,
  SessionLog,
  SessionVersion,
  WeekPlan,
  WeekTemplate,
  WildKind,
  WildLog,
} from '../types';
import { BLOCK_WEEKS, aerobicRowForWave, waveLabel } from '../content/block';
import { GYM_NAMES, getExercise, isMainLift } from '../content/gyms';
import type { Light } from '../content/routes';
import { WILD_KIND_LABELS, ROUTE_KIND_LABELS } from '../content/routes';
import { MEDALS } from '../content/tests';
import { buildWeekPlan, plannedItemLabel, WEEK_TEMPLATE_NAMES } from '../content/week';
import { addDaysISO, DAY_SHORT_ES, dayIndexOf, formatShort } from '@/lib/date';
import { formatHours, formatKg, formatPct } from '@/lib/format';
import { mean, roundTo } from '@/lib/math';
import { applyDeloadToWeek } from './deload';
import { bestLoad } from './progression';
import { evaluateSymptoms } from './symptoms';
import type { KcalProposal } from './weight';
import { weeklyTrend } from './weight';

export interface WeekRecords {
  plan: WeekPlan;
  sessions: SessionLog[];
  routes: RouteLog[];
  wild: WildLog[];
  regen: RegenLog[];
  checkins: Checkin[];
  /** Weight points up to the end of the week (14 days are enough for the trend). */
  weights: { date: ISODate; value: number }[];
}

export interface ScoreMetric {
  id: 'lower' | 'upper' | 'z2' | 'mobility' | 'adventure' | 'sleep' | 'weight' | 'pain';
  label: string;
  value: string;
  target: string;
  light: Light | 'none';
  detail?: string;
}

export interface WeekScorecard {
  weekStart: ISODate;
  weekEnd: ISODate;
  weekOfBlock: number;
  metrics: ScoreMetric[];
  /** % of A sessions (4 gyms + 1 Z2 + 1 movilidad) done. */
  adherencePct: number;
  z2Minutes: number;
  longestRouteMin: number;
}

const LOWER: GymId[] = ['cantera', 'resorte'];
const UPPER: GymId[] = ['yunque', 'vertigo'];

function inWeek(date: ISODate, plan: WeekPlan): boolean {
  return date >= plan.weekStart && date <= addDaysISO(plan.weekStart, 6);
}

function countLight(done: number, planned: number): Light {
  if (done >= planned) return 'verde';
  if (done > 0) return 'ambar';
  return 'rojo';
}

/** Scorecard of the week (table 04.8): Lower 2/2, Upper 2/2, Z2 1+1, movilidad 2, aventura 1, sueño, peso, dolor. */
export function buildScorecard(records: WeekRecords): WeekScorecard {
  const { plan } = records;
  const weekEnd = addDaysISO(plan.weekStart, 6);
  const sessions = records.sessions.filter((s) => s.completed && inWeek(s.date, plan));
  const lowerDone = sessions.filter((s) => LOWER.includes(s.gymId)).length;
  const upperDone = sessions.filter((s) => UPPER.includes(s.gymId)).length;
  const routes = records.routes.filter((r) => inWeek(r.date, plan));
  const z2 = routes.filter((r) => r.countsAs === 'z2');
  const z2Minutes = z2.reduce((sum, r) => sum + r.minutes, 0);
  const longestRouteMin = routes.reduce((m, r) => Math.max(m, r.minutes), 0);
  const mobility = records.regen.filter(
    (g) => inWeek(g.date, plan) && (g.kind === 'yoga' || g.kind === 'movilidad'),
  ).length;
  const adventures = records.wild.filter((w) => inWeek(w.date, plan));
  const checkins = records.checkins.filter((c) => inWeek(c.date, plan));
  const sleep = mean(checkins.map((c) => c.sleepHours));
  const trend = weeklyTrend(records.weights, weekEnd);
  const symptoms = evaluateSymptoms({
    checkins: records.checkins,
    sessions: records.sessions,
    today: weekEnd,
  });
  const weekSymptomMax = Math.max(
    0,
    ...checkins.map((c) => Math.max(c.wrist, c.adductor)),
    ...sessions.map((s) =>
      Math.max(s.wristDuring ?? 0, s.adductorDuring ?? 0, s.adductorAfter ?? 0),
    ),
  );

  const aerobic = aerobicRowForWave(plan.wave);
  const metrics: ScoreMetric[] = [
    {
      id: 'lower',
      label: 'Lower',
      value: `${lowerDone}/2`,
      target: '2/2',
      light: countLight(lowerDone, 2),
    },
    {
      id: 'upper',
      label: 'Upper',
      value: `${upperDone}/2`,
      target: '2/2',
      light: countLight(upperDone, 2),
    },
    {
      id: 'z2',
      label: 'Z2',
      value: `${z2.length} (${z2Minutes}')`,
      target: '1+1',
      light: z2.length >= 1 ? 'verde' : 'rojo',
      detail: aerobic.z2,
    },
    {
      id: 'mobility',
      label: 'Movilidad',
      value: `${mobility}/2`,
      target: '2',
      light: countLight(mobility, 2),
    },
    {
      id: 'adventure',
      label: 'Aventura',
      value: `${adventures.length}`,
      target: '1',
      light: adventures.length >= 1 ? 'verde' : 'ambar',
      detail: aerobic.adventure,
    },
    {
      id: 'sleep',
      label: 'Sueño',
      value: sleep === undefined ? 'sin datos' : formatHours(roundTo(sleep, 1)),
      target: '≥ 7,5 h',
      light:
        sleep === undefined ? 'none' : sleep >= 7.5 ? 'verde' : sleep >= 6.5 ? 'ambar' : 'rojo',
      detail: `${checkins.length} check-ins`,
    },
    {
      id: 'weight',
      label: 'Peso',
      value:
        trend.trendPct === undefined
          ? 'sin tendencia'
          : `${formatPct(trend.trendPct)}/sem · ${formatKg(trend.meanThis!)} kg`,
      target: '+0,10–0,25 %/sem',
      light:
        trend.trendPct === undefined
          ? 'none'
          : trend.trendPct >= 0.1 && trend.trendPct <= 0.25
            ? 'verde'
            : trend.trendPct < -0.05 || trend.trendPct > 0.4
              ? 'rojo'
              : 'ambar',
    },
    {
      id: 'pain',
      label: 'Dolor progresivo',
      value:
        symptoms.wrist.rising || symptoms.adductor.rising
          ? 'creciente'
          : symptoms.wrist.persistent || symptoms.adductor.persistent
            ? 'persistente'
            : `máx. ${weekSymptomMax}/10`,
      target: '≤ 2/10 y sin subir',
      light:
        symptoms.wrist.rising ||
        symptoms.adductor.rising ||
        symptoms.wrist.persistent ||
        symptoms.adductor.persistent
          ? 'rojo'
          : weekSymptomMax >= 4
            ? 'ambar'
            : 'verde',
    },
  ];

  const anchorsDone =
    Math.min(2, lowerDone) +
    Math.min(2, upperDone) +
    Math.min(1, z2.length) +
    Math.min(1, mobility);
  return {
    weekStart: plan.weekStart,
    weekEnd,
    weekOfBlock: plan.weekOfBlock,
    metrics,
    adherencePct: Math.round((anchorsDone / 6) * 100),
    z2Minutes,
    longestRouteMin,
  };
}

// ---------------------------------------------------------------------------
// Next week
// ---------------------------------------------------------------------------

export interface CouncilDecisions {
  template: WeekTemplate;
  /** Version of each gym next week (defaults to the template's). */
  versions?: Partial<Record<GymId, SessionVersion>>;
  /** Zona Salvaje planned for Saturday (undefined keeps the template's). */
  wildKind?: WildKind;
  /** The 3 open questions of the week for El Rival. */
  questions: string[];
  kcalAccepted?: boolean;
}

/** Next week's plan: wave/deload from the calendar, template from the council. Null after week 12. */
export function nextWeekPlan(current: WeekPlan, decisions: CouncilDecisions): WeekPlan | null {
  const weekOfBlock = current.weekOfBlock + 1;
  if (weekOfBlock > BLOCK_WEEKS) return null;
  let plan = buildWeekPlan({
    weekStart: addDaysISO(current.weekStart, 7),
    weekOfBlock,
    template: decisions.template,
  });
  const days = { ...plan.days };
  for (const key of Object.keys(days) as unknown as (keyof WeekPlan['days'])[]) {
    const day = { ...days[key] };
    for (const slot of ['am', 'pm'] as const) {
      const item = day[slot];
      if (!item) continue;
      if (item.kind === 'gym' && decisions.versions?.[item.gymId]) {
        day[slot] = { ...item, version: decisions.versions[item.gymId]! };
      }
      if (item.kind === 'wild' && decisions.wildKind) {
        day[slot] = { ...item, wildKind: decisions.wildKind };
      }
    }
    days[key] = day;
  }
  plan = { ...plan, days };
  return applyDeloadToWeek(plan);
}

/** The 7 steps of the Sunday wizard (document 04 §8). */
export const COUNCIL_STEPS: readonly { id: string; title: string; hint: string }[] = [
  { id: 'contexto', title: 'Contexto', hint: 'Scorecard de la semana y cómo fue.' },
  { id: 'anclas', title: 'Anclas', hint: '2 Lower + 2 Upper: versiones de la semana que viene.' },
  { id: 'motor', title: 'Motor', hint: 'Z2: minutos de la ola y ruta más larga.' },
  { id: 'aventura', title: 'Aventura', hint: 'Zona Salvaje del sábado y su interferencia.' },
  { id: 'comida', title: 'Comida', hint: 'Peso, tendencia y ajuste calórico (R7).' },
  { id: 'recuperacion', title: 'Recuperación', hint: 'Sueño, síntomas y microdosis.' },
  { id: 'plan_b', title: 'Plan B', hint: 'Plantilla de la semana y preguntas para El Rival.' },
];

// ---------------------------------------------------------------------------
// Markdown report (§10.1)
// ---------------------------------------------------------------------------

export interface ReportInput {
  profile: Pick<Profile, 'name' | 'form'>;
  records: WeekRecords;
  scorecard: WeekScorecard;
  nextPlan: WeekPlan | null;
  advisories: Advisory[];
  kcal: KcalProposal | null;
  questions: string[];
  /** Weight 7-day mean at the end of the week, when known. */
  weightAvg7?: number;
}

const LIGHT_ICON: Record<Light | 'none', string> = {
  verde: '🟢',
  ambar: '🟡',
  rojo: '🔴',
  none: '⚪',
};

/** "A1 70 kg × 8/8/8/8 @ RIR 2 · A2 …" — the main lifts of a session (also sent to El Rival). */
export function mainLiftSummary(session: SessionLog): string {
  const parts: string[] = [];
  for (const log of session.exercises) {
    const spec = getExercise(session.gymId, log.exerciseId);
    if (!spec || !isMainLift(spec) || log.sets.length === 0) continue;
    const load = bestLoad(log.sets)!;
    const reps = log.sets
      .map((s) => (s.seconds !== undefined ? `${s.seconds}s` : s.reps))
      .join('/');
    const rir = Math.min(...log.sets.map((s) => s.rir));
    parts.push(`${spec.slot} ${formatKg(load)} kg × ${reps} @ RIR ${rir}`);
  }
  return parts.join(' · ') || 'sin series';
}

function symptomSummary(session: SessionLog): string {
  const bits: string[] = [];
  if (session.wristDuring !== undefined) bits.push(`muñeca ${session.wristDuring}`);
  if (session.adductorDuring !== undefined) bits.push(`aductor ${session.adductorDuring}`);
  if (session.adductorAfter !== undefined) bits.push(`después ${session.adductorAfter}`);
  return bits.join(' · ') || '—';
}

export function councilReport(input: ReportInput): string {
  const { records, scorecard, nextPlan, advisories, kcal, questions } = input;
  const plan = records.plan;
  const sessions = records.sessions
    .filter((s) => s.completed && inWeek(s.date, plan))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const routes = records.routes.filter((r) => inWeek(r.date, plan));
  const wild = records.wild.filter((w) => inWeek(w.date, plan));
  const trend = weeklyTrend(records.weights, scorecard.weekEnd);
  const lines: string[] = [];

  lines.push(
    `# Liga Híbrida · Consejo de la Liga — Semana ${plan.weekOfBlock}/${BLOCK_WEEKS} · ${waveLabel(plan.wave)}`,
  );
  lines.push('');
  lines.push(
    `${formatShort(plan.weekStart)} – ${formatShort(scorecard.weekEnd)} · Entrenador: ${input.profile.name} · Forma ${input.profile.form} · Plantilla ${WEEK_TEMPLATE_NAMES[plan.template]}`,
  );
  lines.push('');
  lines.push('> Actúa como El Rival según los documentos Performance Trainee.');
  lines.push('');

  lines.push('## Scorecard');
  lines.push('');
  lines.push('| Métrica | Valor | Objetivo | Semáforo |');
  lines.push('|---|---|---|---|');
  for (const m of scorecard.metrics) {
    lines.push(`| ${m.label} | ${m.value} | ${m.target} | ${LIGHT_ICON[m.light]} |`);
  }
  lines.push('');
  lines.push(`Adherencia a las anclas: ${scorecard.adherencePct} %.`);
  lines.push('');

  lines.push('## Peso');
  lines.push('');
  lines.push(
    `Media 7 d: ${input.weightAvg7 !== undefined ? `${formatKg(input.weightAvg7)} kg` : '—'} · Tendencia: ${
      trend.trendPct === undefined ? 'sin datos suficientes' : `${formatPct(trend.trendPct)}/sem`
    }.`,
  );
  lines.push('');

  lines.push('## Combates');
  lines.push('');
  if (sessions.length === 0) lines.push('Sin combates esta semana.');
  else {
    lines.push('| Gimnasio | Día | A1/A2 · B1/B2 | Energía | Síntomas | Sensación |');
    lines.push('|---|---|---|---|---|---|');
    for (const s of sessions) {
      lines.push(
        `| ${GYM_NAMES[s.gymId]} (${s.version}') | ${DAY_SHORT_ES[dayIndexOf(s.date)]} ${formatShort(s.date)} | ${mainLiftSummary(s)} | ${s.energyStart}→${s.energyEnd ?? '—'} | ${symptomSummary(s)} | ${s.feel ?? '—'} |`,
      );
    }
  }
  lines.push('');

  lines.push('## Rutas y Zona Salvaje');
  lines.push('');
  if (routes.length === 0 && wild.length === 0) lines.push('Sin rutas ni aventuras.');
  for (const r of routes) {
    lines.push(
      `- Ruta ${ROUTE_KIND_LABELS[r.kind].toLowerCase()} ${formatShort(r.date)}: ${r.minutes}' RPE ${r.rpe} (${r.countsAs})${r.elevationM ? ` · ${r.elevationM} m+` : ''}${r.note ? ` · ${r.note}` : ''}`,
    );
  }
  for (const w of wild) {
    lines.push(
      `- Zona Salvaje ${WILD_KIND_LABELS[w.kind]} ${formatShort(w.date)}: ${w.minutes}' ${w.intensity}${w.note ? ` · ${w.note}` : ''}`,
    );
  }
  lines.push(`- Z2 total: ${scorecard.z2Minutes}' · ruta más larga: ${scorecard.longestRouteMin}'`);
  lines.push('');

  lines.push('## Sustituciones aplicadas');
  lines.push('');
  if (plan.substitutions.length === 0) lines.push('Ninguna.');
  for (const s of plan.substitutions) {
    lines.push(`- ${formatShort(s.date)}: ${s.removed} — ${s.reason}`);
  }
  lines.push('');

  lines.push('## Avisos activos');
  lines.push('');
  if (advisories.length === 0) lines.push('Ninguno.');
  for (const a of [...advisories].sort((x, y) => x.level - y.level)) {
    lines.push(`- Nivel ${a.level}: ${a.message} (${a.source})`);
  }
  lines.push('');

  lines.push('## Ajuste calórico propuesto');
  lines.push('');
  lines.push(
    kcal ? kcal.text : 'Semanas 1–2: solo medir (registrar comida y pesarse 5–7 días/sem).',
  );
  lines.push('');

  lines.push('## Próximas condiciones de medallas');
  lines.push('');
  for (const m of MEDALS) lines.push(`- ${m.name}: ${m.condition}`);
  lines.push('');

  lines.push('## Preguntas abiertas de la semana');
  lines.push('');
  const qs = questions.filter((q) => q.trim().length > 0);
  if (qs.length === 0) lines.push('1. —');
  qs.forEach((q, i) => lines.push(`${i + 1}. ${q.trim()}`));
  lines.push('');

  lines.push('## Semana siguiente');
  lines.push('');
  if (!nextPlan) lines.push('Fin del Bloque 1: Final de Liga.');
  else {
    lines.push(
      `Semana ${nextPlan.weekOfBlock}/${BLOCK_WEEKS} · ${waveLabel(nextPlan.wave)} · plantilla ${WEEK_TEMPLATE_NAMES[nextPlan.template]} (${formatShort(nextPlan.weekStart)})`,
    );
    lines.push('');
    for (const d of [0, 1, 2, 3, 4, 5, 6] as const) {
      const day = nextPlan.days[d];
      const am = day.am ? plannedItemLabel(day.am) : '—';
      const pm = day.pm ? plannedItemLabel(day.pm) : '—';
      lines.push(`- ${DAY_SHORT_ES[d]}: AM ${am} · PM ${pm}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** Three suggested open questions from the scorecard (Daniel can edit them). */
export function suggestedQuestions(scorecard: WeekScorecard, advisories: Advisory[]): string[] {
  const out: string[] = [];
  for (const m of scorecard.metrics) {
    if (m.light === 'rojo' || m.light === 'ambar') {
      out.push(`${m.label}: ${m.value} frente a ${m.target}. ¿Qué ajusto la semana que viene?`);
    }
    if (out.length === 3) break;
  }
  for (const a of advisories) {
    if (out.length === 3) break;
    out.push(`Aviso nivel ${a.level}: ${a.message} ¿Cómo lo gestiono?`);
  }
  while (out.length < 3) out.push('');
  return out.slice(0, 3);
}
