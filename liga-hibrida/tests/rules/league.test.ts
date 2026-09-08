import { describe, expect, it } from 'vitest';
import { buildWeekPlan } from '@/domain/content/week';
import {
  aerobicWeeks,
  blockReport,
  blockWeekRecords,
  compareTests,
  evaluateLeague,
  evolutionCheck,
  handstandStatus,
  lowerWeekVerdict,
  medalProgress,
  nextTestWeek,
  smartProgress,
  statValues,
  strengthGains,
  testWeekFor,
  toMedalRows,
  torsoStatus,
  trainerLevel,
  unilateralStatus,
  weightAt,
  weekAnchors,
  wristWeekVerdict,
  type LeagueInput,
} from '@/domain/rules/league';
import type { LeagueTest, Medal } from '@/domain/types';
import { makeCheckin } from '../fixtures/checkins';
import { buildOchoSemanas, OCHO_SEMANAS_TODAY, ochoSemanasProfile } from '../fixtures/ochoSemanas';
import { checkinRun, makeRegen, makeRoute, makeSession, makeWild } from '../fixtures/records';

const file = buildOchoSemanas();

function ochoSemanas(patch: Partial<LeagueInput> = {}): LeagueInput {
  const { tables } = file;
  return {
    profile: ochoSemanasProfile(),
    today: OCHO_SEMANAS_TODAY,
    checkins: tables.checkins,
    sessions: tables.sessions,
    routes: tables.routes,
    wild: tables.wild,
    regen: tables.regen,
    tests: tables.tests,
    weeks: tables.weeks,
    medals: tables.medals,
    adjustments: tables.adjustments,
    ...patch,
  };
}

function empty(patch: Partial<LeagueInput> = {}): LeagueInput {
  return {
    profile: {
      ...ochoSemanasProfile(),
      baselines: {},
      startWeightKg: undefined,
      kcalBaseline: undefined,
    },
    today: '2026-09-09',
    checkins: [],
    sessions: [],
    routes: [],
    wild: [],
    regen: [],
    tests: [],
    weeks: [],
    medals: [],
    adjustments: [],
    ...patch,
  };
}

