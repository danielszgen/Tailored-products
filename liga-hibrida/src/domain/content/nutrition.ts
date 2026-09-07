// Nutrition (document 03) — SPEC §6.9. Pure data; the calorie algorithm itself is rule R7 (Etapa II).
import type { DayFuel } from '../types';

export const MASTER_RULE =
  'Medir mantenimiento real 14 días (semanas 1–2: registrar comida y pesarse 5–7 días/sem al levantarse) → superávit pequeño → media de peso sube 0,10–0,25 %/semana con cintura, rendimiento y digestión bajo control.';

export interface BiweeklyRow {
  situation: string;
  decision: string;
}

/** "Algoritmo quincenal". */
export const BIWEEKLY_ALGORITHM: readonly BiweeklyRow[] = [
  {
    situation: 'Peso estable y quiere ganar',
    decision: '+200 a +300 kcal/día sobre la media real',
  },
  { situation: 'Sube < 0,10 %/sem', decision: '+150 a +200 kcal/día' },
  { situation: 'Sube 0,10–0,25 %/sem', decision: 'Mantener (zona objetivo)' },
  { situation: 'Sube > 0,35–0,40 %/sem y cintura acelera', decision: '−150 a −200 kcal/día' },
  {
    situation: 'Rendimiento cae / hambre extrema',
    decision: 'Revisar carga, CH y recuperación antes de recortar',
  },
];

/** "Fases nutricionales del bloque". */
export const NUTRITION_PHASES: readonly { weeks: string; action: string }[] = [
  { weeks: 'sem 1–2', action: 'medir' },
  { weeks: 'sem 3–5', action: '+200–300 kcal si estable' },
  { weeks: 'sem 6–8', action: 'ajustar ±150–200 y practicar fueling en MTB/trail' },
  { weeks: 'sem 9–11', action: 'mantener' },
  { weeks: 'sem 12', action: 'recalibrar' },
];

export const MACROS: readonly { name: string; text: string }[] = [
  {
    name: 'Proteína',
    text: '1,8–2,2 g/kg/día en 4–5 tomas de 0,3–0,4 g/kg separadas 3–5 h',
  },
  { name: 'Grasas', text: '0,8–1,0 g/kg' },
  { name: 'CH', text: 'el resto (suben en pierna, running, MTB y dobles)' },
  { name: 'Fibra', text: '25–40 g' },
  { name: 'Agua', text: '30–40 ml/kg + deporte' },
];

export interface FuelDayType {
  dayType: string;
  fuel: DayFuel;
  energyLabel: string;
  breakfast: string;
  lunch: string;
  preSnack: string;
  dinnerPost: string;
}

/** "Tipo de día (Combustible)" table. */
export const FUEL_DAY_TYPES: readonly FuelDayType[] = [
  {
    dayType: 'Pierna + natación suave',
    fuel: 'alta',
    energyLabel: 'ALTA',
    breakfast: 'ALTO CH + prot',
    lunch: 'ALTO CH',
    preSnack: 'CH fácil + prot',
    dinnerPost: 'ALTO CH + prot',
  },
  {
    dayType: 'Torso + calistenia',
    fuel: 'media_alta',
    energyLabel: 'MEDIA-ALTA',
    breakfast: 'Medio-alto',
    lunch: 'Alto',
    preSnack: 'Moderado',
    dinnerPost: 'Medio-alto',
  },
  {
    dayType: 'AM Z2 + PM fuerza',
    fuel: 'alta',
    energyLabel: 'ALTA/MUY ALTA',
    breakfast: 'Alto',
    lunch: 'Muy alto',
    preSnack: 'Alto',
    dinnerPost: 'Alto',
  },
  {
    dayType: 'Trail / MTB largo',
    fuel: 'muy_alta',
    energyLabel: 'MUY ALTA',
    breakfast: 'Muy alto',
    lunch: 'Post muy alto',
    preSnack: 'Según hambre',
    dinnerPost: 'Alto + sal/líquidos',
  },
  {
    dayType: 'Yoga / movilidad',
    fuel: 'media',
    energyLabel: 'MEDIA',
    breakfast: 'Medio',
    lunch: 'Medio',
    preSnack: 'Opcional',
    dinnerPost: 'Medio',
  },
  {
    dayType: 'Descanso',
    fuel: 'media_baja',
    energyLabel: 'MEDIA-BAJA',
    breakfast: 'Medio',
    lunch: 'Medio',
    preSnack: 'Opcional',
    dinnerPost: 'Medio, menos almidón',
  },
];

export function fuelDayTypeFor(fuel: DayFuel): FuelDayType | undefined {
  return FUEL_DAY_TYPES.find((row) => row.fuel === fuel);
}

/** "Timing". */
export const FUEL_TIMING: readonly { context: string; text: string }[] = [
  {
    context: "Pre fuerza 90–180'",
    text: 'CH 0,75–1,5 g/kg + prot 0,25–0,35 g/kg, grasa/fibra moderadas.',
  },
  { context: 'Post', text: 'comida normal; si otra sesión < 8 h, CH + prot pronto.' },
  { context: "Aeróbico < 60' fácil", text: 'agua.' },
  { context: "Aeróbico 60–120'", text: '30–60 g CH/h.' },
  { context: 'Aeróbico > 2 h', text: '60–90 g/h progresivo.' },
  { context: 'Calor', text: 'sodio.' },
  { context: 'Doble sesión', text: 'no llegar vacío a la segunda.' },
];

/** Intra-session fuelling by duration (from the timing text). */
export function fuelIntraByMinutes(minutes: number): string {
  if (minutes < 60) return "< 60' fácil → agua.";
  if (minutes <= 120) return "60–120' → 30–60 g CH/h.";
  return '> 2 h → 60–90 g/h progresivo; calor → sodio.';
}

export const MICRONUTRIENTS: readonly string[] = [
  'fruta 3–4/día',
  'verdura 2–3 raciones',
  'legumbres 2–4/sem',
  'pescado 2–4/sem (azul incluido)',
  'huevos/lácteos regular',
  'frutos secos 1 ración/día',
  'sal yodada',
];

export const SNACK_TOOLKIT = {
  range: '300–600 kcal',
  items: [
    'yogur griego + granola + plátano + miel',
    'bocadillo pavo/queso + fruta',
    'leche + whey + avena + plátano + crema de cacahuete',
    'arroz con leche / yogur + cereal',
    'pan con tomate + tortilla + AOVE',
  ],
} as const;

export type ChecklistId = 'proteina' | 'fruta' | 'verdura' | 'hidratar' | 'fuel';

/** "Checklist diario" — the 5 ticks of the Combustible card. */
export const DAILY_CHECKLIST: readonly { id: ChecklistId; label: string }[] = [
  { id: 'proteina', label: 'Proteína' },
  { id: 'fruta', label: '3–4 frutas' },
  { id: 'verdura', label: '2+ verduras' },
  { id: 'hidratar', label: 'Hidratar' },
  { id: 'fuel', label: 'Fuel pre/post' },
];

export const NUTRITION_DASHBOARD: readonly string[] = [
  'peso al despertar 5–7×/sem (media)',
  'cintura 1×/sem',
  'rendimiento',
  'energía/hambre 1–5',
  'digestión',
  'sueño',
  'fueling en salidas largas',
];

export const NUTRITION_DISCLAIMER =
  'Documento de planificación deportiva y de producto. No es diagnóstico ni tratamiento médico. Ante síntomas persistentes o nuevos, la app y este informe remiten a valoración profesional.';
