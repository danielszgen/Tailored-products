import { describe, expect, it } from 'vitest';
import { WEEK_TEMPLATES } from '@/domain/content/week';
import { dayFuel, DOUBLE_SESSION_NOTE, fuelGuide, UPPER_DOUBLE_NOTE } from '@/domain/rules/fuel';
import type { PlannedItem } from '@/domain/types';

const cantera: PlannedItem = { kind: 'gym', gymId: 'cantera', version: 60 };
const yunque: PlannedItem = { kind: 'gym', gymId: 'yunque', version: 60 };
const swim: PlannedItem = { kind: 'regen', what: 'natacion_suave' };
const run: PlannedItem = { kind: 'route', routeKind: 'run', minutes: [45, 55] };
const yoga: PlannedItem = { kind: 'regen', what: 'yoga' };
const wild: PlannedItem = { kind: 'wild' };

describe('R6 · Combustible (SPEC §7 R6, document 03)', () => {
  it('Cantera AM + natación PM → ALTA with the Cantera pre/post texts (acceptance)', () => {
    const g = fuelGuide({ am: cantera, pm: swim });
    expect(g.fuel).toBe('alta');
    expect(g.label).toBe('ALTA');
    expect(g.dayType?.dayType).toBe('Pierna + natación suave');
    expect(g.gymId).toBe('cantera');
    expect(g.pre).toContain('30–40 g proteína + 80–120 g CH');
    expect(g.post).toContain('30–40 g prot + 80–120 g CH');
    expect(g.intra).toBeUndefined();
  });

  it('Upper + Z2 is MEDIA-ALTA planned and ALTA once the double is done', () => {
    const planned = fuelGuide({ am: yunque, pm: run });
    expect(planned.fuel).toBe('media_alta');
    expect(planned.notes).toContain(UPPER_DOUBLE_NOTE);
    expect(planned.notes).toContain(DOUBLE_SESSION_NOTE);
    expect(planned.intra).toBe("< 60' fácil → agua.");
    expect(dayFuel({ am: yunque, pm: run }, { doubleDone: true })).toBe('alta');
    expect(fuelGuide({ am: run, pm: yunque }).dayType?.dayType).toBe('AM Z2 + PM fuerza');
    expect(dayFuel({ am: run, pm: { kind: 'sport', sport: 'escalada', minutes: [45, 60] } })).toBe(
      'alta',
    );
  });

  it('Zona Salvaje ≥ 90′ is MUY ALTA; shorter adventures are ALTA with a note', () => {
    const long = fuelGuide({ am: wild, pm: { kind: 'off' } }, { wildMinutes: 120 });
    expect(long.fuel).toBe('muy_alta');
    expect(long.dayType?.dayType).toBe('Trail / MTB largo');
    expect(long.intra).toBe("60–120' → 30–60 g CH/h.");
    expect(fuelGuide({ am: wild }).fuel).toBe('muy_alta');
    const short = fuelGuide({ am: wild }, { wildMinutes: 60 });
    expect(short.fuel).toBe('alta');
    expect(short.notes[0]).toContain("Zona Salvaje < 90'");
    expect(fuelGuide({ am: wild }, { wildMinutes: 150 }).intra).toContain('60–90 g/h');
  });

  it('single sessions: Upper → MEDIA-ALTA, yoga → MEDIA, route → MEDIA (note), rest → MEDIA-BAJA', () => {
    expect(dayFuel({ am: yunque })).toBe('media_alta');
    expect(dayFuel({ am: yunque, pm: yoga })).toBe('media_alta');
    expect(dayFuel({ am: yoga })).toBe('media');
    expect(fuelGuide({ am: yoga }).dayType?.dayType).toBe('Yoga / movilidad');
    const route = fuelGuide({ am: run }, { routeMinutes: 70 });
    expect(route.fuel).toBe('media');
    expect(route.notes[0]).toContain('se asume MEDIA');
    expect(route.intra).toBe("60–120' → 30–60 g CH/h.");
    expect(fuelGuide({ am: { kind: 'note', text: 'Full-body' } }).notes[0]).toContain(
      'consulta al entrenador',
    );
    expect(dayFuel({ am: { kind: 'off' } })).toBe('media_baja');
    expect(dayFuel({})).toBe('media_baja');
    expect(dayFuel({ am: { kind: 'regen', what: 'paseo' } })).toBe('media_baja');
    expect(dayFuel({ am: cantera, pm: run })).toBe('alta');
  });

  it('reproduces the standard week Monday–Saturday', () => {
    const days = WEEK_TEMPLATES.estandar.days;
    for (const d of [0, 1, 2, 3, 4, 5] as const) {
      expect(dayFuel(days[d])).toBe(days[d].fuel);
    }
  });
});
