import { describe, expect, it } from 'vitest';
import {
  AEROBIC_PROGRESSION,
  aerobicRowForWave,
  BLOCK_END,
  BLOCK_PROGRESSION,
  blockProgressionForWeek,
  blockWeeks,
  DEFAULT_BLOCK_START,
  HORIZONS,
  waveForWeek,
  waveLabel,
} from '@/domain/content/block';
import { dayIndexOf } from '@/lib/date';

describe('block calendar (SPEC §6.3, §6.5, §6.7, §7 R3)', () => {
  it('maps weeks to waves', () => {
    const expected = [1, 1, 1, 'deload', 2, 2, 2, 'deload', 3, 3, 3, 'eval'];
    for (let w = 1; w <= 12; w++) expect(waveForWeek(w)).toBe(expected[w - 1]);
    expect(waveForWeek(0)).toBe(1);
    expect(waveForWeek(13)).toBe('eval');
    expect(waveLabel('deload')).toBe('Descarga');
    expect(waveLabel('eval')).toBe('Final de Liga');
    expect(waveLabel(2)).toBe('Ola 2');
  });

  it('starts on Monday 7 Sep 2026 and ends on 29 Nov 2026', () => {
    expect(dayIndexOf(DEFAULT_BLOCK_START)).toBe(0);
    const weeks = blockWeeks();
    expect(weeks).toHaveLength(12);
    expect(weeks[0].start).toBe('2026-09-07');
    expect(weeks[0].end).toBe('2026-09-13');
    expect(weeks[3].isDeload).toBe(true);
    expect(weeks[7].isDeload).toBe(true);
    expect(weeks.filter((w) => w.isTest).map((w) => w.weekOfBlock)).toEqual([4, 8, 12]);
    expect(weeks[11].end).toBe(BLOCK_END);
    expect(weeks[11].label).toBe('Final de Liga');
  });

  it('keeps the progression tables', () => {
    expect(BLOCK_PROGRESSION).toHaveLength(6);
    expect(blockProgressionForWeek(1).mainLifts).toBe('RIR 3→2, parte baja del rango');
    expect(blockProgressionForWeek(4).mainLifts).toBe('−30 a −40 % series, RIR 4');
    expect(blockProgressionForWeek(9).objective).toBe('Consolidación');
    expect(blockProgressionForWeek(12).feel).toBe('Medir');
    expect(AEROBIC_PROGRESSION).toHaveLength(6);
    expect(aerobicRowForWave('deload').z2).toContain('−25–35 %');
    expect(aerobicRowForWave(1).z2).toBe("2× Z2 40–55'");
    expect(aerobicRowForWave('eval').z2).toContain('test submáximo');
  });

  it('keeps the horizons', () => {
    expect(HORIZONS.map((h) => h.date)).toEqual([
      '2026-11-29',
      '2027-03-06',
      '2027-09-06',
      '2029-09-06',
    ]);
  });
});
