// R6 · Combustible — SPEC §7 R6 (document 03 "Tipo de día", document 05 fueling per gym).
// Pure: (planned items of a day, optional actuals) → DayFuel + pre/post/intra texts.
import type { DayFuel, GymId, PlannedItem } from '../types';
import { GYMS } from '../content/gyms';
import { FUEL_DAY_TYPES, fuelIntraByMinutes, type FuelDayType } from '../content/nutrition';
import { DAY_FUEL_LABELS } from '../content/week';

export interface FuelDayInput {
  am?: PlannedItem;
  pm?: PlannedItem;
}

export interface FuelOptions {
  /** Minutes of the day's Zona Salvaje when known (logged or expected). */
  wildMinutes?: number;
  /** Minutes of the day's route when known (for the intra guide). */
  routeMinutes?: number;
  /** Both sessions of a double day were actually done ("doble → ALTA"). */
  doubleDone?: boolean;
}

export interface FuelGuide {
  fuel: DayFuel;
  label: string;
  dayType?: FuelDayType;
  gymId?: GymId;
  pre?: string;
  post?: string;
  intra?: string;
  notes: string[];
}

export const WILD_LONG_MINUTES = 90;
export const DOUBLE_SESSION_NOTE = 'Doble sesión: no llegar vacío a la segunda.';
export const UPPER_DOUBLE_NOTE = 'Doble (Upper + Z2): al hacer la doble, el día pasa a ALTA.';

function isLower(item: PlannedItem | undefined): boolean {
  return item?.kind === 'gym' && (item.gymId === 'cantera' || item.gymId === 'resorte');
}

function isUpper(item: PlannedItem | undefined): boolean {
  return item?.kind === 'gym' && (item.gymId === 'yunque' || item.gymId === 'vertigo');
}

/** Items that count as a training session for the "doble sesión" rule (regen never does). */
function isTraining(item: PlannedItem | undefined): boolean {
  return (
    !!item &&
    (item.kind === 'gym' || item.kind === 'route' || item.kind === 'wild' || item.kind === 'sport')
  );
}

function dayTypeNamed(name: string): FuelDayType {
  return FUEL_DAY_TYPES.find((row) => row.dayType === name)!;
}

interface Classification {
  fuel: DayFuel;
  dayType?: FuelDayType;
  notes: string[];
}

function classify(day: FuelDayInput, opts: FuelOptions): Classification {
  const { am, pm } = day;
  const items = [am, pm].filter((i): i is PlannedItem => !!i);
  const wild = items.find((i) => i.kind === 'wild');
  const notes: string[] = [];

  if (wild) {
    const long = opts.wildMinutes === undefined || opts.wildMinutes >= WILD_LONG_MINUTES;
    if (long) return { fuel: 'muy_alta', dayType: dayTypeNamed('Trail / MTB largo'), notes };
    notes.push(
      `Zona Salvaje < ${WILD_LONG_MINUTES}': se trata como día ALTA (consulta al entrenador).`,
    );
    return { fuel: 'alta', dayType: dayTypeNamed('Pierna + natación suave'), notes };
  }

  const training = items.filter(isTraining).length;
  const double = training >= 2;

  if (isLower(am) || isLower(pm)) {
    if (double) notes.push(DOUBLE_SESSION_NOTE);
    return { fuel: 'alta', dayType: dayTypeNamed('Pierna + natación suave'), notes };
  }

  if (double) {
    notes.push(DOUBLE_SESSION_NOTE);
    if (am?.kind === 'route' && pm?.kind === 'gym') {
      return { fuel: 'alta', dayType: dayTypeNamed('AM Z2 + PM fuerza'), notes };
    }
    if (isUpper(am) || isUpper(pm)) {
      if (opts.doubleDone) {
        return { fuel: 'alta', dayType: dayTypeNamed('AM Z2 + PM fuerza'), notes };
      }
      notes.push(UPPER_DOUBLE_NOTE);
      return { fuel: 'media_alta', dayType: dayTypeNamed('Torso + calistenia'), notes };
    }
    return { fuel: 'alta', dayType: dayTypeNamed('AM Z2 + PM fuerza'), notes };
  }

  if (isUpper(am) || isUpper(pm)) {
    return { fuel: 'media_alta', dayType: dayTypeNamed('Torso + calistenia'), notes };
  }

  if (items.some((i) => i.kind === 'route' || i.kind === 'sport')) {
    notes.push('Ruta o deporte técnico solo: sin fila propia en el documento 03, se asume MEDIA.');
    return { fuel: 'media', notes };
  }

  if (items.some((i) => i.kind === 'note')) {
    notes.push('Sesión sin definir en el documento 05: consulta al entrenador.');
    return { fuel: 'media', notes };
  }

  if (items.some((i) => i.kind === 'regen' && (i.what === 'yoga' || i.what === 'movilidad'))) {
    return { fuel: 'media', dayType: dayTypeNamed('Yoga / movilidad'), notes };
  }

  return { fuel: 'media_baja', dayType: dayTypeNamed('Descanso'), notes };
}

/** DayFuel of a day from its planned items (SPEC §7 R6). */
export function dayFuel(day: FuelDayInput, opts: FuelOptions = {}): DayFuel {
  return classify(day, opts).fuel;
}

/** Full Combustible guide: level, day type, pre/post of the main gym, intra by duration. */
export function fuelGuide(day: FuelDayInput, opts: FuelOptions = {}): FuelGuide {
  const c = classify(day, opts);
  const gymItem = day.am?.kind === 'gym' ? day.am : day.pm?.kind === 'gym' ? day.pm : undefined;
  const gym = gymItem ? GYMS[gymItem.gymId] : undefined;
  const wild = [day.am, day.pm].find((i) => i?.kind === 'wild');
  const route = [day.am, day.pm].find((i) => i?.kind === 'route');
  let intra: string | undefined;
  if (wild) intra = fuelIntraByMinutes(opts.wildMinutes ?? WILD_LONG_MINUTES);
  else if (route && route.kind === 'route') {
    intra = fuelIntraByMinutes(opts.routeMinutes ?? route.minutes[1]);
  }
  return {
    fuel: c.fuel,
    label: DAY_FUEL_LABELS[c.fuel],
    dayType: c.dayType,
    gymId: gym?.id,
    pre: gym?.fuelPre,
    post: gym?.fuelPost,
    intra,
    notes: c.notes,
  };
}
