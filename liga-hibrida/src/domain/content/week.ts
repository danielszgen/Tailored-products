// Base week and week templates — SPEC §6.4 (document 04). Pure data + a plan builder.
import type {
  DayFuel,
  DayIndex,
  ISODate,
  PlannedDay,
  PlannedItem,
  WeekPlan,
  WeekTemplate,
} from '../types';
import { waveForWeek } from './block';
import { GYM_NAMES } from './gyms';

export interface WeekTemplateSpec {
  id: WeekTemplate;
  name: string;
  description: string;
  days: Record<DayIndex, PlannedDay>;
  notes?: string[];
}

export const WEEK_TEMPLATE_NAMES: Record<WeekTemplate, string> = {
  estandar: 'Estándar',
  montana: 'Montaña / MTB fuerte',
  surf: 'Surf / skate',
  fatiga: 'Fatiga / trabajo',
  viaje: 'Viaje',
};

export const DAY_FUEL_LABELS: Record<DayFuel, string> = {
  muy_alta: 'MUY ALTA',
  alta: 'ALTA',
  media_alta: 'MEDIA-ALTA',
  media: 'MEDIA',
  media_baja: 'MEDIA-BAJA',
};

const STANDARD_DAYS: Record<DayIndex, PlannedDay> = {
  0: {
    am: { kind: 'gym', gymId: 'cantera', version: 60 },
    pm: { kind: 'regen', what: 'natacion_suave' },
    fuel: 'alta',
  },
  1: {
    am: { kind: 'gym', gymId: 'yunque', version: 60 },
    pm: { kind: 'route', routeKind: 'run', minutes: [45, 55] },
    fuel: 'media_alta',
  },
  2: {
    am: { kind: 'regen', what: 'yoga' },
    pm: { kind: 'sport', sport: 'escalada', minutes: [45, 60], rpeMax: 6 },
    fuel: 'media',
  },
  3: {
    am: { kind: 'gym', gymId: 'resorte', version: 60 },
    pm: { kind: 'regen', what: 'paseo' },
    fuel: 'alta',
  },
  4: {
    am: { kind: 'gym', gymId: 'vertigo', version: 60 },
    pm: { kind: 'route', routeKind: 'bike', minutes: [40, 60], optional: true },
    fuel: 'media_alta',
  },
  5: {
    am: { kind: 'wild' },
    pm: { kind: 'off' },
    fuel: 'muy_alta',
  },
  6: {
    am: { kind: 'regen', what: 'yoga' },
    pm: { kind: 'off' },
    fuel: 'media_baja',
  },
};

function cloneDays(days: Record<DayIndex, PlannedDay>): Record<DayIndex, PlannedDay> {
  return JSON.parse(JSON.stringify(days)) as Record<DayIndex, PlannedDay>;
}

function withDays(
  base: Record<DayIndex, PlannedDay>,
  patch: Partial<Record<DayIndex, PlannedDay>>,
): Record<DayIndex, PlannedDay> {
  const copy = cloneDays(base);
  for (const key of Object.keys(patch) as unknown as DayIndex[]) {
    const day = patch[key];
    if (day) copy[key] = day;
  }
  return copy;
}

