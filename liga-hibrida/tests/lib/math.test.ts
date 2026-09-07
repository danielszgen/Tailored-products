import { describe, expect, it } from 'vitest';
import { clamp, movingAverage7, roundTo, roundToStep } from '@/lib/math';

describe('math helpers', () => {
  it('clamps and rounds', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3);
    expect(roundToStep(71.3, 2.5)).toBe(72.5);
    expect(roundToStep(19, 5)).toBe(20);
  });

  it('moving average ignores gaps and uses a 7-day window', () => {
    const points = [
      { date: '2026-09-07', value: 79.0 },
      { date: '2026-09-08', value: 79.4 },
      // gap on the 9th
      { date: '2026-09-10', value: 79.2 },
      { date: '2026-09-14', value: 79.8 }, // window 08..14 → 79.4, 79.2, 79.8
    ];
    const ma = movingAverage7(points);
    expect(ma.map((p) => p.date)).toEqual(['2026-09-07', '2026-09-08', '2026-09-10', '2026-09-14']);
    expect(ma[0].value).toBe(79);
    expect(ma[1].value).toBe(79.2);
    expect(ma[2].value).toBe(79.2);
    expect(ma[3].value).toBeCloseTo(79.47, 2);
  });

  it('sorts unsorted input by date', () => {
    const ma = movingAverage7([
      { date: '2026-09-09', value: 80 },
      { date: '2026-09-07', value: 78 },
    ]);
    expect(ma[0].date).toBe('2026-09-07');
    expect(ma[1].value).toBe(79);
  });
});
