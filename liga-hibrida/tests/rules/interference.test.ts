import { describe, expect, it } from 'vitest';
import {
  activityOf,
  activityOfGym,
  activityOfRoute,
  activityOfWild,
  evaluateDay,
  evaluatePair,
  needsConfirmation,
  type Activity,
} from '@/domain/rules/interference';

const lower: Activity = { kind: 'lower', gymId: 'cantera' };
const upper: Activity = { kind: 'upper', gymId: 'yunque' };
const runZ2: Activity = { kind: 'route', routeKind: 'run', effort: 'z2', minutes: 50 };
const runMedio: Activity = { kind: 'route', routeKind: 'run', effort: 'medio', minutes: 50 };
const runDuro: Activity = { kind: 'route', routeKind: 'run', effort: 'duro', minutes: 50 };
const swimZ2: Activity = { kind: 'route', routeKind: 'swim', effort: 'z2', minutes: 30 };
const swimSoft: Activity = { kind: 'regen', what: 'natacion_suave' };
const yoga: Activity = { kind: 'regen', what: 'yoga' };
const climbTech: Activity = { kind: 'sport', sport: 'escalada', hard: false };
const climbHard: Activity = { kind: 'sport', sport: 'escalada', hard: true };
const skateSoft: Activity = { kind: 'sport', sport: 'skate', hard: false };
const mtbHard: Activity = { kind: 'wild', wildKind: 'mtb', intensity: 'dura', minutes: 120 };
const mtbMod: Activity = { kind: 'wild', wildKind: 'mtb', intensity: 'moderada', minutes: 90 };
const trailLong: Activity = {
  kind: 'wild',
  wildKind: 'trail',
  intensity: 'moderada',
  minutes: 100,
};
const surfHard: Activity = { kind: 'wild', wildKind: 'surf', intensity: 'dura', minutes: 90 };
const surfEasy: Activity = { kind: 'wild', wildKind: 'surf', intensity: 'facil', minutes: 60 };

describe('R4 · same-day compatibility table (SPEC §6.7)', () => {
  it.each([
    [lower, swimSoft, 'verde', 'Lower AM + natación suave PM'],
    [upper, runZ2, 'verde', 'Upper AM + running Z2 PM'],
    [yoga, climbTech, 'verde', 'Yoga AM + escalada técnica PM'],
    [upper, swimZ2, 'verde', 'Upper + natación Z2'],
    [lower, runDuro, 'rojo', 'Lower AM + running intenso PM'],
    [lower, mtbHard, 'rojo', 'Lower + MTB fuerte'],
    [lower, trailLong, 'rojo', 'Trail largo + gimnasio de pierna'],
    [upper, climbHard, 'ambar', 'Escalada dura + upper pesado mismo día'],
    [skateSoft, runZ2, 'ambar', 'Skate suave + Z2'],
  ])('%o + %o → %s', (a, b, light, combo) => {
    const f = evaluatePair(a, b);
    expect(f?.light).toBe(light);
    expect(f?.combo).toBe(combo);
    // Symmetric.
    expect(evaluatePair(b, a)?.combo).toBe(combo);
  });

  it('covers the rule-based pairs outside the table', () => {
    expect(evaluatePair(lower, runMedio)?.light).toBe('ambar');
    expect(evaluatePair(lower, surfHard)?.light).toBe('ambar');
    expect(evaluatePair(lower, mtbMod)?.light).toBe('ambar');
    expect(evaluatePair(lower, skateSoft)?.light).toBe('ambar');
    expect(evaluatePair(mtbHard, surfHard)?.light).toBe('rojo');
    expect(evaluatePair(runDuro, { kind: 'off' })?.rule).toBe(5);
    expect(evaluatePair(upper, climbTech)?.light).toBe('verde');
    expect(evaluatePair(lower, surfEasy)).toBeNull();
    expect(evaluatePair(upper, yoga)).toBeNull();
    expect(evaluatePair(lower, { kind: 'wild', wildKind: 'skate', intensity: 'dura' })?.light).toBe(
      'rojo',
    );
  });
});

