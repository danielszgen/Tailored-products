// R5 · Substitutions — SPEC §7 R5 over the matrix of §6.7 (document 04): "nunca añadir: intercambiar".
// Pure: (WildLog, WeekPlan, today) → proposals Daniel accepts or rejects one by one.
import type {
  Advisory,
  DayIndex,
  ISODate,
  PlannedItem,
  WeekPlan,
  WildKind,
  WildLog,
} from '../types';
import { SUBSTITUTION_MATRIX, WILD_KIND_LABELS } from '../content/routes';
import { plannedItemLabel } from '../content/week';
import { addDaysISO, dayIndexOf, daysBetween } from '@/lib/date';
import { dayFuel } from './fuel';

export type ProposalKind = 'remove' | 'convert' | 'note' | 'warn';

export interface SubstitutionProposal {
  id: string;
  kind: ProposalKind;
  day: DayIndex;
  date: ISODate;
  slot?: 'am' | 'pm';
  title: string;
  detail: string;
  /** Label of the item removed/converted ('' for warnings and notes). */
  removed: string;
  replacement?: PlannedItem;
  note?: string;
  advisory?: Advisory;
}

export const HARD_LONG_MINUTES = 90;
const SOURCE = '04 §6.7 · R5';
const OFF: PlannedItem = { kind: 'off' };
const RECOVERY: PlannedItem = { kind: 'regen', what: 'yoga' };

/** Index of the matrix row that applies to a Zona Salvaje kind (null: no row → consulta al entrenador). */
export const MATRIX_ROW_FOR: Record<WildKind, number | null> = {
  mtb: 0,
  trail: 1,
  surf: 2,
  climb_outdoor: 3,
  boulder: 3,
  skate: 4,
  swim_long: 5,
  other: null,
};

const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

function dateOf(plan: WeekPlan, day: DayIndex): ISODate {
  return addDaysISO(plan.weekStart, day);
}

function isSwimItem(item: PlannedItem): boolean {
  return (
    (item.kind === 'regen' && item.what === 'natacion_suave') ||
    (item.kind === 'route' && item.routeKind === 'swim') ||
    (item.kind === 'sport' && item.sport === 'natacion')
  );
}

export interface ProposeParams {
  wild: Pick<WildLog, 'date' | 'kind' | 'minutes' | 'intensity'>;
  plan: WeekPlan;
  today: ISODate;
}

/**
 * Proposals for the week of the adventure. Days already past (before `today`) are left alone;
 * Lower sessions are never touched ("No debe sustituir: Lower A/B").
 */