describe('R10 · medals (SPEC §6.10) with the 8-week fixture', () => {
  it('acceptance: CANTERA earned in week 5, RESORTE at +10 % (67 %), level "Entrenador de Liga"', () => {
    const summary = evaluateLeague(ochoSemanas());
    expect(summary.weekOfBlock).toBe(9);
    const cantera = summary.medals.find((m) => m.id === 'cantera')!;
    expect(cantera.earned).toBe(true);
    expect(cantera.earnedOn).toBe('2026-10-05');
    expect(cantera.isNew).toBe(true);
    expect(cantera.progress).toBe(1);

    const resorte = summary.medals.find((m) => m.id === 'resorte')!;
    expect(resorte.earned).toBe(false);
    expect(resorte.progress).toBe(0.67);
    expect(resorte.detail).toBe('20 kg × 8 (ficha) → 22 kg × 8 (test): +10,0 % sobre +15 %.');

    expect(summary.level.percent).toBe(100);
    expect(summary.level.level?.name).toBe('Entrenador de Liga');
    expect(summary.level.weeks.map((w) => w.weekOfBlock)).toEqual([5, 6, 7, 8]);
  });

  it('YUNQUE compares relative strength (carga+PC)/PC × reps against the week-8 test', () => {
    const torso = torsoStatus(ochoSemanas());
    expect(torso.map((t) => t.current!.source)).toEqual(['test', 'test']);
    const pullup = torso.find((t) => t.id === 'weighted_pullup')!;
    expect(pullup.baseline).toMatchObject({ loadKg: 10, reps: 6, bodyweightKg: 79 });
    expect(pullup.current).toMatchObject({ loadKg: 15, reps: 5, date: '2026-10-28' });
    expect(pullup.ratio).toBeLessThan(1);
    const dip = torso.find((t) => t.id === 'weighted_dip')!;
    expect(dip.ratio).toBeGreaterThan(1);
    const yunque = medalProgress(ochoSemanas()).find((m) => m.id === 'yunque')!;
    expect(yunque.earned).toBe(false);
    expect(yunque.progress).toBe(0.88);
    expect(pullup.ratio).toBe(0.879);
    expect(yunque.detail).toContain('Dominada lastrada 10 kg × 6 a 79 kg → 15 kg × 5');
  });

  it('YUNQUE is earned by a week-8 test at or above baseline with the weight up', () => {
    const tests = file.tables.tests.map((t) =>
      t.weekOfBlock === 8 ? { ...t, pullupRir2: { loadKg: 15, reps: 6 } } : t,
    );
    const yunque = medalProgress(ochoSemanas({ tests })).find((m) => m.id === 'yunque')!;
    expect(yunque.earned).toBe(true);
    expect(yunque.earnedOn).toBe('2026-10-28');
    expect(yunque.progress).toBe(1);
  });

  it('YUNQUE uses session marks as interim progress before the week-8 test', () => {
    const tests = file.tables.tests.filter((t) => t.weekOfBlock !== 8);
    const yunque = medalProgress(ochoSemanas({ tests })).find((m) => m.id === 'yunque')!;
    expect(yunque.earned).toBe(false);
    expect(yunque.detail).toContain('sesión');
    expect(yunque.detail).toContain('Se confirma con el Combate de Liga de la semana 8 o 12');
    const noBaseline = medalProgress(
      ochoSemanas({ profile: { ...ochoSemanasProfile(), baselines: {} }, tests: [] }),
    ).find((m) => m.id === 'yunque')!;
    expect(noBaseline.progress).toBe(0);
    expect(noBaseline.detail).toContain('Sin baseline');
  });

  it('VÉRTIGO: wrist streak breaks in week 6 (2/8 clean weeks) and the handstand improved (35 s vs 25 s)', () => {
    const vertigo = medalProgress(ochoSemanas()).find((m) => m.id === 'vertigo')!;
    expect(vertigo.progress).toBe(0.63);
    expect(vertigo.earned).toBe(false);
    expect(vertigo.detail).toContain('2/8 semanas sin síntomas crecientes de muñeca');
    expect(vertigo.detail).toContain('handstand mejorado');
    const hs = handstandStatus(file.tables.tests);
    expect(hs.improved).toBe(true);
    expect(hs.rangesImproved).toEqual(['tobillo', 'muñeca', 'cadera']);
    expect(hs.bestWallSec).toBe(35);
    expect(handstandStatus([])).toEqual({
      latest: undefined,
      previous: undefined,
      improved: false,
      rangesImproved: [],
      bestWallSec: undefined,
    });
  });

  it('VÉRTIGO is earned after 8 clean wrist weeks plus an improved handstand marker', () => {
    const checkins = file.tables.checkins.map((c) => ({ ...c, wrist: 1 }));
    const sessions = file.tables.sessions.map((s) => ({ ...s, wristDuring: 1 }));
    const vertigo = medalProgress(ochoSemanas({ checkins, sessions })).find(
      (m) => m.id === 'vertigo',
    )!;
    expect(vertigo.earned).toBe(true);
    expect(vertigo.earnedOn).toBe('2026-11-02');
  });

  it('keeps a stored earned medal and reports isNew only once', () => {
    const stored: Medal[] = [{ id: 'cantera', progress: 1, earnedOn: '2026-10-06' }];
    const cantera = medalProgress(ochoSemanas({ medals: stored })).find((m) => m.id === 'cantera')!;
    expect(cantera.earnedOn).toBe('2026-10-06');
    expect(cantera.isNew).toBe(false);
    const rows = toMedalRows(medalProgress(ochoSemanas()));
    expect(rows.find((r) => r.id === 'cantera')).toEqual({
      id: 'cantera',
      progress: 1,
      earnedOn: '2026-10-05',
    });
    expect(rows.find((r) => r.id === 'resorte')).toEqual({
      id: 'resorte',
      progress: 0.67,
      earnedOn: undefined,
    });
  });

  it('a cramp (adductor after > 3), a rising adductor series or a week without Lower break the streak; travel weeks are skipped', () => {
    const weeks = blockWeekRecords(ochoSemanas());
    expect(weeks).toHaveLength(9);
    expect(weeks[8].completed).toBe(false);
    expect(weeks.slice(0, 8).map(lowerWeekVerdict)).toEqual(Array(8).fill('ok'));

    const cramp = {
      ...weeks[2],
      sessions: weeks[2].sessions.map((s) => ({ ...s, adductorAfter: 4 })),
    };
    expect(lowerWeekVerdict(cramp)).toBe('fail');
    const rising = {
      ...weeks[2],
      checkins: [
        makeCheckin({ date: '2026-09-21', adductor: 1 }),
        makeCheckin({ date: '2026-09-22', adductor: 2 }),
        makeCheckin({ date: '2026-09-23', adductor: 3 }),
      ],
      sessions: weeks[2].sessions.map((s) => ({
        ...s,
        adductorAfter: undefined,
        adductorDuring: undefined,
      })),
    };
    expect(lowerWeekVerdict(rising)).toBe('fail');
    expect(lowerWeekVerdict({ ...weeks[2], sessions: [] })).toBe('fail');
    expect(lowerWeekVerdict({ ...weeks[2], template: 'viaje' })).toBe('skip');

    // Streak: weeks 1–3 ok, week 4 fails → CANTERA not earned yet in week 9 (streak 4 from weeks 5–8).
    const sessions = file.tables.sessions.map((s) =>
      s.gymId === 'cantera' && s.date === '2026-09-28' ? { ...s, adductorAfter: 5 } : s,
    );
    const cantera = medalProgress(ochoSemanas({ sessions })).find((m) => m.id === 'cantera')!;
    expect(cantera.earned).toBe(true);
    expect(cantera.earnedOn).toBe('2026-11-02');
    const early = medalProgress(ochoSemanas({ sessions, today: '2026-10-20' })).find(
      (m) => m.id === 'cantera',
    )!;
    expect(early.earned).toBe(false);
    expect(early.progress).toBe(0.5);
  });

  it('wrist weeks: a KO value or a rising run fails, no records skip, travel skips', () => {
    const weeks = blockWeekRecords(ochoSemanas());
    expect(weeks.slice(0, 8).map(wristWeekVerdict)).toEqual([
      'ok',
      'ok',
      'ok',
      'ok',
      'ok',
      'fail',
      'ok',
      'ok',
    ]);
    expect(wristWeekVerdict({ ...weeks[0], checkins: [], sessions: [] })).toBe('skip');
    expect(wristWeekVerdict({ ...weeks[0], template: 'viaje' })).toBe('skip');
    const rising = {
      ...weeks[0],
      sessions: [],
      checkins: [
        makeCheckin({ date: '2026-09-07', wrist: 1 }),
        makeCheckin({ date: '2026-09-08', wrist: 2 }),
        makeCheckin({ date: '2026-09-09', wrist: 3 }),
      ],
    };
    expect(wristWeekVerdict(rising)).toBe('fail');
  });
});

