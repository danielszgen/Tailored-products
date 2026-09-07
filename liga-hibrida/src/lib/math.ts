// Small numeric helpers shared by rules and UI.
import type { ISODate } from '@/domain/types';
import { daysBetween } from './date';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round to `decimals` decimal places (avoids 0.1 + 0.2 artefacts). */
export function roundTo(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Round to the nearest multiple of `step` (e.g. loads in 2.5 kg steps). */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return roundTo(Math.round(value / step) * step, 2);
}

export function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface DatedValue {
  date: ISODate;
  value: number;
}

/**
 * 7-day moving average that ignores gaps: for each point, the mean of the points whose
 * date falls within the 7-day window ending on that date (SPEC §7 R7, used by the weight chart).
 * Input may be unsorted; output is sorted by date.
 */
export function movingAverage7(points: DatedValue[], windowDays = 7): DatedValue[] {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return sorted.map((p, i) => {
    const inWindow: number[] = [];
    for (let j = i; j >= 0; j--) {
      const d = daysBetween(sorted[j].date, p.date);
      if (d >= windowDays) break;
      inWindow.push(sorted[j].value);
    }
    return { date: p.date, value: roundTo(mean(inWindow) ?? p.value, 2) };
  });
}

/** Decimals needed to display multiples of `step` (2.5 → 1, 0.1 → 1, 5 → 0), capped at 2. */
export function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot < 0 ? 0 : Math.min(2, text.length - dot - 1);
}

export function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}
