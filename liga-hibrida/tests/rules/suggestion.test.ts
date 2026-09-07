import { describe, expect, it } from 'vitest';
import { adjustSessionForStatus } from '@/domain/rules/pv';
import { getExercise } from '@/domain/content/gyms';
import { adjustedTargets, formatKg, lastLoadSuggestion } from '@/features/gym/suggestion';
import { compareBest, sessionVolume, setCount } from '@/features/gym/volume';
import type { ExerciseLog, SessionLog } from '@/domain/types';

function session(exercises: ExerciseLog[]): SessionLog {
  return {
    id: 's1',
    date: '2026-09-07',
    gymId: 'yunque',
    weekOfBlock: 1,
    version: 60,
    statusAtStart: 'ok',
    energyStart: 4,
    exercises,
    completed: true,
  };
}

const bench = getExercise('yunque', 'bench_press')!;
const bulgarian = getExercise('cantera', 'bulgarian_split_squat')!;
const copenhagen = getExercise('cantera', 'copenhagen_or_cable_adduction')!;
const dip = getExercise('vertigo', 'weighted_dip')!;

describe('Etapa I load suggestion ("misma carga que la última vez")', () => {
  it('has no history → asks to pick a load and complete the range', () => {
    const s = lastLoadSuggestion(bench, []);
    expect(s.source).toBe('none');
    expect(s.text).toContain('Sin historial');
    expect(s.text).toContain('5–8');
    expect(lastLoadSuggestion(copenhagen, []).text).toContain('20–30 s');
  });

  it('repeats the best set of the last session', () => {
    const log: ExerciseLog = {
      exerciseId: 'bench_press',
      sets: [1, 2, 3, 4].map((i) => ({ setIndex: i, loadKg: 70, reps: 8, rir: 2 })),
    };
    const s = lastLoadSuggestion(bench, [{ session: session([log]), log }]);
    expect(s.source).toBe('last');
    expect(s.loadKg).toBe(70);
    expect(s.reps).toBe(8);
    expect(s.text).toContain('70 kg × 8');
    expect(s.text).toContain('RIR 2');
  });

  it('formats per-side, isometric and weighted-bodyweight variants', () => {
    const side: ExerciseLog = {
      exerciseId: 'bulgarian_split_squat',
      sets: [{ setIndex: 1, loadKg: 16, reps: 8, rir: 2, side: 'L' }],
    };
    expect(lastLoadSuggestion(bulgarian, [{ session: session([side]), log: side }]).text).toContain(
      'por lado',
    );
    const iso: ExerciseLog = {
      exerciseId: 'copenhagen_or_cable_adduction',
      sets: [{ setIndex: 1, loadKg: 0, reps: 0, rir: 3, seconds: 25, side: 'L' }],
    };
    expect(lastLoadSuggestion(copenhagen, [{ session: session([iso]), log: iso }]).text).toContain(
      '× 25 s',
    );
    const dips: ExerciseLog = {
      exerciseId: 'weighted_dip',
      sets: [{ setIndex: 1, loadKg: 20, reps: 6, rir: 2 }],
    };
    expect(lastLoadSuggestion(dip, [{ session: session([dips]), log: dips }]).text).toContain(
      'lastre 20 kg × 6',
    );
    expect(formatKg(2.5)).toBe('2,5');
    expect(formatKg(70)).toBe('70');
  });

  it('applies the CARGADO adjustment to accessories and RIR targets', () => {
    const cargado = adjustSessionForStatus({ status: 'cargado', koSource: null, gymId: 'cantera' });
    const ok = adjustSessionForStatus({ status: 'ok', koSource: null, gymId: 'cantera' });
    expect(adjustedTargets(bulgarian, cargado)).toEqual({ sets: 2, rirTarget: 3 });
    expect(adjustedTargets(bench, cargado)).toEqual({ sets: 4, rirTarget: 3 });
    expect(adjustedTargets(getExercise('cantera', 'hack_squat')!, cargado).rirTarget).toEqual([
      4, 3,
    ]);
    expect(adjustedTargets(bulgarian, ok)).toEqual({ sets: 3, rirTarget: 2 });
  });
});

describe('session volume and comparisons', () => {
  it('sums load × reps and counts sets', () => {
    const s = session([
      { exerciseId: 'bench_press', sets: [{ setIndex: 1, loadKg: 70, reps: 8, rir: 2 }] },
      {
        exerciseId: 'weighted_pullup',
        sets: [
          { setIndex: 1, loadKg: 10, reps: 6, rir: 2 },
          { setIndex: 2, loadKg: 10, reps: 5, rir: 1 },
        ],
      },
    ]);
    expect(sessionVolume(s)).toBe(560 + 60 + 50);
    expect(setCount(s)).toBe(3);
  });

  it('compares best sets in Spanish', () => {
    expect(
      compareBest(
        { setIndex: 1, loadKg: 72.5, reps: 8, rir: 2 },
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
      ).text,
    ).toBe('+2,5 kg a mismo RIR');
    expect(
      compareBest(
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
      ).text,
    ).toBe('=');
    expect(
      compareBest(
        { setIndex: 1, loadKg: 65, reps: 8, rir: 2 },
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
      ).text,
    ).toBe('−5 kg');
    expect(
      compareBest(
        { setIndex: 1, loadKg: 70, reps: 9, rir: 2 },
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
      ).text,
    ).toBe('+1 reps');
    expect(compareBest(undefined, undefined).text).toBe('—');
    expect(compareBest({ setIndex: 1, loadKg: 70, reps: 8, rir: 2 }, undefined).text).toBe(
      'Primera marca',
    );
  });
});
