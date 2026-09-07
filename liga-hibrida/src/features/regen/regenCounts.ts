// Weekly regen counters against the "Movilidad mínima semanal" of SPEC §6.6.
import type { RegenKind, RegenLog } from '@/domain/types';

export const REGEN_KIND_LABELS: Record<RegenKind, string> = {
  yoga: 'Yoga',
  movilidad: 'Movilidad',
  muneca: 'Muñeca',
  aductor: 'Aductor',
  sauna: 'Sauna',
  frio: 'Frío',
  siesta: 'Siesta',
  paseo: 'Paseo',
};

export interface RegenCounts {
  mobility: number;
  wrist: number;
  adductor: number;
  regenerative: number;
}

/** "2× yoga/movilidad · 3× muñeca · 2× tobillo/cadera (aductor) · 1× sesión regenerativa". */
export const WEEKLY_TARGETS: Record<keyof RegenCounts, number> = {
  mobility: 2,
  wrist: 3,
  adductor: 2,
  regenerative: 1,
};

export function countRegen(logs: RegenLog[]): RegenCounts {
  return {
    mobility: logs.filter((g) => g.kind === 'yoga' || g.kind === 'movilidad').length,
    wrist: logs.filter((g) => g.kind === 'muneca').length,
    adductor: logs.filter((g) => g.kind === 'aductor').length,
    regenerative: logs.filter((g) => ['sauna', 'frio', 'siesta', 'paseo'].includes(g.kind)).length,
  };
}
