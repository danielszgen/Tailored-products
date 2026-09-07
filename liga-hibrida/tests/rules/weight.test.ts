import { describe, expect, it } from 'vitest';
import {
  evaluationDates,
  kcalAdjustmentId,
  kcalProposal,
  latestEvaluationDate,
  nextEvaluationDate,
  nutritionPhaseFor,
  toAdjustment,
  weeklyTrend,
} from '@/domain/rules/weight';
import { WEEK1, weightsLinear } from '../fixtures/records';

describe('R7 · weekly trend', () => {
  it('compares this week with the previous one and ignores gaps', () => {
    const points = weightsLinear(WEEK1, 14, 79, 0.05);
    const t = weeklyTrend(points, '2026-09-20');
    expect(t.countThis).toBe(7);
    expect(t.countPrev).toBe(7);
    expect(t.trendPct).toBe(0.05);
    expect(t.meanPrev).toBeCloseTo(79.017, 2);

    const sparse = points.filter((_, i) => i % 3 === 0);
    expect(weeklyTrend(sparse, '2026-09-20').trendPct).toBeCloseTo(0.05, 1);
    expect(weeklyTrend([points[0]], '2026-09-20').trendPct).toBeUndefined();
    expect(weeklyTrend([], '2026-09-20')).toEqual({
      countThis: 0,
      countPrev: 0,
      meanThis: undefined,
      meanPrev: undefined,
      trendPct: undefined,
    });
  });

  it('schedules an evaluation every 14 days from blockStart, the first in week 3', () => {
    expect(evaluationDates(WEEK1, 3)).toEqual(['2026-09-21', '2026-10-05', '2026-10-19']);
    expect(latestEvaluationDate(WEEK1, '2026-09-20')).toBeNull();
    expect(latestEvaluationDate(WEEK1, '2026-09-21')).toBe('2026-09-21');
    expect(latestEvaluationDate(WEEK1, '2026-10-04')).toBe('2026-09-21');
    expect(latestEvaluationDate(WEEK1, '2026-10-05')).toBe('2026-10-05');
    expect(nextEvaluationDate(WEEK1, '2026-09-07')).toBe('2026-09-21');
    expect(nextEvaluationDate(WEEK1, '2026-09-21')).toBe('2026-10-05');
    expect(nextEvaluationDate(WEEK1, '2026-09-01')).toBe('2026-09-21');
  });
});

describe('R7 · fortnightly kcal algorithm (document 03)', () => {
  it('weeks 1–2 only measure: no proposal', () => {
    const points = weightsLinear(WEEK1, 14, 79, 0.05);
    expect(kcalProposal({ points, blockStart: WEEK1, today: '2026-09-14' })).toBeNull();
    expect(kcalProposal({ points, blockStart: WEEK1, today: '2026-09-20' })).toBeNull();
  });

  it('week 3 with +0,05 %/sem proposes "+150 a +200 kcal/día" (acceptance)', () => {
    const points = weightsLinear(WEEK1, 14, 79, 0.05);
    const p = kcalProposal({ points, blockStart: WEEK1, today: '2026-09-23' });
    expect(p).not.toBeNull();
    expect(p!.evaluationDate).toBe('2026-09-21');
    expect(p!.weekOfBlock).toBe(3);
    expect(p!.kind).toBe('increase');
    expect(p!.decision).toBe('+150 a +200 kcal/día');
    expect(p!.situation).toBe('Sube < 0,10 %/sem');
    expect(p!.phase).toBe('sem 3–5: +200–300 kcal si estable');
    expect(p!.text).toContain('Semana 3');
    expect(p!.text).toContain('+150 a +200 kcal/día');
    expect(toAdjustment(p!, '2026-09-23')).toEqual({
      id: 'kcal_2026-09-21',
      date: '2026-09-23',
      kind: 'kcal',
      detail: p!.text,
      source: 'app',
    });
    expect(kcalAdjustmentId('2026-10-05')).toBe('kcal_2026-10-05');
  });

  it.each([
    [0, 'increase', '+200 a +300 kcal/día sobre la media real'],
    [0.18, 'hold', 'Mantener (zona objetivo)'],
    [
      0.3,
      'hold',
      'Mantener y vigilar cintura (por encima de la zona objetivo, por debajo del umbral de recorte).',
    ],
    [0.45, 'decrease', '−150 a −200 kcal/día (solo si la cintura acelera)'],
    [-0.3, 'increase', 'Añade comida.'],
  ])('trend %s %%/sem → %s', (pct, kind, decision) => {
    const points = weightsLinear(WEEK1, 14, 79, pct);
    const p = kcalProposal({ points, blockStart: WEEK1, today: '2026-09-21' })!;
    expect(p.kind).toBe(kind);
    expect(p.decision).toBe(decision);
  });

  it('losing weight while exhausted asks to review load first; performance drop overrides a cut', () => {
    const losing = weightsLinear(WEEK1, 14, 79, -0.3);
    const p = kcalProposal({
      points: losing,
      blockStart: WEEK1,
      today: '2026-09-21',
      exhausted: true,
    })!;
    expect(p.kind).toBe('review');
    expect(p.decision).toBe('Revisa carga + energía antes de añadir más comida a ciegas.');

    const gaining = weightsLinear(WEEK1, 14, 79, 0.5);
    const q = kcalProposal({
      points: gaining,
      blockStart: WEEK1,
      today: '2026-09-21',
      performanceDrop: true,
    })!;
    expect(q.kind).toBe('review');
    expect(q.decision).toBe('Revisar carga, CH y recuperación antes de recortar');
    const r = kcalProposal({
      points: weightsLinear(WEEK1, 14, 79, 0),
      blockStart: WEEK1,
      today: '2026-09-21',
      performanceDrop: true,
    })!;
    expect(r.kind).toBe('increase');
  });

  it('reports insufficient data instead of guessing', () => {
    const p = kcalProposal({
      points: [{ date: '2026-09-10', value: 79 }],
      blockStart: WEEK1,
      today: '2026-09-21',
    })!;
    expect(p.kind).toBe('insufficient');
    expect(p.text).toContain('Pésate 5–7 días/sem');
  });

  it('names the nutrition phase of each week', () => {
    expect(nutritionPhaseFor(1)).toBe('sem 1–2: medir');
    expect(nutritionPhaseFor(7)).toContain('ajustar ±150–200');
    expect(nutritionPhaseFor(10)).toBe('sem 9–11: mantener');
    expect(nutritionPhaseFor(12)).toBe('sem 12: recalibrar');
    expect(nutritionPhaseFor(99)).toBe('sem 12: recalibrar');
  });
});
