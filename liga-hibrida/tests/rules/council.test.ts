import { describe, expect, it } from 'vitest';
import { buildWeekPlan } from '@/domain/content/week';
import {
  buildScorecard,
  COUNCIL_STEPS,
  councilReport,
  nextWeekPlan,
  suggestedQuestions,
  type WeekRecords,
} from '@/domain/rules/council';
import { kcalProposal } from '@/domain/rules/weight';
import {
  checkinRun,
  makeRegen,
  makeRoute,
  makeSession,
  makeWild,
  sets,
  WEEK1,
  weightsLinear,
} from '../fixtures/records';

const plan = buildWeekPlan({ weekStart: WEEK1, weekOfBlock: 1 });

function goodWeek(): WeekRecords {
  return {
    plan,
    sessions: [
      makeSession('cantera', '2026-09-07', {
        exercises: [{ exerciseId: 'hack_squat', sets: sets(60, [8, 8, 8, 8], 3) }],
        adductorDuring: 1,
        adductorAfter: 2,
        feel: 'normal',
      }),
      makeSession('yunque', '2026-09-08', {
        exercises: [
          { exerciseId: 'bench_press', sets: sets(70, [8, 8, 8, 8]) },
          { exerciseId: 'weighted_pullup', sets: sets(10, [6, 6, 6, 6]) },
        ],
        wristDuring: 1,
        feel: 'facil',
      }),
      makeSession('resorte', '2026-09-10', { adductorAfter: 1 }),
      makeSession('vertigo', '2026-09-11'),
      makeSession('cantera', '2026-09-14', { id: 'next-week' }),
    ],
    routes: [
      makeRoute('2026-09-08', 45, 5),
      makeRoute('2026-09-11', 50, 4, { kind: 'bike', elevationM: 200 }),
    ],
    wild: [makeWild('2026-09-12', 'mtb', 120, 'moderada', { note: 'con amigos' })],
    regen: [makeRegen('2026-09-09', 'yoga'), makeRegen('2026-09-13', 'movilidad', 30)],
    checkins: checkinRun('2026-08-31', 14, { sleepHours: 8 }),
    weights: weightsLinear('2026-08-31', 14, 79, 0.18),
  };
}

describe('R11 · weekly scorecard (document 04 §8)', () => {
  it('scores a complete week all green', () => {
    const sc = buildScorecard(goodWeek());
    expect(sc.weekEnd).toBe('2026-09-13');
    expect(sc.metrics.map((m) => `${m.id}:${m.value}:${m.light}`)).toEqual([
      'lower:2/2:verde',
      'upper:2/2:verde',
      "z2:2 (95'):verde",
      'mobility:2/2:verde',
      'adventure:1:verde',
      'sleep:8 h:verde',
      'weight:+0,18 %/sem · 79,2 kg:verde',
      'pain:máx. 2/10:verde',
    ]);
    expect(sc.adherencePct).toBe(100);
    expect(sc.z2Minutes).toBe(95);
    expect(sc.longestRouteMin).toBe(50);
  });

  it('scores an empty week red where it matters and "sin datos" elsewhere', () => {
    const sc = buildScorecard({
      ...goodWeek(),
      sessions: [],
      routes: [],
      wild: [],
      regen: [],
      checkins: [],
      weights: [],
    });
    const by = Object.fromEntries(sc.metrics.map((m) => [m.id, m]));
    expect(by.lower.light).toBe('rojo');
    expect(by.upper.value).toBe('0/2');
    expect(by.z2.light).toBe('rojo');
    expect(by.mobility.light).toBe('rojo');
    expect(by.adventure.light).toBe('ambar');
    expect(by.sleep).toMatchObject({ value: 'sin datos', light: 'none' });
    expect(by.weight).toMatchObject({ value: 'sin tendencia', light: 'none' });
    expect(by.pain.light).toBe('verde');
    expect(sc.adherencePct).toBe(0);
  });

  it('flags partial anchors, short sleep, off-zone weight and rising pain', () => {
    const records = goodWeek();
    records.sessions = records.sessions.slice(0, 1);
    records.regen = records.regen.slice(0, 1);
    records.checkins = [
      ...checkinRun('2026-09-07', 4, { sleepHours: 7 }),
      ...['2026-09-11', '2026-09-12', '2026-09-13'].map((date, i) => ({
        ...checkinRun(date, 1, { sleepHours: 7, wrist: 2 + i })[0],
      })),
    ];
    records.weights = weightsLinear('2026-08-31', 14, 79, 0.6);
    const sc = buildScorecard(records);
    const by = Object.fromEntries(sc.metrics.map((m) => [m.id, m]));
    expect(by.lower).toMatchObject({ value: '1/2', light: 'ambar' });
    expect(by.mobility.light).toBe('ambar');
    expect(by.sleep.light).toBe('ambar');
    expect(by.weight.light).toBe('rojo');
    expect(by.pain).toMatchObject({ value: 'creciente', light: 'rojo' });
    expect(sc.adherencePct).toBe(50);

    records.weights = weightsLinear('2026-08-31', 14, 79, 0.05);
    records.checkins = checkinRun('2026-09-07', 7, { sleepHours: 6, wrist: 4 });
    const sc2 = buildScorecard(records);
    const by2 = Object.fromEntries(sc2.metrics.map((m) => [m.id, m]));
    expect(by2.weight.light).toBe('ambar');
    expect(by2.sleep.light).toBe('rojo');
    expect(by2.pain).toMatchObject({ value: 'persistente', light: 'rojo' });
  });
});