describe('R4 · day evaluation with 24 h protection', () => {
  it('running duro the day before Cantera → ROJO (acceptance)', () => {
    const e = evaluateDay({ today: [runDuro], tomorrow: [lower] });
    expect(e.light).toBe('rojo');
    expect(e.findings.some((f) => f.rule === 3)).toBe(true);
    expect(needsConfirmation(e)).toBe(true);
    expect(e.advisories[0]).toMatchObject({ level: 2, source: '04 §6.7 · R4' });
  });

  it('a medium effort before Lower is ÁMBAR, a hard adventure yesterday is ROJO', () => {
    expect(evaluateDay({ today: [runMedio], tomorrow: [lower] }).light).toBe('ambar');
    expect(evaluateDay({ today: [lower], yesterday: [mtbHard] }).light).toBe('rojo');
    expect(evaluateDay({ today: [lower], yesterday: [mtbMod] }).light).toBe('ambar');
    expect(evaluateDay({ today: [lower], yesterday: [runZ2] }).light).toBe('verde');
  });

  it('MTB duro sábado + trail largo domingo → ROJO; two hard adventures → ROJO', () => {
    const e = evaluateDay({ today: [trailLong], yesterday: [mtbHard] });
    expect(e.light).toBe('rojo');
    expect(e.findings[0].combo).toBe('MTB duro sábado + trail largo domingo');
    expect(evaluateDay({ today: [surfHard], yesterday: [surfHard] }).light).toBe('rojo');
  });

  it('a green double day has a verde finding and no advisories', () => {
    const e = evaluateDay({ today: [lower, swimSoft], tomorrow: [upper] });
    expect(e.light).toBe('verde');
    expect(e.findings).toHaveLength(1);
    expect(e.advisories).toEqual([]);
    expect(needsConfirmation(e)).toBe(false);
    expect(evaluateDay({ today: [] }).light).toBe('verde');
    expect(evaluateDay({ today: [{ kind: 'off' }] }).findings).toEqual([]);
  });

  it('sorts findings worst first', () => {
    const e = evaluateDay({ today: [lower, runDuro, swimSoft] });
    expect(e.findings.map((f) => f.light)).toEqual(['rojo', 'ambar', 'verde']);
  });
});

describe('R4 · activities from plan and logs', () => {
  it('maps planned items and logs', () => {
    expect(activityOf({ kind: 'gym', gymId: 'resorte', version: 60 })).toEqual({
      kind: 'lower',
      gymId: 'resorte',
    });
    expect(activityOf({ kind: 'gym', gymId: 'vertigo', version: 45 })).toEqual({
      kind: 'upper',
      gymId: 'vertigo',
    });
    expect(activityOf({ kind: 'route', routeKind: 'bike', minutes: [40, 60] })).toEqual({
      kind: 'route',
      routeKind: 'bike',
      effort: 'z2',
      minutes: 60,
    });
    expect(activityOf({ kind: 'wild', wildKind: 'surf' })).toEqual({
      kind: 'wild',
      wildKind: 'surf',
    });
    expect(activityOf({ kind: 'sport', sport: 'skate', minutes: [45, 60] })).toEqual({
      kind: 'sport',
      sport: 'skate',
      hard: false,
    });
    expect(activityOf({ kind: 'regen', what: 'paseo' })).toEqual({ kind: 'regen', what: 'paseo' });
    expect(activityOf({ kind: 'note', text: 'x' })).toEqual({ kind: 'off' });
    expect(activityOf({ kind: 'off' })).toEqual({ kind: 'off' });
    expect(activityOfRoute({ kind: 'run', countsAs: 'duro', minutes: 40 })).toEqual(
      runDuro && {
        kind: 'route',
        routeKind: 'run',
        effort: 'duro',
        minutes: 40,
      },
    );
    expect(activityOfWild({ kind: 'mtb', intensity: 'dura', minutes: 120 })).toEqual(mtbHard);
    expect(activityOfGym('cantera')).toEqual(lower);
    expect(activityOfGym('yunque')).toEqual(upper);
  });
});
