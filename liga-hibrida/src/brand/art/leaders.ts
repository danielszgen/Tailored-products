import type { GymId } from '@/domain/types';

/**
 * The four gym leaders of Etapa IV.
 *
 * SPEC §9 asks for "4 líderes de gimnasio" without naming them, and nothing in §4.1 or §6.5
 * does either, so these names are new brand content rather than anything taken from the
 * training documents — see docs/PREGUNTAS.md, Daniel has the last word on them. Each one is a
 * Spanish noun that echoes its gym: the quarry's rock, the forge, the spring and the ledge.
 */
export const LEADER_NAMES: Record<GymId, string> = {
  cantera: 'Basalto',
  yunque: 'Fragua',
  resorte: 'Muelle',
  vertigo: 'Cornisa',
};

/** One line of flavour per leader, shown under the name on the gym card. */
export const LEADER_TAGLINES: Record<GymId, string> = {
  cantera: 'Guarda la cantera. Sin piernas no hay liga.',
  yunque: 'Golpea el torso hasta que aguante.',
  resorte: 'Todo lo que baja tiene que volver a subir.',
  vertigo: 'Arriba se aprende a no caerse.',
};
