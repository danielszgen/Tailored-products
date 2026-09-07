// Constitution (document 00) — SPEC §6.1, plus the global traffic light and review rules of §6.2.

export type HierarchyLevel = 1 | 2 | 3 | 4 | 5;

export interface HierarchyEntry {
  level: HierarchyLevel;
  name: string;
  action: string;
}

/** "Jerarquía cuando los objetivos chocan" — every advisory is tagged with the level it protects. */
export const HIERARCHY: readonly HierarchyEntry[] = [
  { level: 1, name: 'Salud / técnica', action: 'se modifica o detiene la carga.' },
  { level: 2, name: 'Recuperación', action: 'se reduce volumen antes que calidad técnica.' },
  { level: 3, name: 'Objetivo de fase', action: 'recibe las mejores franjas y energía.' },
  { level: 4, name: 'Mantenimiento', action: 'dosis mínima efectiva.' },
  { level: 5, name: 'Juego / deporte', action: 'se conserva ajustando intensidad.' },
];

export function hierarchyName(level: HierarchyLevel): string {
  return HIERARCHY.find((h) => h.level === level)?.name ?? `Nivel ${level}`;
}

export interface GoldenRule {
  id: number;
  name: string;
  text: string;
}

/** "Las 8 reglas". */
export const GOLDEN_RULES: readonly GoldenRule[] = [
  { id: 1, name: 'Función antes que ego', text: 'Función antes que ego.' },
  { id: 2, name: 'Interferencia controlada', text: 'Interferencia controlada.' },
  {
    id: 3,
    name: 'Variedad con propósito',
    text: 'Los deportes cuentan como entrenamiento, se integran.',
  },
  { id: 4, name: 'Piernas prioritarias', text: 'Piernas prioritarias.' },
  { id: 5, name: 'Muñecas entrenables', text: 'Dolor persistente no se normaliza.' },
  { id: 6, name: 'Base aeróbica primero', text: 'Base aeróbica primero.' },
  { id: 7, name: 'Comer para adaptarse', text: 'Comer para adaptarse.' },
  {
    id: 8,
    name: 'Diversión sostenible',
    text: '≥ 1 sesión/semana elegida por disfrute.',
  },
];

export const REVIEW_CADENCE = 'Revisión: cada 4–6 semanas.';

/** "Semáforo global" (SPEC §6.2). */
export const GLOBAL_TRAFFIC_LIGHT = {
  verde:
    'VERDE (rendimiento estable/sube, sueño bueno, síntomas ≤ 2/10 que desaparecen rápido) → progresar.',
  ambar:
    'ÁMBAR (2+ señales de fatiga 4–7 días; molestias que aumentan; apatía; pérdida de rendimiento) → −20–30 % volumen, mantener técnica, reevaluar.',
  rojo: 'ROJO (dolor agudo, inflamación, debilidad, síntomas neurológicos, dolor persistente) → detener la carga implicada y buscar valoración profesional.',
} as const;

/** "Reglas de revisión" (SPEC §6.2). */
export const REVIEW_RULES: readonly string[] = [
  'No cambiar el plan por una mala sesión aislada.',
  'Una variable principal cada vez (volumen, intensidad, frecuencia o calorías).',
  '2 semanas de estancamiento con buena recuperación → progresar; con fatiga → descargar.',
];
