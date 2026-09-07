import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  dayIndexOf,
  lastNDates,
  weekDates,
  weekOfBlock,
  weekStartOf,
} from '@/lib/date';

describe('date helpers (weeks start on Monday, SPEC D13)', () => {
  it('2026-09-07 is a Monday and starts week 1 of the block', () => {
    expect(dayIndexOf('2026-09-07')).toBe(0);
    expect(weekStartOf('2026-09-07')).toBe('2026-09-07');
    expect(weekOfBlock('2026-09-07', '2026-09-07')).toBe(1);
  });

  it('maps Sunday to index 6 and keeps it in the same week', () => {
    expect(dayIndexOf('2026-09-13')).toBe(6);
    expect(weekStartOf('2026-09-13')).toBe('2026-09-07');
    expect(weekOfBlock('2026-09-13', '2026-09-07')).toBe(1);
  });

  it('week 4 and week 12 land on the expected Mondays (block ends 29 nov 2026)', () => {
    expect(weekOfBlock('2026-09-28', '2026-09-07')).toBe(4);
    expect(weekOfBlock('2026-11-23', '2026-09-07')).toBe(12);
    expect(weekOfBlock('2026-11-29', '2026-09-07')).toBe(12);
    expect(weekOfBlock('2026-11-30', '2026-09-07')).toBe(13);
  });

  it('returns weeks before the block as < 1', () => {
    expect(weekOfBlock('2026-09-06', '2026-09-07')).toBe(0);
  });

  it('builds Monday…Sunday date lists', () => {
    expect(weekDates('2026-09-09')).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(lastNDates(3, '2026-09-09')).toEqual(['2026-09-07', '2026-09-08', '2026-09-09']);
    expect(addDaysISO('2026-09-30', 1)).toBe('2026-10-01');
  });
});
