// The four gyms — transcribed verbatim from docs/SPEC.md §6.5 (document 05).
// Pure data: no rules live here.
import type { ExerciseSpec, GymId, GymSpec, SessionVersion, WarmupItem } from '../types';

export const GYM_ORDER: readonly GymId[] = ['cantera', 'yunque', 'resorte', 'vertigo'];

export const GYM_NAMES: Record<GymId, string> = {
  cantera: 'Cantera',
  yunque: 'Yunque',
  resorte: 'Resorte',
  vertigo: 'Vértigo',
};

export const SESSION_CODE_LABEL: Record<GymId, string> = {
  cantera: 'LOWER A',
  yunque: 'UPPER A',
  resorte: 'LOWER B',
  vertigo: 'UPPER B',
};

// ---------------------------------------------------------------------------
// Warm-ups (obligatory; SPEC: "no se puede saltar")
// ---------------------------------------------------------------------------

const CANTERA_WARMUP: WarmupItem[] = [
  { id: 'cantera_wu_bike', name: 'Bicicleta/remo suave', dose: '4 min', cue: 'subir temperatura' },
  {
    id: 'cantera_wu_knee_to_wall',
    name: 'Knee-to-wall tobillo',
    dose: '1×8/lado',
    cue: 'talón pegado',
  },
  {
    id: 'cantera_wu_adductor_rockback',
    name: 'Adductor rock-back',
    dose: '1×8/lado',
    cue: 'rango cómodo',
    tags: ['adductor'],
  },
  {
    id: 'cantera_wu_copenhagen_iso',
    name: 'Copenhagen corto isométrico',
    dose: '2×15–20 s/lado',
    cue: 'sin dolor, pelvis estable',
    tags: ['adductor'],
  },
  {
    id: 'cantera_wu_paused_squat',
    name: 'Sentadilla peso corporal con pausa',
    dose: '2×6',
    cue: '2 s abajo',
    tags: ['ramp_up'],
  },
];

const YUNQUE_WARMUP: WarmupItem[] = [
  {
    id: 'yunque_wu_wrist_rocking',
    name: 'Rocking de muñeca en cuadrupedia',
    dose: '2×8 direcciones',
    cue: 'rango cómodo',
    tags: ['wrist_support'],
  },
  {
    id: 'yunque_wu_pronosupination',
    name: 'Prono/supinación con mancuerna ligera',
    dose: '1×10/lado',
    cue: 'ligero y controlado',
    tags: ['wrist_support'],
  },
  {
    id: 'yunque_wu_pull_apart_scap',
    name: 'Band pull-apart + scapular pull-up',
    dose: '1×15 + 1×8',
    cue: 'escápula activa',
  },
  {
    id: 'yunque_wu_ramp_up',
    name: 'Series de aproximación press + dominada',
    dose: '2–4 series',
    cue: 'subir carga sin fatiga',
    tags: ['ramp_up'],
  },
];

const RESORTE_WARMUP: WarmupItem[] = [
  { id: 'resorte_wu_bike', name: 'Bici suave', dose: '3 min', cue: 'subir temperatura' },
  { id: 'resorte_wu_hip_switch', name: '90/90 hip switches', dose: '1×8', cue: 'cadera suelta' },
  {
    id: 'resorte_wu_adductor_rockback',
    name: 'Adductor rock-back',
    dose: '1×8/lado',
    cue: 'rango cómodo',
    tags: ['adductor'],
  },
  {
    id: 'resorte_wu_pogo',
    name: 'Pogo hops o saltos bajos',
    dose: '2×15–20 contactos · 45–60 s descanso',
    cue: 'elástico y silencioso',
    tags: ['jump'],
  },
  {
    id: 'resorte_wu_box_jump',
    name: 'Box jump / broad jump submáximo',
    dose: '3×3 · 60–75 s',
    cue: 'parar si pierdes altura',
    tags: ['jump'],
  },
];

const VERTIGO_WARMUP: WarmupItem[] = [
  {
    id: 'vertigo_wu_wrist_finger',
    name: 'Rocking de muñeca + finger pulses',
    dose: '1–2×8 + 10',
    cue: 'solo rango cómodo',
    tags: ['wrist_support'],
  },
  {
    id: 'vertigo_wu_wall_handstand',
    name: 'Wall handstand pecho a pared',
    dose: '4×20–40 s',
    cue: 'bajar antes de colapsar',
    tags: ['handstand', 'wrist_support'],
  },
  {
    id: 'vertigo_wu_shoulder_shift',
    name: 'Shift de hombros / toe pulls',
    dose: '2×4–6',
    cue: 'solo si la muñeca está tranquila (muñeca ≤ 2 hoy)',
    tags: ['handstand', 'wrist_support'],
  },
];

