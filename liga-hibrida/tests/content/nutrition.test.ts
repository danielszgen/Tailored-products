import { describe, expect, it } from 'vitest';
import {
  BIWEEKLY_ALGORITHM,
  DAILY_CHECKLIST,
  FUEL_DAY_TYPES,
  fuelDayTypeFor,
  fuelIntraByMinutes,
  MACROS,
  NUTRITION_PHASES,
  SNACK_TOOLKIT,
} from '@/domain/content/nutrition';
import { BACKPACK_ITEMS, MORNING_CHECK, NOT_NEEDED, RECOVERY_ORDER } from '@/domain/content/items';

describe('nutrition content (SPEC §6.9)', () => {
  it('keeps the literal biweekly algorithm decisions', () => {
    expect(BIWEEKLY_ALGORITHM.map((r) => r.decision)).toEqual([
      '+200 a +300 kcal/día sobre la media real',
      '+150 a +200 kcal/día',
      'Mantener (zona objetivo)',
      '−150 a −200 kcal/día',
      'Revisar carga, CH y recuperación antes de recortar',
    ]);
    expect(NUTRITION_PHASES).toHaveLength(5);
    expect(MACROS).toHaveLength(5);
  });

  it('has 6 fuel day types keyed by DayFuel', () => {
    expect(FUEL_DAY_TYPES).toHaveLength(6);
    expect(fuelDayTypeFor('alta')?.dayType).toBe('Pierna + natación suave');
    expect(fuelDayTypeFor('muy_alta')?.dayType).toBe('Trail / MTB largo');
    expect(fuelDayTypeFor('media_baja')?.dinnerPost).toBe('Medio, menos almidón');
    expect(fuelIntraByMinutes(45)).toContain('agua');
    expect(fuelIntraByMinutes(90)).toContain('30–60 g CH/h');
    expect(fuelIntraByMinutes(150)).toContain('60–90 g/h');
  });

  it('has the 5-tick daily checklist and 5 snacks', () => {
    expect(DAILY_CHECKLIST.map((c) => c.id)).toEqual([
      'proteina',
      'fruta',
      'verdura',
      'hidratar',
      'fuel',
    ]);
    expect(SNACK_TOOLKIT.items).toHaveLength(5);
  });
});

describe('Mochila and recovery (SPEC §6.8)', () => {
  it('has 11 objects with creatina as the only daily habit', () => {
    expect(BACKPACK_ITEMS).toHaveLength(11);
    expect(BACKPACK_ITEMS.filter((i) => i.daily).map((i) => i.id)).toEqual(['creatina']);
    expect(BACKPACK_ITEMS[0].rule).toBe('3–5 g/día, diaria, el momento no importa');
    expect(NOT_NEEDED).toHaveLength(5);
    expect(RECOVERY_ORDER[0]).toBe('sueño 8–8,5 h');
    expect(MORNING_CHECK).toHaveLength(5);
  });
});