export function proposeSubstitutions({ wild, plan, today }: ProposeParams): SubstitutionProposal[] {
  const offset = daysBetween(plan.weekStart, wild.date);
  if (offset < 0 || offset > 6) return [];
  const wildDay = dayIndexOf(wild.date);
  const remaining = (d: DayIndex) => dateOf(plan, d) >= today;
  const label = WILD_KIND_LABELS[wild.kind];
  const rowIndex = MATRIX_ROW_FOR[wild.kind];
  const row = rowIndex === null ? null : SUBSTITUTION_MATRIX[rowIndex];
  const hard = wild.intensity === 'dura';
  const out: SubstitutionProposal[] = [];

  const push = (p: Omit<SubstitutionProposal, 'date'>) =>
    out.push({ ...p, date: dateOf(plan, p.day) });

  // The planned Zona Salvaje slot on another day: the adventure already happened → recovery.
  for (const d of DAYS) {
    if (d === wildDay || !remaining(d)) continue;
    for (const slot of ['am', 'pm'] as const) {
      const item = plan.days[d][slot];
      if (item?.kind === 'wild') {
        push({
          id: `wild_slot_${d}`,
          kind: 'convert',
          day: d,
          slot,
          title: `${plannedItemLabel(item)} → yoga / movilidad`,
          detail: `Nunca añadir: intercambiar. La aventura de la semana ya es ${label} ${wild.minutes}'.`,
          removed: plannedItemLabel(item),
          replacement: RECOVERY,
        });
      }
    }
  }

  // Rule 4 "El sábado manda": hard adventure → Friday PM out, Sunday real recovery.
  const fridayPm = plan.days[4].pm;
  const matrixWantsFridayZ2 =
    wild.kind === 'mtb' || wild.kind === 'skate' || wild.kind === 'swim_long';
  if (
    fridayPm &&
    fridayPm.kind !== 'off' &&
    remaining(4) &&
    wildDay !== 4 &&
    (hard || (matrixWantsFridayZ2 && (fridayPm.kind === 'route' || fridayPm.kind === 'regen')))
  ) {
    push({
      id: 'friday_pm',
      kind: 'remove',
      day: 4,
      slot: 'pm',
      title: `Eliminar ${plannedItemLabel(fridayPm)} del viernes`,
      detail: hard
        ? 'Regla 4 · El sábado manda: si la aventura sale intensa, viernes PM se elimina.'
        : `${row!.appears} puede sustituir: ${row!.canReplace}.`,
      removed: plannedItemLabel(fridayPm),
      replacement: OFF,
    });
  }
  if (hard && remaining(6) && wildDay !== 6) {
    const sunday = plan.days[6];
    if (sunday.am && sunday.am.kind !== 'off') {
      push({
        id: 'sunday_recovery',
        kind: 'convert',
        day: 6,
        slot: 'am',
        title: 'Domingo → recuperación real (descanso total)',
        detail:
          'Regla 4 · El sábado manda: si la aventura sale intensa, domingo es recuperación real.',
        removed: plannedItemLabel(sunday.am),
        replacement: OFF,
      });
    }
  }

  // Matrix rows (what the adventure can replace this week).
  if (row) {
    for (const d of DAYS) {
      if (d === wildDay || !remaining(d)) continue;
      for (const slot of ['am', 'pm'] as const) {
        const item = plan.days[d][slot];
        if (!item || item.kind === 'gym' || item.kind === 'off' || item.kind === 'wild') continue;
        if (out.some((p) => p.day === d && p.slot === slot)) continue;
        let matches = false;
        switch (wild.kind) {
          case 'trail':
            matches = item.kind === 'route' && item.routeKind === 'run';
            break;
          case 'surf':
            matches = isSwimItem(item);
            break;
          case 'climb_outdoor':
          case 'boulder':
            matches = item.kind === 'sport' && item.sport === 'escalada';
            break;
          case 'skate':
            // "Deporte miércoles o Z2 opcional": any technical sport slot, or an optional route.
            matches = item.kind === 'sport' || (item.kind === 'route' && !!item.optional);
            break;
          case 'swim_long':
            matches = item.kind === 'route' && !!item.optional;
            break;
          case 'mtb':
            matches = false; // Friday Z2 handled above; the Zona Salvaje slot too
            break;
        }
        if (!matches) continue;
        push({
          id: `matrix_${d}_${slot}`,
          kind: item.kind === 'sport' ? 'convert' : 'remove',
          day: d,
          slot,
          title: `${item.kind === 'sport' ? 'Sustituir' : 'Eliminar'} ${plannedItemLabel(item)} (${dayName(d)})`,
          detail: `${row.appears} puede sustituir: ${row.canReplace}. Ajuste: ${row.adjustment}.`,
          removed: plannedItemLabel(item),
          replacement: item.kind === 'sport' ? RECOVERY : OFF,
        });
      }
    }
    if ((wild.kind === 'climb_outdoor' || wild.kind === 'boulder') && hard) {
      for (const d of DAYS) {
        if (!remaining(d)) continue;
        for (const slot of ['am', 'pm'] as const) {
          const item = plan.days[d][slot];
          if (item?.kind === 'gym' && item.gymId === 'vertigo' && !item.note) {
            push({
              id: `vertigo_pull_${d}`,
              kind: 'note',
              day: d,
              slot,
              title: `Vértigo (${dayName(d)}): reducir tirón/antebrazo`,
              detail:
                'Regla 6 · Escalada cuenta como upper: boulder duro sustituye parte de Vértigo.',
              removed: '',
              note: 'Reduce tirón/antebrazo del gym (escalada dura esta semana)',
            });
          }
        }
      }
    }
  } else {
    push({
      id: 'no_matrix_row',
      kind: 'warn',
      day: wildDay,
      title: `${label}: sin fila en la matriz de sustituciones`,
      detail: 'Consulta al entrenador: el documento 04 no cubre esta actividad.',
      removed: '',
      advisory: {
        level: 5,
        message: `${label} ${wild.minutes}': sin regla de sustitución en el documento 04. Consulta al entrenador.`,
        source: SOURCE,
        id: 'r5_no_row',
      },
    });
  }

  // Monday Lower warning after a hard, long adventure (and the MTB "reduce carrera" adjustment).
  if (hard && wild.minutes >= HARD_LONG_MINUTES) {
    const nextMonday = addDaysISO(plan.weekStart, 7);
    out.push({
      id: 'monday_lower',
      kind: 'warn',
      day: 0,
      date: nextMonday,
      title: 'Aviso: Lower A del lunes',
      detail: 'MTB con amigos → el Lower A del lunes se ajusta si piernas pesadas.',
      removed: '',
      advisory: mondayLowerAdvisory(wild),
    });
  }
  if (wild.kind === 'mtb' && wild.intensity !== 'facil') {
    out.push({
      id: 'reduce_running',
      kind: 'warn',
      day: wildDay,
      date: wild.date,
      title: 'Reduce carrera esta semana si piernas cargadas',
      detail: `${row!.appears}: ${row!.adjustment}.`,
      removed: '',
      advisory: {
        level: 2,
        message: `MTB ${wild.minutes}': reduce carrera esta semana si piernas cargadas.`,
        source: SOURCE,
        id: 'r5_reduce_running',
      },
    });
  }

  return out;
}

