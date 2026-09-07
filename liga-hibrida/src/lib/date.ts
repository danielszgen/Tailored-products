// Date helpers. Weeks start on Monday (SPEC D13). All dates are local-time ISO 'YYYY-MM-DD'.
import { addDays, differenceInCalendarDays, format, getDay, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DayIndex, ISODate } from '@/domain/types';

export function toISODate(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd');
}

export function fromISODate(s: ISODate): Date {
  return parseISO(s);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDaysISO(date: ISODate, n: number): ISODate {
  return toISODate(addDays(fromISODate(date), n));
}

/** Monday of the week containing `date`. */
export function weekStartOf(date: ISODate): ISODate {
  return toISODate(startOfWeek(fromISODate(date), { weekStartsOn: 1 }));
}

/** 0 = Monday … 6 = Sunday. */
export function dayIndexOf(date: ISODate): DayIndex {
  return ((getDay(fromISODate(date)) + 6) % 7) as DayIndex;
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(fromISODate(to), fromISODate(from));
}

/** 1-based week number inside the block; can be < 1 before the block starts. */
export function weekOfBlock(date: ISODate, blockStart: ISODate): number {
  const diff = daysBetween(weekStartOf(blockStart), weekStartOf(date));
  return Math.floor(diff / 7) + 1;
}

/** Dates of the week (Monday…Sunday) that contains `date`. */
export function weekDates(date: ISODate): ISODate[] {
  const start = weekStartOf(date);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
}

/** The last `n` dates ending at `until` (inclusive), oldest first. */
export function lastNDates(n: number, until: ISODate): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(until, i - (n - 1)));
}

/** Spanish long label: "lunes 7 de septiembre". */
export function formatDayLabel(date: ISODate, pattern = "EEEE d 'de' MMMM"): string {
  return format(fromISODate(date), pattern, { locale: es });
}

export function formatShort(date: ISODate, pattern = 'd MMM'): string {
  return format(fromISODate(date), pattern, { locale: es });
}

export const DAY_NAMES_ES: Record<DayIndex, string> = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo',
};

export const DAY_SHORT_ES: Record<DayIndex, string> = {
  0: 'L',
  1: 'M',
  2: 'X',
  3: 'J',
  4: 'V',
  5: 'S',
  6: 'D',
};

/** 'HH:mm' → minutes since midnight. */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isWithinWindow(now: Date, window: [string, string]): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= timeToMinutes(window[0]) && minutes <= timeToMinutes(window[1]);
}