// ---------------------------------------------------------------------------
// Main work
// ---------------------------------------------------------------------------

const CANTERA_MAIN: ExerciseSpec[] = [
  {
    id: 'hack_squat',
    name: 'Hack squat o goblet squat con talones elevados',
    slot: 'A1',
    sets: 4,
    repMin: 6,
    repMax: 8,
    rirTarget: [3, 2],
    restSec: [150, 180],
    note: '3 s bajada, pausa suave, subir firme',
    types: ['fuerza', 'masa'],
    loadStepKg: 5,
    alternatives: ['Goblet squat con talones elevados (paso 2 kg)'],
  },
  {
    id: 'romanian_deadlift',
    name: 'Peso muerto rumano',
    slot: 'A2',
    sets: 3,
    repMin: 6,
    repMax: 8,
    rirTarget: 2,
    restSec: [120, 150],
    note: 'Cadera atrás, columna neutra',
    types: ['fuerza', 'masa'],
    loadStepKg: 5,
  },
  {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian split squat',
    slot: 'A3',
    sets: 3,
    repMin: 8,
    repMax: 8,
    perSide: true,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Rodilla sigue línea del pie',
    types: ['fuerza', 'masa'],
    loadStepKg: 2,
    accessory: true,
  },
  {
    id: 'leg_press_or_extension',
    name: 'Prensa / extensión de rodilla',
    slot: 'A4',
    sets: 2,
    repMin: 10,
    repMax: 12,
    rirTarget: 2,
    restSec: [75, 75],
    note: 'Volumen, no grind',
    types: ['masa'],
    loadStepKg: 5,
    accessory: true,
  },
  {
    id: 'standing_calf_raise',
    name: 'Elevación de gemelo de pie',
    slot: 'A5',
    sets: 3,
    repMin: 10,
    repMax: 15,
    rirTarget: [1, 2],
    restSec: [60, 60],
    note: '1 s arriba + estiramiento abajo',
    types: ['masa'],
    loadStepKg: 5,
    accessory: true,
  },
  {
    id: 'copenhagen_or_cable_adduction',
    name: 'Copenhagen corto o aducción en polea',
    slot: 'A6',
    sets: 2,
    repMin: 12,
    repMax: 12,
    isometric: true,
    secondsMin: 20,
    secondsMax: 30,
    perSide: true,
    rirTarget: [2, 3],
    restSec: [45, 45],
    note: 'Aductor específico',
    types: ['fuerza'],
    loadStepKg: 2.5,
    accessory: true,
    alternatives: ['Aducción en polea 2×12'],
  },
];

const YUNQUE_MAIN: ExerciseSpec[] = [
  {
    id: 'bench_press',
    name: 'Press banca',
    slot: 'A1',
    sets: 4,
    repMin: 5,
    repMax: 8,
    rirTarget: 2,
    restSec: [150, 180],
    note: 'Pausa breve en pecho',
    types: ['fuerza', 'masa'],
    loadStepKg: 2.5,
  },
  {
    id: 'weighted_pullup',
    name: 'Dominada lastrada',
    slot: 'A2',
    sets: 4,
    repMin: 5,
    repMax: 8,
    rirTarget: 2,
    restSec: [150, 180],
    note: 'Inicio escapular; lastre = carga',
    types: ['fuerza', 'masa'],
    loadStepKg: 2.5,
    weightedBodyweight: true,
  },
  {
    id: 'incline_db_press',
    name: 'Press inclinado con mancuernas',
    slot: 'A3',
    sets: 3,
    repMin: 8,
    repMax: 10,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Agarre cómodo para muñeca',
    types: ['masa'],
    loadStepKg: 2,
    accessory: true,
  },
  {
    id: 'chest_supported_row',
    name: 'Remo pecho apoyado',
    slot: 'A4',
    sets: 3,
    repMin: 8,
    repMax: 12,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Sin compensación lumbar',
    types: ['masa'],
    loadStepKg: 2.5,
    accessory: true,
  },
  {
    id: 'lateral_raise',
    name: 'Elevación lateral',
    slot: 'A5',
    sets: 3,
    repMin: 12,
    repMax: 20,
    rirTarget: [1, 2],
    restSec: [45, 60],
    note: 'Control',
    types: ['masa'],
    loadStepKg: 1,
    accessory: true,
  },
  {
    id: 'curl_triceps_superset',
    name: 'Curl + tríceps cuerda (superset)',
    slot: 'A6',
    sets: 2,
    repMin: 10,
    repMax: 15,
    rirTarget: [1, 2],
    restSec: [30, 30],
    note: 'Estético y eficiente',
    types: ['masa'],
    loadStepKg: 2.5,
    accessory: true,
    superset: '2×10–15 cada (curl y tríceps cuerda)',
  },
];

