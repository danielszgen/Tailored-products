import { describe, expect, it } from 'vitest';
import { adjustSessionForStatus } from '@/domain/rules/pv';
import { suggestProgression } from '@/domain/rules/progression';
import { getExercise } from '@/domain/content/gyms';
import {
  adjustedTargets,
  bestSet,
  formatKg,
  targetsFromSuggestion,
} from '@/features/gym/suggestion';
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
const hack = getExercise('cantera', 'hack_squat')!;

describe('combat helpers around R2', () => {
  it('applies the CARGADO adjustment to accessories and RIR targets', () => {
    const cargado = adjustSessionForStatus({ status: 'cargado', koSource: null, gymId: 'cantera' });
    const ok = adjustSessionForStatus({ status: 'ok', koSource: null, gymId: 'cantera' });
    expect(adjustedTargets(bulgarian, cargado)).toEqual({ sets: 2, rirTarget: 3 });
    expect(adjustedTargets(bench, cargado)).toEqual({ sets: 4, rirTarget: 3 });
    expect(adjustedTargets(hack, cargado).rirTarget).toEqual([4, 3]);
    expect(adjustedTargets(bulgarian, ok)).toEqual({ sets: 3, rirTarget: 2 });
  });

  it('derives the day targets from the R2 suggestion, keeping "3→2" ranges', () => {
    const plain = suggestProgression({ spec: hack, history: [], status: 'ok', wave: 1 });
    expect(targetsFromSuggestion(hack, plain)).toEqual({ sets: 4, rirTarget: [3, 2] });
    const cargado = suggestProgression({
      spec: hack,
      history: [],
      status: 'cargado',
      wave: 1,
      rirDelta: 1,
    });
    expect(targetsFromSuggestion(hack, cargado)).toEqual({ sets: 4, rirTarget: [4, 3] });
    const deload = suggestProgression({ spec: hack, history: [], status: 'ok', wave: 'deload' });
    expect(targetsFromSuggestion(hack, deload)).toEqual({ sets: 2, rirTarget: 4 });
    const benchOk = suggestProgression({ spec: bench, history: [], status: 'ok', wave: 1 });
    expect(targetsFromSuggestion(bench, benchOk)).toEqual({ sets: 4, rirTarget: 2 });
  });

  it('picks the best set and formats kilos in Spanish', () => {
    const log: ExerciseLog = {
      exerciseId: 'bench_press',
      sets: [
        { setIndex: 1, loadKg: 70, reps: 8, rir: 2 },
        { setIndex: 2, loadKg: 72.5, reps: 6, rir: 2 },
        { setIndex: 3, loadKg: 72.5, reps: 7, rir: 1 },
      ],
    };
    expect(bestSet(log)).toMatchObject({ setIndex: 3 });
    expect(bestSet(undefined)).toBeUndefined();
    expect(bestSet({ exerciseId: 'x', sets: [] })).toBeUndefined();
    expect(formatKg(2.5)).toBe('2,5');
    expect(formatKg(70)).toBe('70');
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
