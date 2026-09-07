import { describe, expect, it } from 'vitest';
import { buildWeekPlan, classifyWeek } from '@/domain/content/week';
import { cutPlan, cutTriggerText, NO_DEBT_MESSAGE } from '@/domain/rules/minimum';
import { applyProposals } from '@/domain/rules/substitution';
import { makeCheckin } from '../fixtures/checkins';
import { WEEK1 } from '../fixtures/records';

const standard = buildWeekPlan({ weekStart: WEEK1, weekOfBlock: 1 });

describe('R9 · priorities A/B/C of the standard week', () => {
  it('classifies anchors, complements and extras', () => {
    const items = classifyWeek(standard.days).map((c) => `${c.day}${c.slot}:${c.priority}`);
    expect(items).toEqual([
      '0am:A',
      '0pm:B',
      '1am:A',
      '1pm:A',
      '2am:A',
      '2pm:B',
      '3am:A',
      '3pm:rest',
      '4am:A',
      '4pm:C',
      '5am:C',
      '5pm:rest',
      '6am:rest',
      '6pm:rest',
    ]);
  });
});

describe('R9 · minimum viable week and cut order (SPEC §7 R9)', () => {
  it('is not triggered by a normal week', () => {
    const plan = cutPlan({ plan: standard, today: WEEK1, checkins: [] });
    expect(plan.triggered).toBe(false);
    expect(plan.proposals).toEqual([]);
    expect(plan.message).toBe(NO_DEBT_MESSAGE);
  });

  it('3+ CARGADO/KO days → first remove C items (optional Z2 and Zona Salvaje)', () => {
    const checkins = [
      makeCheckin({ date: '2026-09-07', sleepHours: 7, energy: 3 }),
      makeCheckin({ date: '2026-09-08', sleepHours: 7, energy: 3 }),
      makeCheckin({ date: '2026-09-09', sleepHours: 6, energy: 2, legs: 2 }),
      makeCheckin({ date: '2026-09-10' }),
    ];
    expect(checkins.map((c) => c.status)).toEqual(['cargado', 'cargado', 'ko', 'ok']);
    const plan = cutPlan({ plan: standard, today: '2026-09-09', checkins });
    expect(plan.triggered).toBe(true);
    expect(plan.trigger).toBe('status');
    expect(plan.loadedDays).toBe(3);
    expect(plan.step).toBe(1);
    expect(plan.proposals.map((p) => p.removed)).toEqual([
      "Ruta bici Z2 40–60' · opcional",
      'Zona Salvaje',
    ]);
    expect(plan.proposals[0].detail).toContain(NO_DEBT_MESSAGE);
    expect(cutTriggerText('status', 3)).toContain('3 días CARGADO/KO');
  });

  it('only remaining days are cut, never adding sessions', () => {
    const checkins = ['2026-09-07', '2026-09-08', '2026-09-09'].map((date) =>
      makeCheckin({ date, sleepHours: 7, energy: 3 }),
    );
    const plan = cutPlan({ plan: standard, today: '2026-09-12', checkins });
    expect(plan.step).toBe(1);
    expect(plan.proposals.map((p) => p.removed)).toEqual(['Zona Salvaje']);
    expect(plan.proposals.every((p) => p.replacement?.kind === 'off')).toBe(true);
  });

  it('template Fatiga walks C → B → A 45′ → OFF step by step', () => {
    let plan = buildWeekPlan({ weekStart: WEEK1, weekOfBlock: 1, template: 'fatiga' });
    const step1 = cutPlan({ plan, today: WEEK1, checkins: [] });
    expect(step1.trigger).toBe('fatiga');
    expect(step1.step).toBe(1);
    expect(step1.proposals.map((p) => p.removed)).toEqual(["Ruta carrera Z2 40–55' · opcional"]);
    expect(cutTriggerText('fatiga', 0)).toContain('Fatiga');

    plan = applyProposals(plan, step1.proposals);
    const step3 = cutPlan({ plan, today: WEEK1, checkins: [] });
    expect(step3.step).toBe(3);
    expect(step3.proposals.map((p) => p.title)).toEqual([
      "Yunque · 60' → 45'",
      "Vértigo · 60' → 45'",
    ]);
    expect(step3.proposals[0].replacement).toEqual({ kind: 'gym', gymId: 'yunque', version: 45 });

    plan = applyProposals(plan, step3.proposals);
    expect(plan.days[1].am).toEqual({ kind: 'gym', gymId: 'yunque', version: 45 });
    const step4 = cutPlan({ plan, today: WEEK1, checkins: [] });
    expect(step4.step).toBe(4);
    expect(step4.proposals.every((p) => p.replacement?.kind === 'off')).toBe(true);
    expect(step4.proposals.map((p) => p.removed)).toEqual([
      "Cantera · 45'",
      "Yunque · 45'",
      'Yoga / movilidad',
      "Resorte · 45'",
      "Vértigo · 45'",
    ]);

    plan = applyProposals(plan, step4.proposals);
    const done = cutPlan({ plan, today: WEEK1, checkins: [] });
    expect(done.triggered).toBe(true);
    expect(done.step).toBeNull();
    expect(done.proposals).toEqual([]);
  });

  it('template Viaje is a trigger too', () => {
    const plan = buildWeekPlan({ weekStart: WEEK1, weekOfBlock: 1, template: 'viaje' });
    const cut = cutPlan({ plan, today: WEEK1, checkins: [] });
    expect(cut.trigger).toBe('viaje');
    expect(cut.step).toBe(1);
    expect(cutTriggerText('viaje', 0)).toContain('Viaje');
  });
});
