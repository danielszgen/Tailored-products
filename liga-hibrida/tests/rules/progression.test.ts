import { describe, expect, it } from 'vitest';
import { getExercise } from '@/domain/content/gyms';
import {
  completedRange,
  describeSets,
  expectedSets,
  hardSportBefore,
  increaseBlockers,
  loadIncrement,
  lowSleepStreak,
  rirGoal,
  suggestProgression,
  type ProgressionInput,
  type ProgressionSession,
} from '@/domain/rules/progression';
import { sets } from '../fixtures/records';

const bench = getExercise('yunque', 'bench_press')!;
const bulgarian = getExercise('cantera', 'bulgarian_split_squat')!;
const copenhagen = getExercise('cantera', 'copenhagen_or_cable_adduction')!;
const dip = getExercise('vertigo', 'weighted_dip')!;
const trapBar = getExercise('resorte', 'trap_bar_deadlift')!;
const kneeRaise = getExercise('vertigo', 'hanging_knee_raise_dead_bug')!;

function session(reps: number[], patch: Partial<ProgressionSession> = {}, loadKg = 70, rir = 2) {
  return { date: '2026-09-08', wave: 1 as const, sets: sets(loadKg, reps, rir), ...patch };
}

function input(patch: Partial<ProgressionInput> = {}): ProgressionInput {
  return { spec: bench, history: [], status: 'ok', wave: 1, ...patch };
}