describe('R10 · trainer level, stats and SMART', () => {
  it('trainer level counts A sessions of the last 4 completed weeks and skips travel weeks', () => {
    const weeks = blockWeekRecords(ochoSemanas());
    const a = weekAnchors(weeks[0]);
    expect(a).toEqual({
      weekOfBlock: 1,
      done: 6,
      lower: 2,
      upper: 2,
      z2: 2,
      mobility: 2,
      z2Minutes: 100,
    });
    const viaje = ochoSemanas({
      weeks: file.tables.weeks.map((w) => (w.weekOfBlock === 7 ? { ...w, template: 'viaje' } : w)),
    });
    const level = trainerLevel(blockWeekRecords(viaje));
    expect(level.weeks.map((w) => w.weekOfBlock)).toEqual([4, 5, 6, 8]);
    expect(level.excluded).toBe(1);
    expect(level.detail).toContain('(1 de viaje no cuentan)');

    const partial = ochoSemanas({
      sessions: file.tables.sessions.filter((s) => s.gymId !== 'vertigo'),
      regen: [],
    });
    const p = trainerLevel(blockWeekRecords(partial));
    expect(p.percent).toBe(67);
    expect(p.level?.name).toBe('Aprendiz');
    const none = trainerLevel(blockWeekRecords(empty()));
    expect(none.percent).toBeNull();
    expect(none.level).toBeNull();
  });

  it('stats 0–100 follow the formulas of §6.2 and show "—" (null) without data', () => {
    const stats = statValues(ochoSemanas());
    const by = Object.fromEntries(stats.map((s) => [s.key, s]));
    expect(by.masa.value).toBe(15);
    expect(by.masa.detail).toContain('desde 79 hacia 85 kg');
    expect(by.fuerza.value).toBe(19);
    expect(by.motor.value).toBe(70);
    expect(by.motor.detail).toBe("Z2 60'/150' en 7 días · ruta más larga 60'/60' en 28 días.");
    expect(by.control.value).toBe(67);
    expect(by.aventura.value).toBe(88);
    expect(by.aventura.detail).toContain('3/4 ventanas');

    const none = Object.fromEntries(statValues(empty()).map((s) => [s.key, s.value]));
    expect(none).toEqual({ masa: null, fuerza: null, motor: null, control: null, aventura: null });

    const gains = strengthGains(ochoSemanas());
    expect(gains.map((g) => `${g.id}:${g.gainPct}`)).toEqual([
      'bench_press:10.7',
      'weighted_pullup:25',
      'trap_bar_deadlift:32',
      'bulgarian_split_squat:10',
    ]);
  });

  it('MASA penalises a weekly trend above 0,40 % and AVENTURA works without a transfer note', () => {
    const fast = checkinRun('2026-09-07', 14).map((c, i) => ({ ...c, weightKg: 79 + i * 0.1 }));
    const stats = statValues(
      empty({
        today: '2026-09-20',
        checkins: fast,
        profile: { ...ochoSemanasProfile(), baselines: {} },
      }),
    );
    const masa = stats.find((s) => s.key === 'masa')!;
    expect(masa.detail).toContain('−20 por tendencia');
    expect(masa.value).toBe(0);
    const aventura = statValues(
      empty({ today: '2026-09-20', wild: [makeWild('2026-09-12', 'mtb', 90, 'moderada')] }),
    ).find((s) => s.key === 'aventura')!;
    expect(aventura.value).toBe(25);
    expect(aventura.detail).toContain('sin nota de transferencia');
  });

  it('SMART progress with the fixture: statuses and details', () => {
    const smart = smartProgress(ochoSemanas());
    expect(smart.map((o) => `${o.id}:${o.status}`)).toEqual([
      '1:done',
      '2:done',
      '3:progress',
      '4:progress',
      '5:done',
      '6:done',
      '7:progress',
      '8:done',
      '9:done',
      '10:done',
    ]);
    expect(smart[0].detail).toBe(
      'Pesos en semanas 1–2: 14 (mín. 5) · baselines de fuerza: 5/3 · test de movilidad: sí.',
    );
    expect(smart[2].progress).toBeCloseTo(0.667, 2);
    expect(smart[4].detail).toContain("S5 105'/90' · S6 105'/90' · S7 110'/90' · S8 60'/60'");
    expect(smart[6].progress).toBe(0.25);
    expect(smart[7].detail).toContain('rangos mejorados 3/2 (tobillo, muñeca, cadera)');
    expect(smart[8].detail).toContain('semanas de construcción en +0,15–0,30 %/sem');
    expect(smart[9].detail).toBe('Sueño medio 8 h en 27 check-ins.');
  });

  it('SMART with no data is pending and manual overrides win', () => {
    const smart = smartProgress(empty());
    expect(smart.every((o) => o.status === 'pending')).toBe(true);
    expect(smart.map((o) => o.progress)).toEqual([0, 0, null, null, 0, 0, 0, 0, null, null]);
    const manual = smartProgress(
      empty({
        profile: {
          ...ochoSemanasProfile(),
          baselines: {},
          smartManual: { '6': { done: true, date: '2026-09-09', note: 'Hecha en el parque' } },
        },
      }),
    );
    expect(manual[5].status).toBe('manual');
    expect(manual[5].progress).toBe(1);
    expect(manual[5].manual?.note).toBe('Hecha en el parque');
  });

  it('aerobic weeks use the deload minimum, an easy run qualifies SMART 6 unless the next day hurts', () => {
    const aero = aerobicWeeks(blockWeekRecords(ochoSemanas()));
    expect(aero.ok).toBe(4);
    const routes = [makeRoute('2026-09-08', 50, 5)];
    const good = smartProgress(empty({ today: '2026-09-15', routes }));
    expect(good[5].status).toBe('done');
    const sore = smartProgress(
      empty({
        today: '2026-09-15',
        routes,
        checkins: [makeCheckin({ date: '2026-09-09', adductor: 4 })],
      }),
    );
    expect(sore[5].status).toBe('progress');
    expect(sore[5].detail).toContain("Carrera fácil más larga: 50'");
    const short = smartProgress(
      empty({ today: '2026-09-15', routes: [makeRoute('2026-09-08', 30, 5)] }),
    );
    expect(short[5].progress).toBeCloseTo(0.667, 2);
  });

  it('SMART 10 flags a sustained sleep drop (> 7 days under 7 h)', () => {
    const drop = checkinRun('2026-09-07', 10, { sleepHours: 6 });
    const smart = smartProgress(empty({ today: '2026-09-17', checkins: drop }));
    expect(smart[9].detail).toContain('caída sostenida > 7 días');
    expect(smart[9].progress).toBeCloseTo(0.375, 3);
  });
});

