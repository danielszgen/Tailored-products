// Formas I–IV (phases) — SPEC §6.3.
import type { Form } from '../types';

export interface FormSpec {
  form: Form;
  name: string;
  fullName: string;
  period: string;
  objective: string;
  evolutionCondition: string;
}

export const FORMS: Record<Form, FormSpec> = {
  1: {
    form: 1,
    name: 'Base',
    fullName: 'Forma I · Base',
    period: 'Sep–Nov 2026',
    objective: 'Piernas, tolerancia aductores/muñecas, base aeróbica, baseline',
    evolutionCondition:
      'Piernas entrenables sin calambres recurrentes; muñecas toleran apoyos; 90–150 min/sem aeróbico fácil; peso e ingesta monitorizados',
  },
  2: {
    form: 2,
    name: 'Construcción',
    fullName: 'Forma II · Construcción',
    period: 'Dic 2026–Mar 2027',
    objective: 'Hipertrofia global con énfasis piernas + carrera fácil',
    evolutionCondition:
      'Mejora visible de masa y piernas; fuerza unilateral claramente superior; carrera fácil estable; primera salida trail sin vaciar piernas',
  },
  3: {
    form: 3,
    name: 'Integración',
    fullName: 'Forma III · Integración',
    period: 'Abr–Ago 2027',
    objective: 'Transferir masa/fuerza a trail, MTB y skills',
    evolutionCondition:
      'Físico más atlético; tren inferior ya no es cuello de botella; 15–23 km trail; handstand y movilidad mejoran',
  },
  4: {
    form: 4,
    name: 'Híbrido',
    fullName: 'Forma IV · Híbrido',
    period: 'Sep 2027–Sep 2029',
    objective: 'Bloques alternos',
    evolutionCondition: 'Alternar bloques sin reconstruir desde cero',
  },
};

export const FORM_ORDER: readonly Form[] = [1, 2, 3, 4];

export const EVOLUTION_RULE =
  'La evolución se propone cuando se cumplen las condiciones, nunca solo por fecha. Daniel confirma manualmente.';
