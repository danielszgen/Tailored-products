// Weekly aerobic target and next planned route (pure helpers for the RUTAS counter).
import { deloadRouteMinutes } from '@/domain/rules/deload';
import type { PlannedItem, RouteLog, Wave, WeekPlan } from '@/domain/types';
import { addDaysISO } from '@/lib/date';

/** SMART 5 / §8.4: 90–150 min/sem of easy work; deload weeks −25/−35 %. */
export const Z2_TARGET: [number, number] = [90, 150];

export function z2TargetFor(wave: Wave | null): [number, number] {
  return wave === 'deload' ? deloadRouteMinutes(Z2_TARGET) : Z2_TARGET;
}

export function nextPlannedRoute(
  plan: WeekPlan | null,
  nextPlan: WeekPlan | null,
  today: string,
  routes: RouteLog[],
): { date: string; item: Extract<PlannedItem, { kind: 'route' }> } | null {
  for (const p of [plan, nextPlan]) {
    if (!p) continue;
    for (const d of [0, 1, 2, 3, 4, 5, 6] as const) {
      const date = addDaysISO(p.weekStart, d);
      if (date < today) continue;
      for (const item of [p.days[d].am, p.days[d].pm]) {
        if (item?.kind === 'route' && !routes.some((r) => r.date === date)) return { date, item };
      }
    }
  }
  return null;
}