describe('R11 · next week and report', () => {
  it('builds next week with the calendar wave and the council decisions', () => {
    const next = nextWeekPlan(plan, {
      template: 'estandar',
      versions: { cantera: 75 },
      wildKind: 'mtb',
      questions: [],
    })!;
    expect(next.weekOfBlock).toBe(2);
    expect(next.weekStart).toBe('2026-09-14');
    expect(next.wave).toBe(1);
    expect(next.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 75 });
    expect(next.days[5].am).toEqual({ kind: 'wild', wildKind: 'mtb' });
    expect(next.substitutions).toEqual([]);

    const week3 = buildWeekPlan({ weekStart: '2026-09-21', weekOfBlock: 3 });
    const deload = nextWeekPlan(week3, { template: 'montana', questions: [] })!;
    expect(deload.wave).toBe('deload');
    expect(deload.template).toBe('montana');
    expect(deload.days[1].pm).toEqual({ kind: 'route', routeKind: 'run', minutes: [30, 40] });
    expect(deload.days[4].pm).toBeUndefined();
    expect(deload.days[5].am).toMatchObject({
      kind: 'wild',
      note: 'Descarga: aventura solo fácil.',
    });

    const week12 = buildWeekPlan({ weekStart: '2026-11-23', weekOfBlock: 12 });
    expect(nextWeekPlan(week12, { template: 'estandar', questions: [] })).toBeNull();
    expect(COUNCIL_STEPS).toHaveLength(7);
    expect(COUNCIL_STEPS.map((s) => s.title)).toEqual([
      'Contexto',
      'Anclas',
      'Motor',
      'Aventura',
      'Comida',
      'Recuperación',
      'Plan B',
    ]);
  });

  it('writes the Markdown report of §10.1 with the scorecard and next week', () => {
    const records = goodWeek();
    records.plan = {
      ...plan,
      substitutions: [{ date: '2026-09-11', removed: 'Ruta bici', reason: 'MTB del sábado' }],
    };
    const scorecard = buildScorecard(records);
    const next = nextWeekPlan(records.plan, { template: 'estandar', questions: [] });
    const kcal = kcalProposal({
      points: weightsLinear(WEEK1, 14, 79, 0.05),
      blockStart: WEEK1,
      today: '2026-09-21',
    });
    const md = councilReport({
      profile: { name: 'Daniel', form: 1 },
      records,
      scorecard,
      nextPlan: next,
      advisories: [{ level: 2, message: 'Piernas cargadas', source: 'test' }],
      kcal,
      questions: ['¿Subo el trap bar?', '', '¿Cuándo pruebo la barra?'],
      weightAvg7: 79.3,
    });
    expect(md).toContain('# Liga Híbrida · Consejo de la Liga — Semana 1/12 · Ola 1');
    expect(md).toContain('> Actúa como El Rival según los documentos Performance Trainee.');
    expect(md).toContain('| Lower | 2/2 | 2/2 | 🟢 |');
    expect(md).toContain('Adherencia a las anclas: 100 %.');
    expect(md).toContain('Media 7 d: 79,3 kg · Tendencia: +0,18 %/sem.');
    expect(md).toContain(
      "| Yunque (60') | M 8 sep | A1 70 kg × 8/8/8/8 @ RIR 2 · A2 10 kg × 6/6/6/6 @ RIR 2 | 4→3 | muñeca 1 | facil |",
    );
    expect(md).toContain(
      "| Cantera (60') | L 7 sep | A1 60 kg × 8/8/8/8 @ RIR 3 | 4→3 | aductor 1 · después 2 | normal |",
    );
    expect(md).toContain("- Ruta bici 11 sep: 50' RPE 4 (z2) · 200 m+");
    expect(md).toContain("- Zona Salvaje MTB 12 sep: 120' moderada · con amigos");
    expect(md).toContain('- 11 sep: Ruta bici — MTB del sábado');
    expect(md).toContain('- Nivel 2: Piernas cargadas (test)');
    expect(md).toContain('+150 a +200 kcal/día');
    expect(md).toContain('- CANTERA: 4 semanas consecutivas');
    expect(md).toContain('1. ¿Subo el trap bar?\n2. ¿Cuándo pruebo la barra?');
    expect(md).toContain('Semana 2/12 · Ola 1 · plantilla Estándar (14 sep)');
    expect(md).toContain("- L: AM Cantera · 60' · PM Natación suave");
    expect(md).not.toContain('next-week');
  });

  it('handles an empty week and the end of the block in the report', () => {
    const records = {
      ...goodWeek(),
      sessions: [],
      routes: [],
      wild: [],
      regen: [],
      checkins: [],
      weights: [],
    };
    const md = councilReport({
      profile: { name: 'Daniel', form: 1 },
      records,
      scorecard: buildScorecard(records),
      nextPlan: null,
      advisories: [],
      kcal: null,
      questions: [],
    });
    expect(md).toContain('Sin combates esta semana.');
    expect(md).toContain('Sin rutas ni aventuras.');
    expect(md).toContain('Ninguna.');
    expect(md).toContain('Ninguno.');
    expect(md).toContain('Semanas 1–2: solo medir');
    expect(md).toContain('1. —');
    expect(md).toContain('Fin del Bloque 1: Final de Liga.');
    expect(md).toContain('Media 7 d: — · Tendencia: sin datos suficientes.');
  });

  it('suggests three open questions from the weak metrics and advisories', () => {
    const records = { ...goodWeek(), sessions: [], routes: [] };
    const qs = suggestedQuestions(buildScorecard(records), [
      { level: 1, message: 'Muñeca subiendo.', source: 'R8' },
    ]);
    expect(qs).toHaveLength(3);
    expect(qs[0]).toContain('Lower: 0/2 frente a 2/2');
    expect(qs.every((q) => q.length > 0)).toBe(true);
    const all = suggestedQuestions(buildScorecard(goodWeek()), []);
    expect(all).toEqual(['', '', '']);
  });
});
