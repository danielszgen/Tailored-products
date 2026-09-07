import { describe, expect, it } from 'vitest';
import { getExercise } from '@/domain/content/gyms';
import { buildWeekPlan } from '@/domain/content/week';
import {
  applyDeloadToWeek,
  DELOAD_ADVENTURE_NOTE,
  deloadRouteMinutes,
  deloadSets,
  deloadSummary,
  EVAL_WEEK_NOTE,
  isDeloadWave,
  weekKind,
} from '@/domain/rules/deload';

describe('R3 · deloads (SPEC §7 R3)', () => {
  it('weeks 4 and 8 are deloads, week 12 is the evaluation', () => {
    expect(weekKind(1)).toBe('normal');
    expect(weekKind(4)).toBe('deload');
    expect(weekKind(8)).toBe('deload');
    expect(weekKind(12)).toBe('eval');
    expect(isDeloadWave('deload')).toBe(true);
    expect(isDeloadWave(2)).toBe(false);
  });

  it('main lifts × 0.65 (min 2), accessories × 0.5 (min 1), rounded down', () => {
    expect(deloadSets(getExercise('yunque', 'bench_press')!)).toBe(2);
    expect(deloadSets(getExercise('cantera', 'romanian_deadlift')!)).toBe(2);
    expect(deloadSets(getExercise('cantera', 'bulgarian_split_squat')!)).toBe(1);
    expect(deloadSets(getExercise('cantera', 'leg_press_or_extension')!)).toBe(1);
    expect(deloadSets({ sets: 6 })).toBe(3);
  });

  it('Z2 ranges shrink 25–35 % in 5-minute steps', () => {
    expect(deloadRouteMinutes([45, 55])).toEqual([30, 40]);
    expect(deloadRouteMinutes([40, 60])).toEqual([25, 45]);
    expect(deloadRouteMinutes([20, 25])).toEqual([20, 20]);
  });

  it('applies to a deload week: routes reduced, adventure only easy, gyms untouched', () => {
    const plan = buildWeekPlan({ weekStart: '2026-09-28', weekOfBlock: 4 });
    const deloaded = applyDeloadToWeek(plan);
    expect(deloaded.days[1].pm).toEqual({ kind: 'route', routeKind: 'run', minutes: [30, 40] });
    expect(deloaded.days[4].pm).toMatchObject({ kind: 'route', minutes: [25, 45], optional: true });
    expect(deloaded.days[5].am).toEqual({ kind: 'wild', note: DELOAD_ADVENTURE_NOTE });
    expect(deloaded.days[0].am).toEqual(plan.days[0].am);
    expect(deloaded.days[0].pm).toEqual(plan.days[0].pm);

    const normal = buildWeekPlan({ weekStart: '2026-09-07', weekOfBlock: 1 });
    expect(applyDeloadToWeek(normal)).toBe(normal);
  });

  it('summarises the wave in Spanish', () => {
    expect(deloadSummary('deload')).toHaveLength(3);
    expect(deloadSummary('deload')[0]).toContain('RIR 4');
    expect(deloadSummary('eval')).toEqual([EVAL_WEEK_NOTE]);
    expect(deloadSummary(2)).toEqual([]);
  });
});