function mondayLowerAdvisory(wild: Pick<WildLog, 'kind' | 'minutes' | 'intensity'>): Advisory {
  return {
    level: 2,
    message: `${WILD_KIND_LABELS[wild.kind]} ${wild.minutes}' ${wild.intensity}: el Lower A del lunes se ajusta si piernas pesadas.`,
    source: SOURCE,
    id: 'r5_monday_lower',
  };
}

const DAY_NAMES: Record<DayIndex, string> = {
  0: 'lunes',
  1: 'martes',
  2: 'miércoles',
  3: 'jueves',
  4: 'viernes',
  5: 'sábado',
  6: 'domingo',
};

function dayName(d: DayIndex): string {
  return DAY_NAMES[d];
}

/**
 * Applies the accepted proposals to a plan: items replaced, notes appended, fuel recomputed (R6)
 * and every removal recorded in `substitutions`. Warnings change nothing. Returns a new plan.
 */
export function applyProposals(plan: WeekPlan, accepted: SubstitutionProposal[]): WeekPlan {
  const days = { ...plan.days };
  const substitutions = [...plan.substitutions];
  const touched = new Set<DayIndex>();
  for (const p of accepted) {
    if (p.kind === 'warn' || p.slot === undefined) continue;
    const day = { ...days[p.day] };
    if (p.kind === 'note') {
      const item = day[p.slot];
      if (item?.kind === 'gym' && p.note) day[p.slot] = { ...item, note: p.note };
    } else if (p.replacement) {
      day[p.slot] = { ...p.replacement };
      substitutions.push({ date: p.date, removed: p.removed, reason: p.detail });
      touched.add(p.day);
    }
    days[p.day] = day;
  }
  for (const d of touched) days[d] = { ...days[d], fuel: dayFuel(days[d]) };
  return { ...plan, days, substitutions };
}

/** Monday advisory from a hard ≥ 90' adventure on the weekend just passed (Saturday/Sunday). */
export function weekendLoadAdvisory(
  wild: Pick<WildLog, 'date' | 'kind' | 'minutes' | 'intensity'>[],
  today: ISODate,
): Advisory | null {
  if (dayIndexOf(today) !== 0) return null;
  const recent = wild.filter((w) => {
    const diff = daysBetween(w.date, today);
    return diff >= 1 && diff <= 2 && w.intensity === 'dura' && w.minutes >= HARD_LONG_MINUTES;
  });
  if (recent.length === 0) return null;
  return mondayLowerAdvisory(recent[recent.length - 1]);
}