const RESORTE_MAIN: ExerciseSpec[] = [
  {
    id: 'trap_bar_deadlift',
    name: 'Trap-bar deadlift',
    slot: 'B1',
    sets: 4,
    repMin: 4,
    repMax: 6,
    rirTarget: [3, 2],
    restSec: [150, 180],
    note: 'Potente, sin reps lentas',
    types: ['fuerza', 'aventura'],
    loadStepKg: 5,
  },
  {
    id: 'front_foot_elevated_split_squat',
    name: 'Split squat con pie delantero elevado',
    slot: 'B2',
    sets: 3,
    repMin: 8,
    repMax: 8,
    perSide: true,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Profundidad progresiva',
    types: ['fuerza', 'aventura'],
    loadStepKg: 2,
  },
  {
    id: 'hip_thrust',
    name: 'Hip thrust',
    slot: 'B3',
    sets: 3,
    repMin: 8,
    repMax: 10,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Bloqueo con glúteo',
    types: ['fuerza', 'masa'],
    loadStepKg: 5,
    accessory: true,
  },
  {
    id: 'hamstring_curl',
    name: 'Curl femoral sentado/tumbado',
    slot: 'B4',
    sets: 3,
    repMin: 10,
    repMax: 12,
    rirTarget: [1, 2],
    restSec: [75, 75],
    note: 'Excéntrica controlada',
    types: ['masa'],
    loadStepKg: 2.5,
    accessory: true,
  },
  {
    id: 'lateral_lunge',
    name: 'Lateral lunge',
    slot: 'B5',
    sets: 2,
    repMin: 8,
    repMax: 8,
    perSide: true,
    rirTarget: 3,
    restSec: [60, 60],
    note: 'Plano frontal',
    types: ['aventura', 'fuerza'],
    loadStepKg: 2,
    accessory: true,
  },
  {
    id: 'tibialis_calf_seated',
    name: 'Tibialis raise + gemelo sentado',
    slot: 'B6',
    sets: 2,
    repMin: 15,
    repMax: 20,
    rirTarget: 2,
    restSec: [45, 45],
    note: 'Tobillo útil',
    types: ['aventura'],
    loadStepKg: 2.5,
    accessory: true,
    superset: '2×15–20 tibialis + 12–15 gemelo sentado',
  },
];

