import { describe, expect, it } from 'vitest';
import {
  classifyRoute,
  COMPATIBILITY_TABLE,
  INTERFERENCE_RULES,
  LIVE_WEEK_SCENARIOS,
  SUBSTITUTION_MATRIX,
} from '@/domain/content/routes';
import { LEAGUE_TEST_AREAS, MEDALS, TRAINER_LEVELS, trainerLevelFor } from '@/domain/content/tests';
import {
  WRIST_MICRODOSE,
  ADDUCTOR_MICRODOSE,
  WEEKLY_MOBILITY_MINIMUM,
} from '@/domain/content/regen';
import { FORMS, FORM_ORDER } from '@/domain/content/phases';
import { GOLDEN_RULES, HIERARCHY, hierarchyName } from '@/domain/content/constitution';
import { SMART_OBJECTIVES, STATS } from '@/domain/content/smart';
import * as content from '@/domain/content';

describe('Rutas / Zona Salvaje tables (SPEC §6.7)', () => {
  it('has the 7 interference rules and the 10-row traffic light', () => {
    expect(INTERFERENCE_RULES).toHaveLength(7);
    expect(INTERFERENCE_RULES[3].name).toBe('El sábado manda');
    expect(COMPATIBILITY_TABLE).toHaveLength(10);
    const count = (light: string) => COMPATIBILITY_TABLE.filter((r) => r.light === light).length;
    expect([count('verde'), count('ambar'), count('rojo')]).toEqual([4, 2, 4]);
    expect(SUBSTITUTION_MATRIX).toHaveLength(7);
    expect(LIVE_WEEK_SCENARIOS).toHaveLength(5);
  });

  it('classifies routes by RPE', () => {
    expect(classifyRoute(6)).toBe('z2');
    expect(classifyRoute(7)).toBe('medio');
    expect(classifyRoute(8)).toBe('duro');
    expect(classifyRoute(10)).toBe('duro');
  });
});

describe('League tests, medals, trainer level (SPEC §6.10)', () => {
  it('has 6 areas and 4 medals in gym order', () => {
    expect(LEAGUE_TEST_AREAS).toHaveLength(6);
    expect(MEDALS.map((m) => m.id)).toEqual(['cantera', 'yunque', 'resorte', 'vertigo']);
    expect(MEDALS[3].smart).toEqual([7, 8]);
  });

  it('maps adherence to trainer levels', () => {
    expect(TRAINER_LEVELS).toHaveLength(3);
    expect(trainerLevelFor(85).id).toBe('liga');
    expect(trainerLevelFor(84).id).toBe('entrenador');
    expect(trainerLevelFor(70).id).toBe('entrenador');
    expect(trainerLevelFor(69).id).toBe('aprendiz');
  });
});

describe('microdose, phases, constitution, stats', () => {
  it('keeps the wrist microdose blocks and weekly minimum', () => {
    expect(WRIST_MICRODOSE.blocks).toHaveLength(4);
    expect(WRIST_MICRODOSE.minutes).toEqual([8, 12]);
    expect(ADDUCTOR_MICRODOSE.exercises).toHaveLength(4);
    expect(WEEKLY_MOBILITY_MINIMUM).toHaveLength(4);
  });

  it('has four forms and the hierarchy', () => {
    expect(FORM_ORDER).toEqual([1, 2, 3, 4]);
    expect(FORMS[1].fullName).toBe('Forma I · Base');
    expect(HIERARCHY).toHaveLength(5);
    expect(hierarchyName(1)).toBe('Salud / técnica');
    expect(GOLDEN_RULES).toHaveLength(8);
    expect(STATS.map((s) => s.key)).toEqual(['masa', 'fuerza', 'motor', 'control', 'aventura']);
    expect(SMART_OBJECTIVES).toHaveLength(10);
  });

  it('exposes everything through the barrel', () => {
    expect(content.GYMS.cantera.name).toBe('Cantera');
    expect(content.BASE_WEEK.id).toBe('estandar');
    expect(content.MEDALS).toHaveLength(4);
  });
});