describe('R2 · double progression (SPEC §7 R2, document 05 example)', () => {
  it('press banca 8/8/8/8 at RIR 2 → +2,5 kg and back to 5–6 reps', () => {
    const s = suggestProgression(input({ history: [session([8, 8, 8, 8])] }));
    expect(s.kind).toBe('increase');
    expect(s.loadKg).toBe(72.5);
    expect(s.deltaKg).toBe(2.5);
    expect(s.repTarget).toEqual([5, 6]);
    expect(s.sets).toBe(4);
    expect(s.rir).toBe(2);
    expect(s.reason).toBe('Subo 2,5 kg porque completaste 8/8/8/8 a RIR 2. Objetivo 5–6.');
  });

  it('press banca 8/8/7/6 → same load, complete the range', () => {
    const s = suggestProgression(input({ history: [session([8, 8, 7, 6])] }));
    expect(s.kind).toBe('hold');
    expect(s.loadKg).toBe(70);
    expect(s.repTarget).toEqual([5, 8]);
    expect(s.reason).toContain('Misma carga (70 kg): 8/8/7/6');
    expect(s.reason).toContain('completa el rango 5–8 a RIR 2');
  });

  it('a session short of its planned sets holds even if every set hit the top', () => {
    const s = suggestProgression(input({ history: [session([8, 8, 8])] }));
    expect(s.kind).toBe('hold');
    expect(s.reason).toContain('(3/4 series)');
  });

  it('deload week 4: 90 % of the last non-deload load, sets × 0.65 (min 2), RIR 4', () => {
    const s = suggestProgression(input({ wave: 'deload', history: [session([8, 8, 8, 8])] }));
    expect(s.kind).toBe('deload');
    expect(s.loadKg).toBe(62.5);
    expect(s.sets).toBe(2);
    expect(s.rir).toBe(4);
    expect(s.reason).toBe('Descarga: 62,5 kg (90 % de 70 kg), 2 series, RIR 4.');
  });

  it('deload skips previous deload sessions to find the reference load', () => {
    const s = suggestProgression(
      input({
        wave: 'deload',
        history: [
          session([6, 6], { date: '2026-09-29', wave: 'deload' }, 60, 4),
          session([8, 8, 8, 8], { date: '2026-09-22', wave: 2 }, 80),
        ],
      }),
    );
    expect(s.loadKg).toBe(72.5);
    expect(s.reason).toContain('90 % de 80 kg');
  });

  it('deload without history asks for a comfortable load', () => {
    const s = suggestProgression(input({ wave: 'deload' }));
    expect(s.kind).toBe('deload');
    expect(s.loadKg).toBeUndefined();
    expect(s.sets).toBe(2);
    expect(s.rir).toBe(4);
    expect(s.reason).toContain('sin historial');
  });

  it('first session uses the baseline when there is one', () => {
    const s = suggestProgression(input({ baseline: { loadKg: 80, reps: 8, date: '2026-09-01' } }));
    expect(s.kind).toBe('first');
    expect(s.loadKg).toBe(80);
    expect(s.reason).toContain('baseline 80 kg × 8');
    const none = suggestProgression(input());
    expect(none.kind).toBe('first');
    expect(none.loadKg).toBeUndefined();
    expect(none.reason).toContain('Sin historial');
  });

  it.each([
    ['feel pesado', { history: [session([8, 8, 8, 8], { feel: 'pesado' })] }, 'pesada'],
    ['status CARGADO', { history: [session([8, 8, 8, 8])], status: 'cargado' as const }, 'CARGADO'],
    [
      'hard sport 24 h',
      { history: [session([8, 8, 8, 8])], hardSportLast24h: true },
      'deporte duro',
    ],
    ['low sleep', { history: [session([8, 8, 8, 8])], lowSleepStreak: true }, 'sueño < 7 h'],
  ])('does not increase when blocked by %s', (_name, patch, text) => {
    const s = suggestProgression(input(patch));
    expect(s.kind).toBe('hold');
    expect(s.loadKg).toBe(70);
    expect(s.blocked.length).toBeGreaterThan(0);
    expect(s.reason).toContain('rango completo (8/8/8/8), pero no subo porque');
    expect(s.reason).toContain(text);
  });

  it('lists several blockers joined with "y"', () => {
    const s = suggestProgression(
      input({ history: [session([8, 8, 8, 8], { feel: 'pesado' })], lowSleepStreak: true }),
    );
    expect(s.blocked).toHaveLength(2);
    expect(s.reason).toContain(' y ');
  });

  it('flags RIR below target in the last two sessions', () => {
    const blockers = increaseBlockers(
      input({
        history: [session([8, 8, 8, 8], {}, 70, 1), session([8, 8, 8, 8], {}, 70, 0)],
      }),
    );
    expect(blockers).toEqual([
      'el RIR real quedó por debajo del objetivo en las 2 últimas sesiones',
    ]);
    expect(increaseBlockers(input({ history: [session([8, 8, 8, 8], {}, 70, 1)] }))).toEqual([]);
  });

  it('per-side exercises expect sets × 2 and step 2 kg', () => {
    const six = {
      date: '2026-09-07',
      wave: 1 as const,
      sets: sets(16, [8, 8, 8, 8, 8, 8], 2, true),
    };
    expect(expectedSets(bulgarian)).toBe(6);
    expect(completedRange(bulgarian, six)).toBe(true);
    const s = suggestProgression(input({ spec: bulgarian, history: [six] }));
    expect(s.kind).toBe('increase');
    expect(s.loadKg).toBe(18);
    expect(s.repTarget).toEqual([8, 9]);
    const four = { ...six, sets: sets(16, [8, 8, 8, 8], 2, true) };
    expect(suggestProgression(input({ spec: bulgarian, history: [four] })).reason).toContain(
      '(4/6 series)',
    );
  });

  it('CARGADO accessories expect one set less; targets carry the R1 deltas', () => {
    expect(expectedSets(bulgarian, 'cargado')).toBe(4);
    expect(expectedSets(bench, 'cargado')).toBe(4);
    const s = suggestProgression(
      input({ spec: bulgarian, status: 'cargado', accessorySetDelta: -1, rirDelta: 1 }),
    );
    expect(s.sets).toBe(2);
    expect(s.rir).toBe(3);
  });

  it('isometric exercises progress on seconds and keep the seconds range', () => {
    const iso: ProgressionSession = {
      date: '2026-09-07',
      wave: 1,
      sets: [1, 2, 3, 4].map((i) => ({
        setIndex: i,
        loadKg: 0,
        reps: 0,
        rir: 3,
        seconds: 30,
        side: i % 2 ? ('L' as const) : ('R' as const),
      })),
    };
    expect(describeSets(copenhagen, iso.sets)).toBe('30/30/30/30 s');
    const s = suggestProgression(input({ spec: copenhagen, history: [iso] }));
    expect(s.isometric).toBe(true);
    expect(s.kind).toBe('increase');
    expect(s.loadKg).toBe(2.5);
    expect(s.repTarget).toEqual([20, 30]);
    expect(s.reason).toContain('30/30/30/30 s');
    const short = { ...iso, sets: iso.sets.map((x) => ({ ...x, seconds: 20 })) };
    expect(suggestProgression(input({ spec: copenhagen, history: [short] })).kind).toBe('hold');
  });

  it('bodyweight exercises without a load step never increase', () => {
    const done = { date: '2026-09-07', wave: 1 as const, sets: sets(0, [15, 15, 15], 2) };
    const s = suggestProgression(input({ spec: kneeRaise, history: [done] }));
    expect(s.kind).toBe('hold');
    expect(s.reason).toContain('sin carga que subir');
  });

  it('weighted bodyweight lifts talk about lastre', () => {
    const done = { date: '2026-09-07', wave: 1 as const, sets: sets(20, [8, 8, 8, 8], 2) };
    const s = suggestProgression(input({ spec: dip, history: [done] }));
    expect(s.loadKg).toBe(22.5);
    expect(
      suggestProgression(input({ spec: dip, wave: 'deload', history: [done] })).reason,
    ).toContain('lastre 17,5 kg');
  });

  it('increments are the larger of the load step and 2,5 %, rounded to the step', () => {
    expect(loadIncrement(bench, 70)).toBe(2.5);
    expect(loadIncrement(bench, 200)).toBe(5);
    expect(loadIncrement(trapBar, 140)).toBe(5);
    expect(loadIncrement(trapBar, 300)).toBe(10);
    expect(loadIncrement(kneeRaise, 0)).toBe(0);
  });

  it('detects hard sport the day before and three short nights', () => {
    const wild = [{ date: '2026-09-12', intensity: 'dura' as const }];
    const routes = [{ date: '2026-09-12', countsAs: 'duro' as const }];
    expect(hardSportBefore('2026-09-13', wild, [])).toBe(true);
    expect(hardSportBefore('2026-09-13', [], routes)).toBe(true);
    expect(hardSportBefore('2026-09-14', wild, routes)).toBe(false);
    expect(hardSportBefore('2026-09-13', [{ date: '2026-09-12', intensity: 'facil' }], [])).toBe(
      false,
    );
    const nights = (hours: number[]) =>
      hours.map((sleepHours, i) => ({ date: `2026-09-0${i + 1}`, sleepHours }));
    expect(lowSleepStreak(nights([8, 6, 6.5, 6]), '2026-09-04')).toBe(true);
    expect(lowSleepStreak(nights([6, 6, 7]), '2026-09-03')).toBe(false);
    expect(lowSleepStreak(nights([6, 6]), '2026-09-02')).toBe(false);
    expect(lowSleepStreak(nights([6, 6, 6, 9]), '2026-09-03')).toBe(true);
  });

  it('rirGoal takes the lower bound of a range', () => {
    expect(rirGoal(2)).toBe(2);
    expect(rirGoal([3, 2])).toBe(2);
    expect(rirGoal([1, 2])).toBe(1);
    expect(describeSets(bench, [])).toBe('—');
  });
});
