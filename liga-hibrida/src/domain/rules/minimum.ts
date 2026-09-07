// R9 · Minimum viable week and cut order — SPEC §7 R9 (document 04 "Orden de recorte").
// Pure: (plan, today, statuses) → the next cut step as proposals. "No hay deuda."
import type { Checkin, DayIndex, ISODate, PlannedItem, WeekPlan } from '../types';
import { classifyWeek, plannedItemLabel, type Priority } from '../content/week';
import { addDaysISO } from '@/lib/date';
import type { SubstitutionProposal } from './substitution';

export const NO_DEBT_MESSAGE = 'No hay deuda.';
export const STATUS_TRIGGER_DAYS = 3;

export type CutTrigger = 'fatiga' | 'viaje' | 'status';
export type CutStep = 1 | 2 | 3 | 4;

export const CUT_STEP_TITLES: Record<CutStep, string> = {
  1: 'Eliminar C (opcional)',
  2: 'Eliminar B (complementario)',
  3: "Reducir A a 45'",
  4: 'Proponer OFF (descanso completo)',
};

export interface CutPlan {
  triggered: boolean;
  trigger: CutTrigger | null;
  /** Days of the week (so far) with status CARGADO/KO. */
  loadedDays: number;
  step: CutStep | null;
  proposals: SubstitutionProposal[];
  message: string;
}

const OFF: PlannedItem = { kind: 'off' };
const SOURCE = '04 §6.4 · R9';

function proposal(
  plan: WeekPlan,
  day: DayIndex,
  slot: 'am' | 'pm',
  item: PlannedItem,
  step: CutStep,
  priority: Priority,
  replacement: PlannedItem,
): SubstitutionProposal {
  const label = plannedItemLabel(item);
  const title =
    step === 3
      ? `${label} → 45'`
      : step === 4
        ? `${label} → OFF`
        : `Eliminar ${label} (${priority})`;
  return {
    id: `r9_${step}_${day}_${slot}`,
    kind: step === 3 ? 'convert' : 'remove',
    day,
    date: addDaysISO(plan.weekStart, day),
    slot,
    title,
    detail: `${CUT_STEP_TITLES[step]} · orden de recorte: C → B → reducir A → descanso. ${NO_DEBT_MESSAGE}`,
    removed: label,
    replacement,
  };
}

/**
 * Next cut step for the remaining days (≥ today): C first, then B, then A gyms to 45', then OFF.
 * Never proposes adding sessions. Triggered by template fatiga/viaje or 3+ CARGADO/KO days.
 */
export function cutPlan(params: { plan: WeekPlan; today: ISODate; checkins: Checkin[] }): CutPlan {
  const { plan, today, checkins } = params;
  const weekEnd = addDaysISO(plan.weekStart, 6);
  const loadedDays = checkins.filter(
    (c) => c.date >= plan.weekStart && c.date <= weekEnd && c.status !== 'ok',
  ).length;
  const trigger: CutTrigger | null =
    plan.template === 'fatiga' || plan.template === 'viaje'
      ? plan.template
      : loadedDays >= STATUS_TRIGGER_DAYS
        ? 'status'
        : null;
  if (!trigger) {
    return {
      triggered: false,
      trigger: null,
      loadedDays,
      step: null,
      proposals: [],
      message: NO_DEBT_MESSAGE,
    };
  }

  const remaining = classifyWeek(plan.days).filter(
    (c) => addDaysISO(plan.weekStart, c.day) >= today,
  );
  const byPriority = (p: Priority) => remaining.filter((c) => c.priority === p);

  const steps: { step: CutStep; items: SubstitutionProposal[] }[] = [
    {
      step: 1,
      items: byPriority('C').map((c) => proposal(plan, c.day, c.slot, c.item, 1, 'C', OFF)),
    },
    {
      step: 2,
      items: byPriority('B').map((c) => proposal(plan, c.day, c.slot, c.item, 2, 'B', OFF)),
    },
    {
      step: 3,
      items: remaining
        .filter((c) => c.item.kind === 'gym' && c.item.version !== 45)
        .map((c) =>
          proposal(plan, c.day, c.slot, c.item, 3, 'A', {
            ...(c.item as Extract<PlannedItem, { kind: 'gym' }>),
            version: 45,
          }),
        ),
    },
    {
      step: 4,
      items: byPriority('A').map((c) => proposal(plan, c.day, c.slot, c.item, 4, 'A', OFF)),
    },
  ];
  const next = steps.find((s) => s.items.length > 0);
  return {
    triggered: true,
    trigger,
    loadedDays,
    step: next?.step ?? null,
    proposals: next?.items ?? [],
    message: NO_DEBT_MESSAGE,
  };
}

export function cutTriggerText(trigger: CutTrigger, loadedDays: number): string {
  switch (trigger) {
    case 'fatiga':
      return 'Plantilla Fatiga / trabajo: eliminar C, luego B, luego reducir A.';
    case 'viaje':
      return 'Plantilla Viaje: 2 full-body + Z2 + movilidad; sin compensar al volver.';
    case 'status':
      return `${loadedDays} días CARGADO/KO esta semana: se aplica el orden de recorte.`;
  }
}

export const CUT_SOURCE = SOURCE;
