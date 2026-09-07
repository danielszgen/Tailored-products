import { describe, expect, it } from 'vitest';
import {
  BASE_WEEK,
  BASE_WEEK_TABLE,
  buildWeekPlan,
  DAY_FUEL_LABELS,
  plannedItemKindLabel,
  plannedItemLabel,
  WEEK_TEMPLATES,
} from '@/domain/content/week';
import type { DayIndex, PlannedItem } from '@/domain/types';

const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

describe('base week (SPEC §6.4)', () => {
  it('builds week 1 from the standard template', () => {
    const plan = buildWeekPlan({ weekStart: '2026-09-07', weekOfBlock: 1 });
    expect(plan.template).toBe('estandar');
    expect(plan.wave).toBe(1);
    expect(plan.substitutions).toEqual([]);
    expect(Object.keys(plan.days)).toHaveLength(7);
    expect(plan.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 60 });
    expect(plan.days[0].pm).toEqual({ kind: 'regen', what: 'natacion_suave' });
    expect(plan.days[1].am).toEqual({ kind: 'gym', gymId: 'yunque', version: 60 });
    expect(plan.days[1].pm).toEqual({ kind: 'route', routeKind: 'run', minutes: [45, 55] });
    expect(plan.days[2].pm).toMatchObject({ kind: 'sport', sport: 'escalada', rpeMax: 6 });
    expect(plan.days[3].am).toEqual({ kind: 'gym', gymId: 'resorte', version: 60 });
    expect(plan.days[4].am).toEqual({ kind: 'gym', gymId: 'vertigo', version: 60 });
    expect(plan.days[4].pm).toMatchObject({ kind: 'route', routeKind: 'bike', optional: true });
    expect(plan.days[5].am).toEqual({ kind: 'wild' });
    expect(plan.days[5].fuel).toBe('muy_alta');
    expect(plan.days[6].fuel).toBe('media_baja');
    expect(plan.days[6].pm).toEqual({ kind: 'off' });
  });

  it('deep-copies the template so plans can be edited safely', () => {
    const plan = buildWeekPlan({ weekStart: '2026-09-14', weekOfBlock: 2 });
    plan.days[0].am = { kind: 'off' };
    expect(BASE_WEEK.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 60 });
    expect(WEEK_TEMPLATES.estandar.days[0].am).toEqual({
      kind: 'gym',
      gymId: 'cantera',
      version: 60,
    });
  });

  it('maps deload and eval waves', () => {
    expect(buildWeekPlan({ weekStart: '2026-09-28', weekOfBlock: 4 }).wave).toBe('deload');
    expect(buildWeekPlan({ weekStart: '2026-11-23', weekOfBlock: 12 }).wave).toBe('eval');
  });

  it('every template has 7 days with a fuel level', () => {
    for (const template of Object.values(WEEK_TEMPLATES)) {
      for (const d of DAYS) {
        expect(template.days[d]).toBeDefined();
        expect(DAY_FUEL_LABELS[template.days[d].fuel]).toBeTruthy();
      }
    }
    expect(WEEK_TEMPLATES.montana.days[4].pm).toBeUndefined();
    expect(WEEK_TEMPLATES.montana.days[6].am).toEqual({ kind: 'off' });
    expect(WEEK_TEMPLATES.surf.days[5].am).toEqual({ kind: 'wild', wildKind: 'surf' });
    expect(WEEK_TEMPLATES.fatiga.days[0].am).toEqual({
      kind: 'gym',
      gymId: 'cantera',
      version: 45,
    });
    expect(WEEK_TEMPLATES.viaje.days[0].am?.kind).toBe('note');
  });

  it('keeps the literal document table', () => {
    expect(BASE_WEEK_TABLE).toHaveLength(7);
    expect(BASE_WEEK_TABLE[0]).toMatchObject({ dayName: 'Lunes', fuel: 'ALTA' });
    expect(BASE_WEEK_TABLE[1].fuel).toBe('MEDIA-ALTA (doble → ALTA)');
    expect(BASE_WEEK_TABLE[5].fuel).toBe("MUY ALTA si > 90'");
    expect(DAY_FUEL_LABELS).toEqual({
      muy_alta: 'MUY ALTA',
      alta: 'ALTA',
      media_alta: 'MEDIA-ALTA',
      media: 'MEDIA',
      media_baja: 'MEDIA-BAJA',
    });
  });

  it('labels every planned item kind in Spanish', () => {
    const items: PlannedItem[] = [
      { kind: 'gym', gymId: 'cantera', version: 60 },
      { kind: 'route', routeKind: 'run', minutes: [45, 55] },
      { kind: 'route', routeKind: 'bike', minutes: [40, 60], optional: true },
      { kind: 'wild' },
      { kind: 'wild', wildKind: 'surf' },
      { kind: 'regen', what: 'natacion_suave' },
      { kind: 'sport', sport: 'escalada', minutes: [45, 60], rpeMax: 6 },
      { kind: 'note', text: 'Full-body' },
      { kind: 'off' },
    ];
    expect(items.map(plannedItemLabel)).toEqual([
      "Cantera · 60'",
      "Ruta carrera Z2 45–55'",
      "Ruta bici Z2 40–60' · opcional",
      'Zona Salvaje',
      'Zona Salvaje · surf',
      'Natación suave',
      "Escalada técnica 45–60' · RPE ≤ 6",
      'Full-body',
      'OFF',
    ]);
    expect(items.map(plannedItemKindLabel)).toEqual([
      'Gimnasio',
      'Ruta',
      'Ruta',
      'Zona Salvaje',
      'Zona Salvaje',
      'Regen',
      'Deporte',
      'Nota',
      'OFF',
    ]);
  });
});
