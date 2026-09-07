// Stats, horizons and SMART objectives of Bloque 1 — SPEC §6.2 (document 02).
import type { StatKey } from '../types';

export interface StatSpec {
  key: StatKey;
  name: string;
  definition: string;
  indicator: string;
  formula: string;
}

export const STATS: readonly StatSpec[] = [
  {
    key: 'masa',
    name: 'MASA',
    definition: '85–88 kg atlético, cintura controlada',
    indicator: 'Peso medio 7 d, cintura, fotos',
    formula:
      'Progreso del peso medio desde el peso inicial hacia 85 kg, con penalización si la tendencia semanal > 0,40 %.',
  },
  {
    key: 'fuerza',
    name: 'FUERZA',
    definition: 'Torso fuerte; piernas dejan de ser limitante',
    indicator: 'Marcas relativas a peso + RPE',
    formula:
      'Media del % de mejora frente a baseline en press banca, dominada lastrada, trap bar y split squat (a mismo RIR), acotado.',
  },
  {
    key: 'motor',
    name: 'MOTOR',
    definition: 'Base aeróbica para 23 km trail',
    indicator: 'Duración fácil, trail largo, recuperación',
    formula:
      'Minutos Z2 semanales / 150 (acotado) ponderado con duración de la ruta más larga / 60 min.',
  },
  {
    key: 'control',
    name: 'CONTROL',
    definition: 'Handstand sólido, movilidad avanzada',
    indicator: 'Skill tests + rangos',
    formula: 'Mejor handstand en pared (s) / 60 + nº de rangos de movilidad mejorados / 4.',
  },
  {
    key: 'aventura',
    name: 'AVENTURA',
    definition: 'MTB, escalada, natación, surf, skate mejoran o se mantienen',
    indicator: 'Sensación + rendimiento de campo',
    formula:
      'Nº de ventanas de Zona Salvaje completadas en las últimas 4 semanas / 4 + nota de transferencia (mejor/igual/peor).',
  },
];

/** Shown until a stat has data. */
export const STAT_PLACEHOLDER = '—';

export interface SmartObjective {
  id: number;
  title: string;
  target: string;
  validation: string;
}

/** "Objetivos SMART del Bloque 1 (12 semanas, hasta 29 nov 2026)". */
export const SMART_OBJECTIVES: readonly SmartObjective[] = [
  {
    id: 1,
    title: 'Baseline completo',
    target: 'Ficha cerrada en semana 1–2',
    validation: 'Perfil con peso medio 7 d + ≥3 baselines de fuerza + test movilidad',
  },
  {
    id: 2,
    title: 'Piernas entrenables',
    target: '4 semanas consecutivas de Lower sin calambre recurrente ni dolor creciente',
    validation: 'Aductor después ≤ 3 en todas las sesiones Lower de 4 semanas seguidas',
  },
  {
    id: 3,
    title: 'Fuerza unilateral',
    target: '+15–25 % en split squat/step-up vs baseline al mismo estándar',
    validation: 'carga×reps vs baseline',
  },
  {
    id: 4,
    title: 'Mantener torso',
    target: 'No perder rendimiento relativo en dominadas/fondos',
    validation: '(carga+PC)/PC × reps ≥ baseline',
  },
  {
    id: 5,
    title: 'Base aeróbica',
    target: '90–150 min/sem fáciles sostenibles',
    validation: 'suma minutos de rutas que cuentan como Z2',
  },
  {
    id: 6,
    title: 'Carrera progresiva',
    target: 'Una sesión fácil continua de 45–60 min',
    validation: 'Ruta de carrera ≥ 45 min con RPE ≤ 6 y sin dolor 24 h',
  },
  {
    id: 7,
    title: 'Muñecas',
    target: 'Tolerancia sin síntomas crecientes',
    validation: 'tendencia de muñeca no creciente + carga de apoyo tolerada',
  },
  {
    id: 8,
    title: 'Handstand / movilidad',
    target: 'Mejorar 1 marcador de handstand y 2 rangos',
    validation: 'Test de Liga vs anterior',
  },
  {
    id: 9,
    title: 'Composición',
    target: 'Ganancia 0,15–0,30 % del peso/semana en semanas de construcción',
    validation: 'media móvil 7 d',
  },
  {
    id: 10,
    title: 'Recuperación',
    target: 'Sueño ~8 h; sin caída sostenida > 7 días',
    validation: 'check-ins',
  },
];

export const BLOCK_SUCCESS_CRITERIA =
  'Criterio de éxito del bloque: piernas dejan de limitar, aparece base aeróbica, torso se mantiene, peso responde, muñecas toleran más carga. No hace falta cumplir las 10.';

export const OBJECTIVES_6M: readonly string[] = [
  '+2 a +4 kg vs baseline',
  '2 sesiones de pierna/sem toleradas',
  '2–3 estímulos aeróbicos/sem, 120–180 min',
  'carrera fácil 60–75 min',
  'apoyos sin dolor',
  'adherencia ≥ 85 %',
];

export const OBJECTIVES_12M: readonly string[] = [
  '+4 a +7 kg si la calidad es buena',
  'sesiones de sentadilla sin calambres recurrentes',
  'mantener/mejorar dominadas y fondos lastrados',
  '3–4 h aeróbicas en semanas específicas',
  'trail 15–23 km',
  'handstand libre 10–30 s',
];

/** "Scorecard 3 años (brújula, no meta inmediata)". */
export const SCORECARD_3Y: readonly string[] = [
  '85–88 kg',
  'dominada +40 kg ×3–5',
  'fondos +40–50 kg ×3–5',
  'press banca 1,25–1,40×PC',
  'sentadilla ~1,4–1,6×PC',
  'trap bar ~1,7–2,0×PC',
  'unilateral fuerte y simétrico sin calambres',
  'handstand 30–60 s',
  'trail 23 km disfrutable',
  'natación 1.500–2.000 m',
  'MTB 3–4 h',
  'yoga avanzado',
];

export const DASHBOARD_KPIS = {
  weekly: [
    'peso medio 7 d',
    'sesiones prioritarias ≥ 85 %',
    'RPE/energía/sueño',
    'síntomas aductor/muñeca',
    'minutos aeróbicos',
    'marcas de fuerza cada 1–2 semanas',
  ],
  every4Weeks: [
    'composición',
    'torso submáximo a RIR fijo',
    'split squat/step-up + bilateral',
    'sesión fácil estándar comparada',
    'vídeo handstand + movilidad',
    'nota de transferencia',
  ],
} as const;