describe('R10 · evolution Forma I → II (SPEC §6.3)', () => {
  it('is offered only when the 4 conditions are met', () => {
    const notReady = evolutionCheck(ochoSemanas());
    expect(notReady.automatic).toBe(true);
    expect(notReady.ready).toBe(false);
    expect(notReady.conditions.map((c) => `${c.id}:${c.met}`)).toEqual([
      'legs:true',
      'wrists:false',
      'aerobic:true',
      'nutrition:true',
    ]);

    const checkins = file.tables.checkins.map((c) => ({ ...c, wrist: 1 }));
    const sessions = file.tables.sessions.map((s) => ({ ...s, wristDuring: 1 }));
    const ready = evolutionCheck(ochoSemanas({ checkins, sessions }));
    expect(ready.ready).toBe(true);
    expect(ready.to).toBe(2);

    const noIntake = evolutionCheck(
      ochoSemanas({
        checkins,
        sessions,
        adjustments: [],
        profile: { ...ochoSemanasProfile(), kcalBaseline: undefined },
      }),
    );
    expect(noIntake.ready).toBe(false);
    expect(noIntake.conditions[3].detail).toContain('sin ajuste ni objetivo kcal');
  });

  it('later Formas have no automatic conditions ("consulta al entrenador")', () => {
    const form2 = evolutionCheck(ochoSemanas({ profile: { ...ochoSemanasProfile(), form: 2 } }));
    expect(form2.automatic).toBe(false);
    expect(form2.to).toBe(3);
    expect(form2.note).toContain('consulta al entrenador');
    const form4 = evolutionCheck(ochoSemanas({ profile: { ...ochoSemanasProfile(), form: 4 } }));
    expect(form4.to).toBeNull();
    expect(form4.note).toContain('Forma IV');
  });
});