const VERTIGO_MAIN: ExerciseSpec[] = [
  {
    id: 'weighted_dip',
    name: 'Fondos lastrados',
    slot: 'B1',
    sets: 4,
    repMin: 6,
    repMax: 8,
    rirTarget: 2,
    restSec: [120, 150],
    note: 'Baseline +20 kg como referencia, no obligación',
    types: ['fuerza', 'control'],
    loadStepKg: 2.5,
    weightedBodyweight: true,
  },
  {
    id: 'chinup_neutral',
    name: 'Chin-up / dominada neutra',
    slot: 'B2',
    sets: 3,
    repMin: 6,
    repMax: 10,
    rirTarget: 2,
    restSec: [120, 120],
    note: 'Alternar agarre según codo/muñeca',
    types: ['fuerza', 'control'],
    loadStepKg: 2.5,
    weightedBodyweight: true,
  },
  {
    id: 'db_military_or_landmine_press',
    name: 'Press militar mancuernas o landmine press',
    slot: 'B3',
    sets: 3,
    repMin: 8,
    repMax: 10,
    rirTarget: 2,
    restSec: [90, 90],
    note: 'Variante amable con muñeca',
    types: ['fuerza', 'control'],
    loadStepKg: 2,
    accessory: true,
  },
  {
    id: 'single_arm_cable_row',
    name: 'Remo cable unilateral',
    slot: 'B4',
    sets: 3,
    repMin: 10,
    repMax: 12,
    perSide: true,
    rirTarget: 2,
    restSec: [75, 75],
    note: 'Control escapular',
    types: ['control', 'fuerza'],
    loadStepKg: 2.5,
    accessory: true,
  },
  {
    id: 'reverse_fly_face_pull',
    name: 'Reverse fly / face pull',
    slot: 'B5',
    sets: 2,
    repMin: 15,
    repMax: 20,
    rirTarget: 2,
    restSec: [45, 45],
    note: 'Deltoide posterior',
    types: ['control'],
    loadStepKg: 2.5,
    accessory: true,
  },
  {
    id: 'lateral_raise_hammer_curl_superset',
    name: 'Elevación lateral + curl martillo (superset)',
    slot: 'B6',
    sets: 2,
    repMin: 15,
    repMax: 20,
    rirTarget: [1, 2],
    restSec: [30, 30],
    note: 'Corto',
    types: ['masa'],
    loadStepKg: 1,
    accessory: true,
    superset: '2×15–20 elevación lateral + 10–15 curl martillo',
  },
  {
    id: 'hanging_knee_raise_dead_bug',
    name: 'Hanging knee raise / dead bug',
    slot: 'B7',
    sets: 3,
    repMin: 8,
    repMax: 15,
    rirTarget: 2,
    restSec: [45, 45],
    note: 'Core sin fallo · 2–3 series',
    types: ['control'],
    loadStepKg: 0,
    accessory: true,
  },
];

// ---------------------------------------------------------------------------
// Gyms
// ---------------------------------------------------------------------------

