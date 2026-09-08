import { describe, expect, it } from 'vitest';
import { parseExport } from '@/data/import';
import { evaluateSymptoms } from '@/domain/rules/symptoms';
import { kcalProposal } from '@/domain/rules/weight';
import { buildOchoSemanas, ochoSemanasWeight } from './ochoSemanas';

describe('fixture ocho_semanas (SPEC Apéndice B)', () => {
  const file = buildOchoSemanas();
  const { tables } = file;

  it('is a valid export file with the counts of Apéndice B and matches ocho_semanas.json', async () => {
    expect(() => parseExport(file)).not.toThrow();
    expect(tables.profile[0].startWeightKg).toBe(79);
    expect(tables.checkins).toHaveLength(56);
    expect(tables.sessions).toHaveLength(32);
    for (const gym of ['cantera', 'yunque', 'resorte', 'vertigo']) {
      expect(tables.sessions.filter((s) => s.gymId === gym)).toHaveLength(8);
    }
    expect(tables.routes).toHaveLength(14);
    expect(
      tables.routes.every((r) => r.countsAs === 'z2' && r.minutes >= 40 && r.minutes <= 60),
    ).toBe(true);
    expect(tables.wild.map((w) => `${w.kind}:${w.intensity}`).sort()).toEqual([
      'boulder:moderada',
      'mtb:dura',
      'mtb:dura',
      'surf:facil',
      'surf:moderada',
      'trail:moderada',
    ]);
    expect(tables.tests.map((t) => t.weekOfBlock)).toEqual([0, 4, 8]);
    await expect(JSON.stringify(file, null, 2) + '\n').toMatchFileSnapshot('./ocho_semanas.json');
  });

  it('progresses bench press 70 → 77,5 kg and Bulgarian 16 → 22 kg per hand', () => {
    const load = (gym: string, id: string) =>
      tables.sessions
        .filter((s) => s.gymId === gym)
        .map((s) => s.exercises.find((e) => e.exerciseId === id)!.sets[0].loadKg);
    expect(load('yunque', 'bench_press')).toEqual([70, 70, 72.5, 65, 72.5, 75, 77.5, 70]);
    expect(load('cantera', 'bulgarian_split_squat')).toEqual([16, 18, 18, 16, 20, 20, 22, 20]);
  });

  it('sleeps 7–8,5 h and has the wrist streak 3 → 4 → 5 in week 6 (advisory in week 6)', () => {
    expect(tables.checkins.every((c) => c.sleepHours >= 7 && c.sleepHours <= 8.5)).toBe(true);
    const week6 = tables.checkins.filter((c) => c.date >= '2026-10-12' && c.date <= '2026-10-18');
    expect(week6.map((c) => c.wrist)).toEqual([1, 3, 4, 5, 5, 3, 2]);
    const report = evaluateSymptoms({
      checkins: tables.checkins,
      sessions: tables.sessions,
      today: '2026-10-15',
    });
    expect(report.wrist.rising).toBe(true);
    expect(report.wrist.ko).toBe(true);
    expect(report.advisories.map((a) => a.id)).toEqual(['r8_wrist_ko', 'r8_wrist_rising']);
  });

  it('weights trend +0,18 %/sem: "+150 a +200 kcal" in week 3 and "Mantener" in week 5', () => {
    const points = tables.checkins.map((c) => ({ date: c.date, value: c.weightKg! }));
    expect(ochoSemanasWeight(0)).toBe(79);
    const week3 = kcalProposal({ points, blockStart: '2026-09-07', today: '2026-09-21' })!;
    expect(week3.decision).toBe('+150 a +200 kcal/día');
    const week5 = kcalProposal({ points, blockStart: '2026-09-07', today: '2026-10-05' })!;
    expect(week5.decision).toBe('Mantener (zona objetivo)');
    expect(week5.trend.trendPct).toBeGreaterThan(0.15);
    expect(week5.trend.trendPct).toBeLessThan(0.21);
    expect(tables.adjustments.map((a) => a.id)).toEqual(['kcal_2026-09-21', 'kcal_2026-10-05']);
  });
});