describe('R10 · league tests and the 12-week report', () => {
  it('test weeks: baseline in weeks 1–2, then 4/8/12', () => {
    expect(testWeekFor(1, [])).toBe(0);
    expect(testWeekFor(2, [file.tables.tests[0]])).toBeNull();
    expect(testWeekFor(4, [])).toBe(4);
    expect(testWeekFor(9, [])).toBeNull();
    expect(nextTestWeek(5)).toBe(8);
    expect(nextTestWeek(12)).toBe(12);
    expect(nextTestWeek(13)).toBeNull();
  });

  it('compares a test with the previous one field by field (acceptance: week 8 shows deltas vs week 4)', () => {
    const [, week4, week8] = file.tables.tests;
    const rows = compareTests(week8, week4);
    const by = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(by['Dominada RIR 2 (carga×reps)']).toMatchObject({
      current: '75',
      previous: '62,5',
      delta: '+12,5',
      better: true,
    });
    expect(by['Split squat L (carga×reps)']).toMatchObject({
      current: '176',
      previous: '160',
      delta: '+16',
    });
    expect(by['Ruta estándar RPE']).toMatchObject({
      current: '4',
      previous: '5',
      delta: '−1',
      better: true,
    });
    expect(by['FC media']).toMatchObject({ delta: '−6 ppm', better: true });
    expect(by['Handstand pared']).toMatchObject({
      current: '35 s',
      previous: '25 s',
      delta: '+10 s',
    });
    expect(by['Handstand libre']).toMatchObject({ current: '3 s', previous: '—', delta: '—' });
    expect(by['Cintura']).toMatchObject({ delta: '+0,5 cm', better: false });
    expect(by['Cadera']).toMatchObject({ current: 'mejor', previous: 'igual' });
    expect(by['Ruta estándar minutos']).toMatchObject({ delta: '=' });
    expect(by['Ruta estándar minutos'].better).toBeUndefined();
    const first = compareTests(week4);
    expect(first.every((r) => r.previous === '—' && r.delta === '—')).toBe(true);
  });

  it('unilateral status falls back to the week-0 test and then to the first session', () => {
    const noBaseline = { ...ochoSemanasProfile(), baselines: {} };
    const t0: LeagueTest = {
      ...file.tables.tests[0],
      splitSquat: [{ loadKg: 18, reps: 8, side: 'L' }],
    };
    const fromTest = unilateralStatus(ochoSemanas({ profile: noBaseline, tests: [t0] }));
    expect(fromTest.baseline).toMatchObject({ score: 144, source: 'test' });
    expect(fromTest.gain).toBeCloseTo(176 / 144 - 1, 4);
    const fromSession = unilateralStatus(ochoSemanas({ profile: noBaseline, tests: [] }));
    expect(fromSession.baseline).toMatchObject({
      score: 128,
      label: '16 kg × 8',
      source: 'primera sesión',
    });
    expect(fromSession.current).toMatchObject({ score: 176, source: 'sesión' });
    expect(unilateralStatus(empty()).gain).toBeUndefined();
  });

  it('weightAt uses the 7-day mean, then the last weight of 30 days', () => {
    const points = [
      { date: '2026-09-01', value: 80 },
      { date: '2026-09-02', value: 81 },
    ];
    expect(weightAt(points, '2026-09-02')).toBe(80.5);
    expect(weightAt(points, '2026-09-20')).toBe(81);
    expect(weightAt(points, '2026-10-20')).toBeUndefined();
  });

  it('generates the 12-week report in Markdown with every section', () => {
    const md = blockReport(ochoSemanas());
    expect(md.startsWith('# Liga Híbrida · Informe del Bloque 1 — Semana 9/12')).toBe(true);
    for (const heading of [
      '> Actúa como El Rival según los documentos Performance Trainee.',
      '## Ficha (0–100)',
      '## Medallas',
      '| CANTERA | 100 % | conseguida el 5 oct |',
      '## Objetivos SMART',
      '## Combates de Liga',
      '### Baseline · 8 sep',
      '### Semana 8 · 28 oct',
      '## Peso',
      '## Fuerza · mejores marcas a RIR ≤ 2',
      '| bench press | 70 kg × 8 | 77,5 kg × 8 (20 oct) | +10,7 % |',
      '## Semanas',
      '| S4 | Descarga |',
      '## Síntomas',
      '## Evolución',
      'Faltan 1 condiciones para la Forma II · Construcción.',
    ]) {
      expect(md).toContain(heading);
    }
    expect(md).toContain('Nivel: Entrenador de Liga (100 %)');
  });

  it('report variants: Final de Liga, no tests, no baselines, later Forma and extra adjustments', () => {
    const finished = blockReport(
      ochoSemanas({
        today: '2026-11-30',
        adjustments: [
          ...file.tables.adjustments,
          {
            id: 'n1',
            date: '2026-11-01',
            kind: 'nota',
            detail: 'P: ¿subo?\nR: sí',
            source: 'rival',
          },
          { id: 'p1', date: '2026-11-01', kind: 'plan', detail: '# Consejo', source: 'app' },
        ],
      }),
    );
    expect(finished).toContain('— Final de Liga');
    expect(finished).toContain('## Ajustes registrados');
    expect(finished).toContain('- 1 nov (rival): P: ¿subo?');
    expect(finished).not.toContain('# Consejo');

    const bare = blockReport(
      empty({ profile: { ...ochoSemanasProfile(), form: 3, baselines: {} } }),
    );
    expect(bare).toContain('Sin tests registrados.');
    expect(bare).toContain('Sin baselines de fuerza en la ficha.');
    expect(bare).toContain('se valoran con El Rival');
    expect(bare).toContain('Nivel: sin datos');

    const ready = blockReport(
      ochoSemanas({
        checkins: file.tables.checkins.map((c) => ({ ...c, wrist: 1 })),
        sessions: file.tables.sessions.map((s) => ({ ...s, wristDuring: 1 })),
        weeks: file.tables.weeks.map((w) =>
          w.weekOfBlock === 2 ? { ...w, template: 'montana' } : w,
        ),
      }),
    );
    expect(ready).toContain(
      'Las 4 condiciones se cumplen: la app ofrece evolucionar a Forma II · Construcción.',
    );
    expect(ready).toContain('| S2 (Montaña / MTB fuerte) |');
  });

  it('blockWeekRecords stops at today and buildWeekPlan weeks feed the template', () => {
    const weeks = blockWeekRecords(
      empty({
        today: '2026-09-16',
        weeks: [buildWeekPlan({ weekStart: '2026-09-07', weekOfBlock: 1, template: 'surf' })],
        sessions: [
          makeSession('cantera', '2026-09-07'),
          makeSession('cantera', '2026-09-16', { completed: false }),
        ],
        regen: [makeRegen('2026-09-09', 'yoga')],
      }),
    );
    expect(weeks.map((w) => `${w.weekOfBlock}:${w.completed}:${w.template}`)).toEqual([
      '1:true:surf',
      '2:false:null',
    ]);
    expect(weeks[0].sessions).toHaveLength(1);
    expect(weeks[1].sessions).toHaveLength(0);
    expect(weeks[0].regen).toHaveLength(1);
  });
});