export const GYMS: Record<GymId, GymSpec> = {
  cantera: {
    id: 'cantera',
    name: 'Cantera',
    sessionCode: 'LOWER_A',
    goal: 'sentadilla, cuádriceps y aductores',
    cost: 'alto',
    primaryTypes: ['fuerza', 'masa'],
    warmupTitle: 'Calentamiento (9–11 min, obligatorio)',
    warmupMinutes: [9, 11],
    warmup: CANTERA_WARMUP,
    main: CANTERA_MAIN,
    fuelPre:
      'Pre 90–150’ → 30–40 g proteína + 80–120 g CH (arroz + pollo + fruta; o yogur + avena + plátano + miel). Al levantarse: 20–30 g prot + 40–70 g CH (batido + plátano + tostadas/miel). 500–750 ml agua en 2 h previas; sodio si sauna.',
    fuelPost: 'Post 0–2 h → 30–40 g prot + 80–120 g CH.',
    versions: {
      min45: [
        'hack_squat',
        'romanian_deadlift',
        'bulgarian_split_squat',
        'copenhagen_or_cable_adduction',
      ],
      min60: [
        'hack_squat',
        'romanian_deadlift',
        'bulgarian_split_squat',
        'leg_press_or_extension',
        'copenhagen_or_cable_adduction',
      ],
      min75: [
        'hack_squat',
        'romanian_deadlift',
        'bulgarian_split_squat',
        'leg_press_or_extension',
        'standing_calf_raise',
        'copenhagen_or_cable_adduction',
      ],
    },
    versionNotes: {
      min45: "45' = calentamiento + A1, A2, A3 + A6.",
      min60: "60' = todo salvo A5 si vas justo.",
      min75:
        "75' = todo + correctivos + 8–12' natación muy suave opcional (no añadir series duras).",
    },
    transitionNote:
      'Transición a sentadilla con barra: si 3–4 semanas de patrón estable y calambres post-sentadilla desaparecen o bajan claramente (aductor después ≤ 2 en 3 semanas seguidas), la app ofrece sustituir A1 por high-bar squat 3–4×5–8 RIR 3→2. Si el síntoma vuelve, regresa a la variante tolerada.',
  },
  yunque: {
    id: 'yunque',
    name: 'Yunque',
    sessionCode: 'UPPER_A',
    goal: 'fuerza y masa de torso',
    cost: 'medio',
    primaryTypes: ['fuerza', 'masa'],
    warmupTitle: 'Preparación de muñeca y escápula (7–9 min, obligatoria)',
    warmupMinutes: [7, 9],
    warmup: YUNQUE_WARMUP,
    main: YUNQUE_MAIN,
    fuelPre: 'Pre 25–35 g prot + 60–90 g CH; si comida completa 2–3 h antes, una fruta basta.',
    fuelPost: 'Post 25–40 g prot + 60–100 g CH (extremo alto si hay natación o Z2 el mismo día).',
    versions: {
      min45: ['bench_press', 'weighted_pullup', 'incline_db_press', 'chest_supported_row'],
      min60: [
        'bench_press',
        'weighted_pullup',
        'incline_db_press',
        'chest_supported_row',
        'lateral_raise',
      ],
      min75: [
        'bench_press',
        'weighted_pullup',
        'incline_db_press',
        'chest_supported_row',
        'lateral_raise',
        'curl_triceps_superset',
      ],
    },
    versionNotes: {
      min45: "45' = prep + A1, A2, A3 + A4.",
      min60: "60' = todo salvo A6.",
      min75: "75' = todo.",
    },
  },
  resorte: {
    id: 'resorte',
    name: 'Resorte',
    sessionCode: 'LOWER_B',
    goal: 'cadena posterior, unilateral y potencia',
    cost: 'alto',
    primaryTypes: ['fuerza', 'aventura'],
    warmupTitle: 'Calentamiento y potencia (10–12 min, obligatorio)',
    warmupMinutes: [10, 12],
    warmup: RESORTE_WARMUP,
    main: RESORTE_MAIN,
    fuelPre:
      'Como Cantera (80–120 g CH + 30–40 g prot pre si hay 90–150’). No llegar bajo de CH a saltos + trap bar.',
    fuelPost: 'Post 30–40 g prot + 80–120 g CH; extremo alto si mañana hay trail/MTB.',
    versions: {
      min45: [
        'trap_bar_deadlift',
        'front_foot_elevated_split_squat',
        'hip_thrust',
        'lateral_lunge',
      ],
      min60: [
        'trap_bar_deadlift',
        'front_foot_elevated_split_squat',
        'hip_thrust',
        'hamstring_curl',
        'lateral_lunge',
      ],
      min75: [
        'trap_bar_deadlift',
        'front_foot_elevated_split_squat',
        'hip_thrust',
        'hamstring_curl',
        'lateral_lunge',
        'tibialis_calf_seated',
      ],
    },
    versionNotes: {
      min45: "45' = calentamiento/potencia + B1, B2, B3 + B5.",
      min60: "60' = todo salvo B6 si vas justo.",
      min75: "75' = todo + correctivos.",
    },
  },
  vertigo: {
    id: 'vertigo',
    name: 'Vértigo',
    sessionCode: 'UPPER_B',
    goal: 'calistenia, hombro y handstand',
    cost: 'medio',
    primaryTypes: ['control', 'fuerza'],
    warmupTitle:
      'Bloque técnico de muñeca + handstand (10–12 min, obligatorio, va primero porque se hace fresco)',
    warmupMinutes: [10, 12],
    warmup: VERTIGO_WARMUP,
    main: VERTIGO_MAIN,
    fuelPre: 'Pre 25–35 g prot + 50–90 g CH.',
    fuelPost:
      'Post 25–40 g prot + 50–90 g CH (subir si mañana Lower o deporte largo). Si yoga después: 15–30 min de margen.',
    versions: {
      min45: [
        'weighted_dip',
        'chinup_neutral',
        'db_military_or_landmine_press',
        'single_arm_cable_row',
      ],
      min60: [
        'weighted_dip',
        'chinup_neutral',
        'db_military_or_landmine_press',
        'single_arm_cable_row',
        'reverse_fly_face_pull',
        'hanging_knee_raise_dead_bug',
      ],
      min75: [
        'weighted_dip',
        'chinup_neutral',
        'db_military_or_landmine_press',
        'single_arm_cable_row',
        'reverse_fly_face_pull',
        'lateral_raise_hammer_curl_superset',
        'hanging_knee_raise_dead_bug',
      ],
    },
    versionNotes: {
      min45: "45' = bloque técnico + B1, B2, B3 + B4.",
      min60: "60' = todo salvo B6.",
      min75: "75' = todo.",
    },
  },
};

// ---------------------------------------------------------------------------
// Operational text (document 05)
// ---------------------------------------------------------------------------

export const GYM_OPERATIONAL_RULES: readonly string[] = [
  '55–70 min.',
  'Mayoría del trabajo RIR 2–3, solo series finales RIR 1, sin fallo habitual.',
  'Doble progresión (primero reps dentro del rango, luego +2,5–5 % carga).',
  'Si la técnica se degrada, la serie termina.',
  '48–72 h entre Cantera y Resorte.',
  'Upper puede convivir con Z2, natación suave o yoga el mismo día.',
];

