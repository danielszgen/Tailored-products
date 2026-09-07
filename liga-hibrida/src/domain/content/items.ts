// Mochila (objects) and recovery (documents 04 and 06) — SPEC §6.8.

export interface BackpackItem {
  id: string;
  name: string;
  rule: string;
  /** The only daily habit with a tick (creatina). */
  daily?: boolean;
}

export const BACKPACK_ITEMS: readonly BackpackItem[] = [
  {
    id: 'creatina',
    name: 'Creatina monohidrato',
    rule: '3–5 g/día, diaria, el momento no importa',
    daily: true,
  },
  { id: 'whey', name: 'Whey/caseína', rule: 'Opcional; solo para llegar al total de proteína' },
  {
    id: 'cafeina',
    name: 'Cafeína',
    rule: '~1–3 mg/kg antes de sesiones clave; evitar si afecta sueño',
  },
  {
    id: 'electrolitos',
    name: 'Electrolitos/sodio',
    rule: 'Sesiones largas, calor, sudor elevado, sauna',
  },
  { id: 'b12', name: 'Vitamina B12', rule: 'Según pauta; no aumentar "por rendimiento"' },
  { id: 'd_omega3', name: 'Vitamina D / Omega-3', rule: 'No automáticos; por analítica/dieta' },
  {
    id: 'sauna',
    name: 'Sauna',
    rule: 'Entrar hidratado; reponer después; si mareo/cefalea, dosis excesiva',
  },
  {
    id: 'frio',
    name: 'Frío/contraste',
    rule: 'Separado de la sesión de fuerza si la prioridad es hipertrofia',
  },
  { id: 'siesta', name: 'Siesta', rule: '15–30 min si ayuda y no estropea la noche' },
  { id: 'paseo', name: 'Paseo', rule: '10–30 min tras comida o por la tarde' },
  {
    id: 'batido',
    name: 'Batido de ganancia',
    rule: 'Leche + plátano + whey/yogur + avena + crema de cacahuete + miel si falta CH; no sustituye comidas',
  },
];

export const NOT_NEEDED: readonly string[] = [
  'BCAA',
  'mass gainers',
  'pre-entrenos',
  'quemagrasas',
  'detox',
];

/** "Orden de importancia" of recovery. */
export const RECOVERY_ORDER: readonly string[] = [
  'sueño 8–8,5 h',
  'energía/comida',
  'hidratación',
  'gestión de carga',
  'movilidad/paseo',
  'sauna/contraste',
];

export interface MorningCheckRow {
  signal: string;
  verde: string;
  ambar: string;
  rojo: string;
}

/** "Chequeo matinal de 30 s". */
export const MORNING_CHECK: readonly MorningCheckRow[] = [
  { signal: 'Sueño', verde: '≥ 7,5–8 h sólido', ambar: '6–7,5 h', rojo: 'Muy pobre + somnolencia' },
  { signal: 'Piernas', verde: 'Normales', ambar: 'Pesadas', rojo: 'Dolor / fatiga profunda' },
  {
    signal: 'Muñecas',
    verde: 'Sin aumento de dolor',
    ambar: 'Rigidez leve',
    rojo: 'Dolor creciente',
  },
  {
    signal: 'Motivación',
    verde: 'Normal',
    ambar: 'Baja puntual',
    rojo: 'Rechazo + rendimiento bajo',
  },
  { signal: 'Peso/apetito', verde: 'Estables', ambar: 'Apetito bajo', rojo: 'Pérdida no buscada' },
];

export const MORNING_DECISION: readonly string[] = [
  '1 ámbar → entrenar y observar.',
  '2–3 ámbar → −20–30 % volumen o convertir B/C en recuperación.',
  '1 rojo claro → modificar la sesión.',
  'Varios rojos → descanso y revisión.',
];