describe('R10 · branch cases (defaults, fallbacks and wording)', () => {
  const noPoints = file.tables.checkins.map((c) => ({ ...c, weightKg: undefined }));

  it('torso: absolute carga×reps when no body weight is known; profile weight as fallback', () => {
    const absolute = torsoStatus(
      ochoSemanas({
        checkins: noPoints,
        profile: { ...ochoSemanasProfile(), startWeightKg: undefined },
      }),
    );
    expect(absolute[0].baseline?.bodyweightKg).toBeUndefined();
    expect(absolute[0].ratio).toBe(75 / 60);
    const withProfileWeight = torsoStatus(ochoSemanas({ checkins: noPoints }));
    expect(withProfileWeight[0].baseline?.bodyweightKg).toBe(79);
    expect(withProfileWeight[0].current?.bodyweightKg).toBe(79.8);
  });

  it('torso: baseline from the first test when the profile has none; test without weightAvg7', () => {
    const tests = file.tables.tests.map((t) =>
      t.weekOfBlock === 8 ? { ...t, weightAvg7: undefined } : t,
    );
    const status = torsoStatus(
      ochoSemanas({ profile: { ...ochoSemanasProfile(), baselines: {} }, tests }),
    );
    expect(status[0].baseline).toMatchObject({ loadKg: 12.5, reps: 5, source: 'test' });
    expect(status[0].current?.bodyweightKg).toBeCloseTo(79.81, 1);
  });

  it('YUNQUE at baseline but with the weight down asks for the weight to rise', () => {
    const tests = file.tables.tests.map((t) =>
      t.weekOfBlock === 8 ? { ...t, pullupRir2: { loadKg: 15, reps: 6 }, weightAvg7: 78 } : t,
    );
    const yunque = medalProgress(ochoSemanas({ tests })).find((m) => m.id === 'yunque')!;
    expect(yunque.earned).toBe(false);
    expect(yunque.detail).toContain('Falta que el peso medio suba respecto al baseline.');
  });

  it('handstand: free-standing seconds and the shoulder note count; mobility-only tests still compare', () => {
    const [t0, t4, t8] = file.tables.tests;
    const free = handstandStatus([
      { ...t4, handstand: { wallSec: 30 } },
      { ...t8, handstand: { wallSec: 30, freeSec: 5 }, mobility: { shoulderNote: 'mejor' } },
    ]);
    expect(free.improved).toBe(true);
    expect(free.rangesImproved).toEqual(['hombro']);
    const mobilityOnly = handstandStatus([
      { ...t0, handstand: undefined },
      { ...t4, handstand: undefined },
    ]);
    expect(mobilityOnly.improved).toBe(false);
    expect(mobilityOnly.rangesImproved).toEqual(['tobillo', 'muñeca']);
    expect(mobilityOnly.bestWallSec).toBeUndefined();
    const control = statValues(
      ochoSemanas({ tests: [t0, t4].map((t) => ({ ...t, handstand: undefined })) }),
    ).find((s) => s.key === 'control')!;
    expect(control.value).toBe(25);
    expect(control.detail).toContain('Handstand en pared 0 s/60 s');
  });

  it('VÉRTIGO earned date is the later of the streak and the test', () => {
    const checkins = file.tables.checkins.map((c) => ({ ...c, wrist: 1 }));
    const sessions = file.tables.sessions.map((s) => ({ ...s, wristDuring: 1 }));
    const tests = file.tables.tests.map((t) =>
      t.weekOfBlock === 8 ? { ...t, date: '2026-11-04' } : t,
    );
    const vertigo = medalProgress(
      ochoSemanas({ checkins, sessions, tests, today: '2026-11-06' }),
    ).find((m) => m.id === 'vertigo')!;
    expect(vertigo.earnedOn).toBe('2026-11-04');
  });

  it('streaks skip travel weeks when dating the medal', () => {
    const weeks = file.tables.weeks.map((w) =>
      w.weekOfBlock === 2 ? { ...w, template: 'viaje' as const } : w,
    );
    const cantera = medalProgress(ochoSemanas({ weeks })).find((m) => m.id === 'cantera')!;
    expect(cantera.earnedOn).toBe('2026-10-12');
  });

  it('trainer level wording for a single week and stats edge cases', () => {
    const one = trainerLevel(blockWeekRecords(ochoSemanas({ today: '2026-09-14' })));
    expect(one.detail).toContain('6/6 sesiones A en 1 semana.');
    const heavy = statValues(
      ochoSemanas({ profile: { ...ochoSemanasProfile(), startWeightKg: 86 } }),
    ).find((s) => s.key === 'masa')!;
    expect(heavy.value).toBe(100);
    const gains = strengthGains(ochoSemanas({ sessions: [] }));
    expect(gains.every((g) => g.gainPct === undefined && g.best === undefined)).toBe(true);
    const fuerza = statValues(ochoSemanas({ sessions: [] })).find((s) => s.key === 'fuerza')!;
    expect(fuerza.value).toBeNull();
  });

  it('AVENTURA reads "igual" and "peor" transfer notes', () => {
    const igual = statValues(ochoSemanas({ tests: file.tables.tests.slice(0, 2) })).find(
      (s) => s.key === 'aventura',
    )!;
    expect(igual.value).toBe(63);
    const peor = statValues(
      ochoSemanas({
        tests: file.tables.tests.map((t) =>
          t.weekOfBlock === 8 ? { ...t, transferNote: 'peor' } : t,
        ),
      }),
    ).find((s) => s.key === 'aventura')!;
    expect(peor.value).toBe(38);
  });

  it('SMART statuses in between: baseline in progress, legs in progress, unilateral done, torso done', () => {
    const partial = smartProgress(
      empty({
        profile: {
          ...ochoSemanasProfile(),
          baselines: { bench_press: { loadKg: 70, reps: 8, date: '2026-09-07' } },
        },
      }),
    );
    expect(partial[0].status).toBe('progress');
    const early = smartProgress(ochoSemanas({ today: '2026-09-28' }));
    expect(early[1].status).toBe('progress');
    expect(early[1].progress).toBe(0.75);
    expect(early[8].status).toBe('progress');
    const strong = smartProgress(
      ochoSemanas({
        profile: {
          ...ochoSemanasProfile(),
          baselines: {
            ...ochoSemanasProfile().baselines,
            bulgarian_split_squat: { loadKg: 16, reps: 8, date: '2026-09-07' },
          },
        },
        tests: file.tables.tests.map((t) =>
          t.weekOfBlock === 8 ? { ...t, pullupRir2: { loadKg: 15, reps: 6 } } : t,
        ),
      }),
    );
    expect(strong[2].status).toBe('done');
    expect(strong[3].status).toBe('done');
  });

  it('SMART 7/8 wording: active wrist advisory today and a handstand without improvement', () => {
    const koDay = smartProgress(ochoSemanas({ today: '2026-10-15' }));
    expect(koDay[6].detail).toContain('aviso activo hoy');
    const flat = smartProgress(
      ochoSemanas({
        tests: file.tables.tests.map((t) =>
          t.weekOfBlock === 8 ? { ...t, handstand: { wallSec: 25 }, mobility: undefined } : t,
        ),
      }),
    );
    expect(flat[7].status).toBe('progress');
    expect(flat[7].detail).toContain('Handstand sin mejora · rangos mejorados 0/2.');
    const unsorted = smartProgress(
      empty({
        today: '2026-09-17',
        checkins: [...checkinRun('2026-09-07', 10, { sleepHours: 6 })].reverse(),
      }),
    );
    expect(unsorted[9].detail).toContain('caída sostenida');
  });

  it('evolution details before the legs medal and with an active wrist advisory', () => {
    const early = evolutionCheck(ochoSemanas({ today: '2026-10-15' }));
    expect(early.conditions[0].met).toBe(true);
    expect(early.conditions[1].detail).toContain('aviso de muñeca activo');
    const first = evolutionCheck(ochoSemanas({ today: '2026-09-28' }));
    expect(first.conditions[0].detail).toContain('3/4 semanas seguidas de Lower');
  });

  it('report wording without start weight, with reversed kcal rows and an active advisory', () => {
    const md = blockReport(
      ochoSemanas({
        today: '2026-10-15',
        profile: { ...ochoSemanasProfile(), startWeightKg: undefined },
        adjustments: [...file.tables.adjustments].reverse(),
        sessions: [],
      }),
    );
    expect(md).toContain('Inicio — · media 7 d');
    expect(md).toContain('- 21 sep:');
    expect(md).toContain('- Nivel 1: Muñeca 5/10 (≥ 5): KO en apoyos.');
    expect(md).toContain('| bench press | 70 kg × 8 | — | — |');
  });
});