export const WEEK_TEMPLATES: Record<WeekTemplate, WeekTemplateSpec> = {
  estandar: {
    id: 'estandar',
    name: WEEK_TEMPLATE_NAMES.estandar,
    description: 'La semana base del documento 04.',
    days: STANDARD_DAYS,
  },
  montana: {
    id: 'montana',
    name: WEEK_TEMPLATE_NAMES.montana,
    description: 'Igual, pero viernes sin PM y domingo recuperación total.',
    days: withDays(STANDARD_DAYS, {
      4: { am: { kind: 'gym', gymId: 'vertigo', version: 60 }, fuel: 'media_alta' },
      6: { am: { kind: 'off' }, pm: { kind: 'off' }, fuel: 'media_baja' },
    }),
    notes: ['Viernes sin PM.', 'Domingo recuperación total.'],
  },
  surf: {
    id: 'surf',
    name: WEEK_TEMPLATE_NAMES.surf,
    description: 'Miércoles yoga + skate; viernes Upper B + natación; sábado surf.',
    days: withDays(STANDARD_DAYS, {
      2: {
        am: { kind: 'regen', what: 'yoga' },
        pm: { kind: 'sport', sport: 'skate', minutes: [45, 60], rpeMax: 6 },
        fuel: 'media',
      },
      4: {
        am: { kind: 'gym', gymId: 'vertigo', version: 60 },
        pm: { kind: 'regen', what: 'natacion_suave' },
        fuel: 'media_alta',
      },
      5: { am: { kind: 'wild', wildKind: 'surf' }, pm: { kind: 'off' }, fuel: 'muy_alta' },
    }),
    notes: ['Miércoles yoga + skate.', 'Viernes Upper B + natación.', 'Sábado surf.'],
  },
  fatiga: {
    id: 'fatiga',
    name: WEEK_TEMPLATE_NAMES.fatiga,
    description:
      "Lower A reducido (45'), Upper A, OFF/yoga, Lower B reducido, Upper B o OFF, Z2/aventura fácil, OFF.",
    days: {
      0: { am: { kind: 'gym', gymId: 'cantera', version: 45 }, fuel: 'alta' },
      1: { am: { kind: 'gym', gymId: 'yunque', version: 60 }, fuel: 'media_alta' },
      2: { am: { kind: 'regen', what: 'yoga' }, fuel: 'media' },
      3: { am: { kind: 'gym', gymId: 'resorte', version: 45 }, fuel: 'alta' },
      4: { am: { kind: 'gym', gymId: 'vertigo', version: 60 }, fuel: 'media_alta' },
      5: {
        am: { kind: 'route', routeKind: 'run', minutes: [40, 55], optional: true },
        fuel: 'media',
      },
      6: { am: { kind: 'off' }, fuel: 'media_baja' },
    },
    notes: [
      'Lower A y Lower B reducidos a 45 minutos.',
      'Miércoles: OFF o yoga (se planifica yoga; puede quedar en OFF).',
      'Viernes: Upper B o OFF (se planifica Upper B; puede quedar en OFF).',
      'Sábado: Z2 o aventura fácil (se planifica ruta fácil opcional).',
      'Combustible de los días sin doble sesión interpretado según la tabla de tipos de día (§6.9).',
    ],
  },
  viaje: {
    id: 'viaje',
    name: WEEK_TEMPLATE_NAMES.viaje,
    description:
      '2 full-body de mantenimiento + running/Z2 + movilidad; parque de calistenia; sin compensar al volver.',
    days: {
      0: { am: { kind: 'note', text: 'Full-body de mantenimiento (1/2)' }, fuel: 'media_alta' },
      1: { am: { kind: 'route', routeKind: 'run', minutes: [40, 55] }, fuel: 'media_alta' },
      2: { am: { kind: 'regen', what: 'movilidad' }, fuel: 'media' },
      3: { am: { kind: 'note', text: 'Full-body de mantenimiento (2/2)' }, fuel: 'media_alta' },
      4: {
        am: { kind: 'route', routeKind: 'run', minutes: [40, 55], optional: true },
        fuel: 'media',
      },
      5: { am: { kind: 'regen', what: 'movilidad' }, fuel: 'media' },
      6: { am: { kind: 'off' }, fuel: 'media_baja' },
    },
    notes: [
      'Parque de calistenia.',
      'Sin compensar al volver.',
      'Los full-body de mantenimiento no están definidos en SPEC §6.5: se muestran como nota ("consulta al entrenador").',
      'Distribución de los días interpretada: SPEC solo lista los ingredientes.',
    ],
  },
};

export const BASE_WEEK: WeekTemplateSpec = WEEK_TEMPLATES.estandar;

export interface BaseWeekRow {
  day: DayIndex;
  dayName: string;
  am: string;
  pm: string;
  fuel: string;
}

/** Literal rows of the SPEC §6.4 table. */
export const BASE_WEEK_TABLE: readonly BaseWeekRow[] = [
  {
    day: 0,
    dayName: 'Lunes',
    am: "CANTERA (Lower A) 60'",
    pm: "Natación suave 25–40' + sauna opcional",
    fuel: 'ALTA',
  },
  {
    day: 1,
    dayName: 'Martes',
    am: "YUNQUE (Upper A) 60'",
    pm: "Ruta carrera Z2 45–55'",
    fuel: 'MEDIA-ALTA (doble → ALTA)',
  },
  {
    day: 2,
    dayName: 'Miércoles',
    am: "Yoga / movilidad 40–60'",
    pm: "Escalada o skate técnico 45–60' RPE ≤ 6",
    fuel: 'MEDIA',
  },
  {
    day: 3,
    dayName: 'Jueves',
    am: "RESORTE (Lower B) 60'",
    pm: 'OFF · paseo y movilidad breve',
    fuel: 'ALTA',
  },
  {
    day: 4,
    dayName: 'Viernes',
    am: "VÉRTIGO (Upper B) 60'",
    pm: "Ruta opcional bici o natación 40–60'",
    fuel: 'MEDIA-ALTA',
  },
  {
    day: 5,
    dayName: 'Sábado',
    am: 'ZONA SALVAJE (MTB / trail / surf / escalada exterior)',
    pm: 'OFF',
    fuel: "MUY ALTA si > 90'",
  },
  {
    day: 6,
    dayName: 'Domingo',
    am: "Yoga suave + paseo 30–45' o descanso total",
    pm: 'OFF · Consejo de la Liga',
    fuel: 'MEDIA-BAJA',
  },
];

