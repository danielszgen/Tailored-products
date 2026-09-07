import { describe, expect, it } from 'vitest';
import { buildWeekPlan } from '@/domain/content/week';
import {
  applyProposals,
  proposeSubstitutions,
  weekendLoadAdvisory,
} from '@/domain/rules/substitution';
import { makeWild, WEEK1 } from '../fixtures/records';

const plan = buildWeekPlan({ weekStart: WEEK1, weekOfBlock: 1 });

describe('R5 · substitutions (SPEC §7 R5, matrix §6.7)', () => {
  it("MTB 120' dura on Saturday → remove Friday Z2 (not passed), Sunday recovery, Monday warning", () => {
    const wild = makeWild('2026-09-12', 'mtb', 120, 'dura');
    const proposals = proposeSubstitutions({ wild, plan, today: '2026-09-10' });
    const ids = proposals.map((p) => p.id);
    expect(ids).toEqual(['friday_pm', 'sunday_recovery', 'monday_lower', 'reduce_running']);

    const friday = proposals[0];
    expect(friday).toMatchObject({
      kind: 'remove',
      day: 4,
      slot: 'pm',
      date: '2026-09-11',
      removed: "Ruta bici Z2 40–60' · opcional",
      replacement: { kind: 'off' },
    });
    expect(friday.detail).toContain('El sábado manda');
    expect(proposals[1]).toMatchObject({ day: 6, slot: 'am', date: '2026-09-13' });
    expect(proposals[2]).toMatchObject({ kind: 'warn', date: '2026-09-14' });
    expect(proposals[2].advisory?.message).toContain('Lower A del lunes');
    expect(proposals[3].advisory?.message).toContain('reduce carrera');
    // Lower sessions are never touched.
    expect(
      proposals.every(
        (p) => p.replacement === undefined || plan.days[p.day][p.slot!]?.kind !== 'gym',
      ),
    ).toBe(true);
  });

  it('accepting the proposals changes the WeekPlan and records the substitutions', () => {
    const wild = makeWild('2026-09-12', 'mtb', 120, 'dura');
    const proposals = proposeSubstitutions({ wild, plan, today: '2026-09-10' });
    const next = applyProposals(plan, proposals);
    expect(next.days[4].pm).toEqual({ kind: 'off' });
    expect(next.days[4].am).toEqual(plan.days[4].am);
    expect(next.days[4].fuel).toBe('media_alta');
    expect(next.days[6].am).toEqual({ kind: 'off' });
    expect(next.days[6].fuel).toBe('media_baja');
    expect(next.substitutions).toEqual([
      {
        date: '2026-09-11',
        removed: "Ruta bici Z2 40–60' · opcional",
        reason: proposals[0].detail,
      },
      { date: '2026-09-13', removed: 'Yoga / movilidad', reason: proposals[1].detail },
    ]);
    // Original untouched.
    expect(plan.days[4].pm?.kind).toBe('route');
    expect(plan.substitutions).toEqual([]);
    // Rejecting everything changes nothing.
    expect(applyProposals(plan, [])).toEqual(plan);
  });

  it('does not propose removing a Friday Z2 that already passed', () => {
    const wild = makeWild('2026-09-12', 'mtb', 120, 'dura');
    const ids = proposeSubstitutions({ wild, plan, today: '2026-09-12' }).map((p) => p.id);
    expect(ids).toEqual(['sunday_recovery', 'monday_lower', 'reduce_running']);
  });

  it('an adventure on another day frees the planned Zona Salvaje slot', () => {
    const wild = makeWild('2026-09-09', 'trail', 75, 'moderada');
    const proposals = proposeSubstitutions({ wild, plan, today: '2026-09-09' });
    expect(proposals.map((p) => p.id)).toEqual(['wild_slot_5']);
    expect(proposals[0]).toMatchObject({
      kind: 'convert',
      day: 5,
      replacement: { kind: 'regen', what: 'yoga' },
    });
    const next = applyProposals(plan, proposals);
    expect(next.days[5].am).toEqual({ kind: 'regen', what: 'yoga' });
    expect(next.days[5].fuel).toBe('media');
  });

  it('trail can replace remaining running Z2; surf replaces swimming; skate the Wednesday sport', () => {
    const trail = proposeSubstitutions({
      wild: makeWild('2026-09-07', 'trail', 70, 'moderada'),
      plan,
      today: '2026-09-07',
    });
    expect(trail.map((p) => p.id)).toEqual(['wild_slot_5', 'matrix_1_pm']);
    expect(trail[1].removed).toBe("Ruta carrera Z2 45–55'");

    const surf = proposeSubstitutions({
      wild: makeWild('2026-09-12', 'surf', 90, 'moderada'),
      plan,
      today: '2026-09-07',
    });
    expect(surf.map((p) => p.id)).toEqual(['matrix_0_pm']);
    expect(surf[0].removed).toBe('Natación suave');

    const skate = proposeSubstitutions({
      wild: makeWild('2026-09-12', 'skate', 60, 'facil'),
      plan,
      today: '2026-09-07',
    });
    expect(skate.map((p) => p.id)).toEqual(['friday_pm', 'matrix_2_pm']);
    expect(skate[1]).toMatchObject({
      kind: 'convert',
      replacement: { kind: 'regen', what: 'yoga' },
    });
  });

  it('hard bouldering converts the Wednesday climb and notes Vértigo', () => {
    const wild = makeWild('2026-09-12', 'boulder', 90, 'dura');
    const proposals = proposeSubstitutions({ wild, plan, today: '2026-09-07' });
    expect(proposals.map((p) => p.id)).toEqual([
      'friday_pm',
      'sunday_recovery',
      'matrix_2_pm',
      'vertigo_pull_4',
      'monday_lower',
    ]);
    // A boulder session on the Wednesday itself fulfils the planned sport slot: nothing to convert.
    expect(
      proposeSubstitutions({
        wild: makeWild('2026-09-09', 'boulder', 60, 'moderada'),
        plan,
        today: '2026-09-07',
      }).map((p) => p.id),
    ).toEqual(['wild_slot_5']);
    const next = applyProposals(plan, proposals);
    expect(next.days[4].am).toEqual({
      kind: 'gym',
      gymId: 'vertigo',
      version: 60,
      note: 'Reduce tirón/antebrazo del gym (escalada dura esta semana)',
    });
    expect(next.days[2].pm).toEqual({ kind: 'regen', what: 'yoga' });
    // Notes and warnings are not substitutions.
    expect(next.substitutions).toHaveLength(3);
  });

  it('kinds without a matrix row ask the coach; other weeks are ignored', () => {
    const other = proposeSubstitutions({
      wild: makeWild('2026-09-12', 'other', 60, 'facil'),
      plan,
      today: '2026-09-07',
    });
    expect(other).toHaveLength(1);
    expect(other[0]).toMatchObject({ id: 'no_matrix_row', kind: 'warn' });
    expect(other[0].advisory?.message).toContain('Consulta al entrenador');
    expect(
      proposeSubstitutions({
        wild: makeWild('2026-09-19', 'mtb', 120, 'dura'),
        plan,
        today: WEEK1,
      }),
    ).toEqual([]);
  });

  it('weekendLoadAdvisory warns on Monday after a hard ≥ 90′ weekend adventure', () => {
    const logs = [makeWild('2026-09-12', 'mtb', 120, 'dura')];
    expect(weekendLoadAdvisory(logs, '2026-09-14')?.message).toContain('Lower A del lunes');
    expect(weekendLoadAdvisory(logs, '2026-09-15')).toBeNull();
    expect(
      weekendLoadAdvisory([makeWild('2026-09-12', 'mtb', 120, 'facil')], '2026-09-14'),
    ).toBeNull();
    expect(
      weekendLoadAdvisory([makeWild('2026-09-12', 'mtb', 60, 'dura')], '2026-09-14'),
    ).toBeNull();
    expect(weekendLoadAdvisory([], '2026-09-14')).toBeNull();
  });
});