export const DOUBLE_PROGRESSION_EXAMPLE =
  'Press banca 4×5–8. Si 8/8/8/8 con RIR 2 y técnica estable → siguiente sesión + incremento mínimo y volver a 5–6 reps. Si 8/8/7/6 → conservar carga.';

export const NO_LOAD_INCREASE_WHEN: readonly string[] = [
  'RIR real por debajo del objetivo 2 sesiones seguidas.',
  'Técnica cambia para salvar la rep.',
  'Dolor articular o calambre de aductor aumenta.',
  'Sesión dura de trail/MTB/surf el día anterior.',
  'Sueño caído varias noches.',
];

export const FATIGUE_ARRIVAL = {
  verde: 'VERDE → plan completo.',
  ambar:
    'ÁMBAR (sueño mediocre / piernas pesadas / deporte previo) → misma técnica, −1 serie en accesorios y RIR +1.',
  rojo: 'ROJO (dolor articular, enfermedad, calambre fuerte recurrente, caída grande de rendimiento) → no forzar: técnica suave, movilidad o descanso.',
} as const;

export const MINIMUM_SESSION_LOG: readonly string[] = [
  'Carga×reps de A1/A2 (o B1/B2) y RIR final.',
  'Energía inicio/fin 1–5.',
  'Muñeca 0–10 durante apoyos.',
  'Aductor 0–10 durante y 30–60 min después de Lower.',
  '"Fácil/normal/pesado".',
  'Deporte en las 24 h previas.',
];

// ---------------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------------

export function getGym(id: GymId): GymSpec {
  return GYMS[id];
}

export function getExercise(gymId: GymId, exerciseId: string): ExerciseSpec | undefined {
  return GYMS[gymId].main.find((e) => e.id === exerciseId);
}

export function findExercise(
  exerciseId: string,
): { gym: GymSpec; exercise: ExerciseSpec } | undefined {
  for (const id of GYM_ORDER) {
    const gym = GYMS[id];
    const exercise = gym.main.find((e) => e.id === exerciseId);
    if (exercise) return { gym, exercise };
  }
  return undefined;
}

const VERSION_KEY: Record<SessionVersion, keyof GymSpec['versions']> = {
  45: 'min45',
  60: 'min60',
  75: 'min75',
};

/** Exercises included in a session version, in slot order. */
export function exercisesForVersion(gym: GymSpec, version: SessionVersion): ExerciseSpec[] {
  const ids = new Set(gym.versions[VERSION_KEY[version]]);
  return gym.main.filter((e) => ids.has(e.id));
}

export function versionNote(gym: GymSpec, version: SessionVersion): string {
  return gym.versionNotes[VERSION_KEY[version]];
}

/** Main lifts are the "registro mínimo" slots (A1/A2, B1/B2); everything else is an accessory. */
export function isMainLift(exercise: ExerciseSpec): boolean {
  return !exercise.accessory;
}

export function formatRir(rir: number | [number, number]): string {
  if (typeof rir === 'number') return String(rir);
  const [a, b] = rir;
  return a > b ? `${a}→${b}` : `${a}–${b}`;
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRest(rest: [number, number]): string {
  const [a, b] = rest;
  return a === b ? mmss(a) : `${mmss(a)}–${mmss(b)}`;
}

export function formatSetsReps(spec: ExerciseSpec): string {
  if (spec.isometric && spec.secondsMin !== undefined && spec.secondsMax !== undefined) {
    const range =
      spec.secondsMin === spec.secondsMax
        ? `${spec.secondsMin} s`
        : `${spec.secondsMin}–${spec.secondsMax} s`;
    return `${spec.sets}×${range}${spec.perSide ? '/lado' : ''}`;
  }
  const reps = spec.repMin === spec.repMax ? `${spec.repMin}` : `${spec.repMin}–${spec.repMax}`;
  const side = spec.perSide ? '/lado' : '';
  const each = spec.superset && spec.superset.includes('cada') ? ' cada' : '';
  return `${spec.sets}×${reps}${side}${each}`;
}

export const ALL_EXERCISES: readonly ExerciseSpec[] = GYM_ORDER.flatMap((id) => GYMS[id].main);