export const WEEK_BUDGET: readonly string[] = [
  '4 h fuerza · 2–3 h aeróbico · 1–2 h movilidad/técnica · 1–2 h deporte libre.',
  '8–10 h semana base, 10–12 h con aventura larga.',
  '20 h/semana es un techo, no un objetivo.',
];

export const PRIORITIES = {
  A: 'A no negociable = 2 Lower + 2 Upper + 1 Z2 + 1 movilidad.',
  B: 'B = 2.º Z2 + natación suave + juego técnico (entra por sustitución).',
  C: 'C = sesión recreativa adicional solo si todo está verde.',
} as const;

export const CUT_ORDER: readonly string[] = [
  'C opcional',
  'B complementario',
  'reducir volumen de A',
  'descanso completo',
];

export const MINIMUM_VIABLE_WEEK =
  'Mínimo viable (semana de estrés): 2 Lower + 2 Upper + 1 Z2 + 1 movilidad. Si ni eso cabe: 3 fuerzas full-body/upper-lower.';

export const NO_DEBT_RULE = 'Nunca recuperar sesiones perdidas en 48 h.';

export function buildWeekPlan(params: {
  weekStart: ISODate;
  weekOfBlock: number;
  template?: WeekTemplate;
}): WeekPlan {
  const template = params.template ?? 'estandar';
  return {
    weekStart: params.weekStart,
    weekOfBlock: params.weekOfBlock,
    wave: waveForWeek(params.weekOfBlock),
    template,
    days: cloneDays(WEEK_TEMPLATES[template].days),
    substitutions: [],
  };
}

const ROUTE_LABEL: Record<string, string> = {
  run: 'carrera',
  bike: 'bici',
  swim: 'natación',
  walk: 'paseo',
};

const WILD_LABEL: Record<string, string> = {
  mtb: 'MTB',
  trail: 'trail',
  surf: 'surf',
  climb_outdoor: 'escalada exterior',
  boulder: 'boulder',
  skate: 'skate',
  swim_long: 'natación larga',
  other: 'otro',
};

const REGEN_LABEL: Record<string, string> = {
  yoga: 'Yoga / movilidad',
  movilidad: 'Movilidad',
  natacion_suave: 'Natación suave',
  paseo: 'Paseo',
};

const SPORT_LABEL: Record<string, string> = {
  escalada: 'Escalada técnica',
  skate: 'Skate técnico',
  natacion: 'Natación técnica',
  otro: 'Deporte técnico',
};

/** Spanish label for a planned item, e.g. "Cantera · 60'", "Ruta carrera Z2 45–55'". */
export function plannedItemLabel(item: PlannedItem): string {
  switch (item.kind) {
    case 'gym':
      return `${GYM_NAMES[item.gymId]} · ${item.version}'`;
    case 'route': {
      const base = `Ruta ${ROUTE_LABEL[item.routeKind]} Z2 ${item.minutes[0]}–${item.minutes[1]}'`;
      return item.optional ? `${base} · opcional` : base;
    }
    case 'wild':
      return item.wildKind ? `Zona Salvaje · ${WILD_LABEL[item.wildKind]}` : 'Zona Salvaje';
    case 'regen':
      return REGEN_LABEL[item.what];
    case 'sport': {
      const base = `${SPORT_LABEL[item.sport]} ${item.minutes[0]}–${item.minutes[1]}'`;
      const rpe = item.rpeMax !== undefined ? ` · RPE ≤ ${item.rpeMax}` : '';
      return `${base}${rpe}${item.optional ? ' · opcional' : ''}`;
    }
    case 'note':
      return item.text;
    case 'off':
      return 'OFF';
  }
}

export function plannedItemKindLabel(item: PlannedItem): string {
  switch (item.kind) {
    case 'gym':
      return 'Gimnasio';
    case 'route':
      return 'Ruta';
    case 'wild':
      return 'Zona Salvaje';
    case 'regen':
      return 'Regen';
    case 'sport':
      return 'Deporte';
    case 'note':
      return 'Nota';
    case 'off':
      return 'OFF';
  }
}
