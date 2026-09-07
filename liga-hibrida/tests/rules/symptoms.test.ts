import { describe, expect, it } from 'vitest';
import { adjustSessionForStatus, computePv } from '@/domain/rules/pv';
import {
  barbellSquatTransition,
  evaluateSymptoms,
  isPersistent,
  isRisingSeries,
  recentPoints,
  symptomSeries,
} from '@/domain/rules/symptoms';
import { makeCheckin, wristHistory } from '../fixtures/checkins';
import { makeSession } from '../fixtures/records';

describe('R8 · symptoms (SPEC §7 R8)', () => {
  it('wrist 3, 4, 5 in three consecutive check-ins → level 1 warning, KO on supports, Vértigo omits handstand and dips (acceptance)', () => {
    const checkins = [
      makeCheckin({ date: '2026-09-07', wrist: 3 }),
      makeCheckin({ date: '2026-09-08', wrist: 4, history: wristHistory([3]) }),
      makeCheckin({ date: '2026-09-09', wrist: 5, history: wristHistory([3, 4]) }),
    ];
    const report = evaluateSymptoms({ checkins, sessions: [], today: '2026-09-09' });
    expect(report.wrist.rising).toBe(true);
    expect(report.wrist.ko).toBe(true);
    expect(report.wrist.latest).toBe(5);
    expect(report.adductor.advisories).toEqual([]);
    const messages = report.advisories.map((a) => a.message);
    expect(report.advisories.every((a) => a.level === 1)).toBe(true);
    expect(messages).toContain('Muñeca 5/10 (≥ 5): KO en apoyos.');
    expect(
      messages.some((m) =>
        m.includes('subiendo 3 registros seguidos (3 → 4 → 5): reduce exposición'),
      ),
    ).toBe(true);

    // R1 agrees: status KO by wrist; Vértigo omits the handstand block and weighted dips.
    const pv = computePv(
      { sleepHours: 8, energy: 5, legs: 5, wrist: 5, adductor: 0 },
      wristHistory([3, 4]),
    );
    expect(pv.status).toBe('ko');
    expect(pv.koSource).toBe('wrist');
    const adj = adjustSessionForStatus({ status: 'ko', koSource: 'wrist', gymId: 'vertigo' });
    expect(adj.omitExerciseIds).toEqual(['weighted_dip']);
    expect(adj.omitWarmupTags).toEqual(['handstand', 'wrist_support']);
  });

  it('builds the series from check-ins and sessions in order', () => {
    const checkins = [
      makeCheckin({ date: '2026-09-08', adductor: 1 }),
      makeCheckin({ date: '2026-09-07', adductor: 2 }),
    ];
    const sessions = [
      makeSession('cantera', '2026-09-07', { adductorDuring: 3, adductorAfter: 4, wristDuring: 1 }),
      makeSession('yunque', '2026-09-08', { completed: false, adductorDuring: 9 }),
    ];
    expect(symptomSeries(checkins, sessions, 'adductor')).toEqual([
      { date: '2026-09-07', value: 2, source: 'checkin' },
      { date: '2026-09-07', value: 3, source: 'session' },
      { date: '2026-09-07', value: 4, source: 'after' },
      { date: '2026-09-08', value: 1, source: 'checkin' },
    ]);
    expect(symptomSeries(checkins, sessions, 'wrist').map((p) => p.value)).toEqual([0, 1, 0]);
  });

  it('rising needs three strictly increasing records; low values also count (see PREGUNTAS)', () => {
    expect(isRisingSeries([3, 4, 5])).toBe(true);
    expect(isRisingSeries([1, 3, 4, 5])).toBe(true);
    expect(isRisingSeries([0, 1, 2])).toBe(true);
    expect(isRisingSeries([3, 3, 5])).toBe(false);
    expect(isRisingSeries([5, 4])).toBe(false);
  });

  it('persistent ≥ 4 for 7 days → sticky level 1 professional-assessment advisory', () => {
    const checkins = Array.from({ length: 7 }, (_, i) =>
      makeCheckin({ date: `2026-09-0${i + 1}`, adductor: 4 }),
    );
    const report = evaluateSymptoms({ checkins, sessions: [], today: '2026-09-07' });
    expect(report.adductor.persistent).toBe(true);
    expect(report.adductor.rising).toBe(false);
    const sticky = report.advisories.find((a) => a.sticky);
    expect(sticky?.message).toContain('valoración por fisioterapeuta o médico deportivo');
    expect(sticky?.id).toBe('r8_adductor_persistent_2026-09-07');
    expect(report.wrist.persistent).toBe(false);

    // Fewer than 3 records or one record below 4 is not persistent.
    expect(isPersistent(report.adductor.points.slice(0, 2), '2026-09-07')).toBe(false);
    const dip = [...report.adductor.points];
    dip[3] = { ...dip[3], value: 2 };
    expect(isPersistent(dip, '2026-09-07')).toBe(false);
    expect(
      evaluateSymptoms({ checkins: [], sessions: [], today: '2026-09-07' }).advisories,
    ).toEqual([]);
  });

  it('ignores records after today and keeps 28 days for the chart', () => {
    const checkins = [
      makeCheckin({ date: '2026-08-01', wrist: 6 }),
      makeCheckin({ date: '2026-09-01', wrist: 1 }),
      makeCheckin({ date: '2026-09-10', wrist: 7 }),
    ];
    const report = evaluateSymptoms({ checkins, sessions: [], today: '2026-09-05' });
    expect(report.wrist.latest).toBe(1);
    expect(recentPoints(report.wrist.points, '2026-09-05').map((p) => p.date)).toEqual([
      '2026-09-01',
    ]);
  });

  it('offers the barbell squat transition after 3 weeks of Cantera with adductorAfter ≤ 2', () => {
    const good = [
      makeSession('cantera', '2026-09-07', { adductorAfter: 1 }),
      makeSession('cantera', '2026-09-14', { adductorAfter: 2 }),
      makeSession('cantera', '2026-09-21', { adductorAfter: 0 }),
      makeSession('resorte', '2026-09-24', { adductorAfter: 5 }),
    ];
    const offer = barbellSquatTransition(good, '2026-09-27');
    expect(offer.offer).toBe(true);
    expect(offer.weeks).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
    expect(offer.reason).toContain('high-bar squat');

    expect(barbellSquatTransition(good.slice(0, 2), '2026-09-27').offer).toBe(false);
    const missing = [...good, makeSession('cantera', '2026-09-28', { id: 'x' })];
    expect(barbellSquatTransition(missing, '2026-09-30').reason).toContain('Falta el aductor');
    const bad = [...good, makeSession('cantera', '2026-09-28', { id: 'y', adductorAfter: 3 })];
    expect(barbellSquatTransition(bad, '2026-09-30').offer).toBe(false);
    // Only completed sessions up to today count.
    expect(barbellSquatTransition(good, '2026-09-10').weeks).toEqual(['2026-09-07']);
  });
});
