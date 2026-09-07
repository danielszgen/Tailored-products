// Wrist and adductor microdose (documents 04 and 05) — SPEC §6.6.

export interface MicrodoseBlock {
  block: string;
  content: string;
  dose: string;
  progression: string;
}

export const WRIST_MICRODOSE = {
  title: 'Muñecas',
  minutes: [8, 12] as [number, number],
  perWeek: '3×/semana (2–4 según 05)',
  blocks: [
    {
      block: 'Movilidad',
      content: 'Círculos, flex/extensión suave, prono/supinación',
      dose: '2–3 min',
      progression: '—',
    },
    {
      block: 'Carga isométrica',
      content: 'Apoyos progresivos pared/banco/suelo',
      dose: '3×20–30 s',
      progression: 'Más rango antes que más carga',
    },
    {
      block: 'Fuerza',
      content:
        'Extensión excéntrica 2×12/lado; flexión 2×12/lado; prono/supinación 2×10/lado; extensor de dedos con banda 2×20; rocking en apoyo 2×8',
      dose: '—',
      progression: '+0,5–1 kg cuando sea fácil y sin dolor; palanca antes que peso',
    },
    {
      block: 'Handstand prep',
      content: 'Lean o apoyo técnico',
      dose: '2–4 series cortas',
      progression: 'Sin dolor creciente',
    },
  ] as readonly MicrodoseBlock[],
  alert:
    'Dolor localizado persistente, pérdida de fuerza, hormigueo o limitación creciente → valoración profesional antes de seguir aumentando apoyos/lastre.',
} as const;

export const ADDUCTOR_MICRODOSE = {
  title: 'Aductores',
  perWeek: '2–3×/semana',
  exercises: [
    'Copenhagen corto isométrico 2×20–30 s/lado',
    'aducción en polea 2×10–15/lado',
    'lateral lunge 2×6–10/lado',
    'adductor rock-back 1×8/lado',
  ] as readonly string[],
  beforeLower:
    'Antes de Lower: 5–8 min general + movilidad dinámica cadera/tobillo + isométricos de aductor de baja dosis + series de aproximación.',
  afterLower:
    'Después: respiración + movilidad suave; registrar si aparece calambre y a qué intensidad.',
  alert:
    'Calambres frecuentes, severos, con dolor/hinchazón/debilidad o que no mejoran → evaluación profesional.',
} as const;

/** "Movilidad mínima semanal". */
export const WEEKLY_MOBILITY_MINIMUM: readonly string[] = [
  "2× yoga/movilidad 40–60'",
  "3× muñeca 8–12'",
  '2× tobillo/cadera pre-Lower',
  '1× sesión regenerativa',
];
