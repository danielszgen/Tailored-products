import { describe, expect, it } from 'vitest';
import {
  allBestMarks,
  bestMark,
  exerciseHistory,
  markScore,
  relativeStrength,
} from '@/domain/rules/marks';
import { makeSession, sets } from '../fixtures/records';

const sessions = [
  makeSession('yunque', '2026-09-08', {
    exercises: [{ exerciseId: 'bench_press', sets: sets(70, [8, 8, 7, 6]) }],
    wristDuring: 1,
  }),
  makeSession('yunque', '2026-09-15', {
    exercises: [{ exerciseId: 'bench_press', sets: sets(72.5, [6, 6, 6, 6], 3) }],
  }),
  makeSession('yunque', '2026-09-22', {
    exercises: [
      { exerciseId: 'bench_press', sets: sets(72.5, [8, 8, 8, 7]) },
      { exerciseId: 'weighted_pullup', sets: sets(10, [6, 6, 6, 6]) },
    ],
    wristDuring: 2,
  }),
  makeSession('yunque', '2026-09-29', {
    exercises: [{ exerciseId: 'bench_press', sets: sets(72.5, [8, 8, 8, 8]) }],
    completed: false,
  }),
];

describe('best marks (SPEC §8.5 "mejor marca a RIR ≤ 2")', () => {
  it('picks the highest load, then the most reps, ignoring RIR > 2 and unfinished sessions', () => {
    const mark = bestMark(sessions, 'bench_press')!;
    expect(mark).toMatchObject({
      exerciseId: 'bench_press',
      gymId: 'yunque',
      date: '2026-09-22',
      loadKg: 72.5,
      reps: 8,
      rir: 2,
    });
    expect(bestMark(sessions, 'bench_press', { rirMax: 3, until: '2026-09-16' })!.loadKg).toBe(
      72.5,
    );
    expect(bestMark(sessions, 'bench_press', { until: '2026-09-16' })!.loadKg).toBe(70);
    expect(bestMark(sessions, 'bench_press', { until: '2026-09-10' })!.loadKg).toBe(70);
    expect(bestMark(sessions, 'bench_press', { from: '2026-09-23' })).toBeUndefined();
    expect(bestMark(sessions, 'hack_squat')).toBeUndefined();
  });

  it('keeps the earliest date on ties and lists every exercise', () => {
    const tie = [
      makeSession('yunque', '2026-09-15', {
        exercises: [{ exerciseId: 'bench_press', sets: sets(70, [8]) }],
      }),
      makeSession('yunque', '2026-09-08', {
        exercises: [{ exerciseId: 'bench_press', sets: sets(70, [8]) }],
      }),
    ];
    expect(bestMark(tie, 'bench_press')!.date).toBe('2026-09-08');
    const all = allBestMarks(sessions);
    expect(Object.keys(all).sort()).toEqual(['bench_press', 'weighted_pullup']);
    expect(all.weighted_pullup.loadKg).toBe(10);
  });

  it('scores carga×reps (seconds for isometrics) and relative strength (carga+PC)/PC × reps', () => {
    expect(markScore({ loadKg: 70, reps: 8 })).toBe(560);
    expect(markScore({ loadKg: 10, reps: 12, seconds: 25 })).toBe(250);
    expect(relativeStrength(20, 6, 80)).toBeCloseTo(7.5);
    expect(relativeStrength(20, 6, 0)).toBe(0);
  });

  it('returns the history most recent first with the best set and symptom notes', () => {
    const history = exerciseHistory(sessions, 'bench_press');
    expect(history.map((h) => h.date)).toEqual(['2026-09-22', '2026-09-15', '2026-09-08']);
    expect(history[0].best).toMatchObject({ loadKg: 72.5, reps: 8 });
    expect(history[0].wristDuring).toBe(2);
    expect(history[2].best.reps).toBe(8);
    expect(exerciseHistory(sessions, 'bench_press', 1)).toHaveLength(1);
    expect(exerciseHistory(sessions, 'hack_squat')).toEqual([]);
  });
});

describe('best marks · isometric ties and skipped logs', () => {
  it('compares seconds on equal load and ignores logs without sets', () => {
    const iso = [
      makeSession('cantera', '2026-09-07', {
        exercises: [
          {
            exerciseId: 'copenhagen_or_cable_adduction',
            sets: [{ setIndex: 1, loadKg: 0, reps: 0, rir: 2, seconds: 20 }],
          },
        ],
      }),
      makeSession('cantera', '2026-09-14', {
        exercises: [
          {
            exerciseId: 'copenhagen_or_cable_adduction',
            sets: [{ setIndex: 1, loadKg: 0, reps: 0, rir: 2, seconds: 25 }],
          },
          { exerciseId: 'hack_squat', sets: [], skipped: true },
        ],
      }),
    ];
    expect(bestMark(iso, 'copenhagen_or_cable_adduction')!.seconds).toBe(25);
    expect(exerciseHistory(iso, 'hack_squat')).toEqual([]);
  });
});
