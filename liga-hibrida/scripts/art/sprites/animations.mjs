/**
 * The four animations SPEC §9 Etapa IV asks for: entering the gym, earning a medal, evolving a
 * Forma and the PV pulse. Each one is a horizontal sheet of equal frames; the runtime steps
 * through it with `steps()` so there is no JavaScript animation loop and nothing to drop.
 *
 * Indexed PNGs have one transparent index and no alpha channel, so fades are dithered — which is
 * how 16-bit hardware faded anyway.
 */
import { Sprite } from '../lib/sprite.mjs';
import { RAMPS } from '../lib/palette.mjs';

// ---- entering the gym -------------------------------------------------------------------------

export const GATE_W = 64;
export const GATE_H = 48;
export const GATE_FRAMES = 8;

/**
 * A stone gate whose two doors slide apart on the light inside. Played over the gym colour when
 * a Combate starts, so the screen change reads as walking in.
 */
export function gymGate() {
  const frames = [];
  for (let f = 0; f < GATE_FRAMES; f++) {
    const s = new Sprite(GATE_W, GATE_H);
    const t = f / (GATE_FRAMES - 1);

    // The lit interior, brighter as the doors open.
    s.rect(8, 6, 48, 42, 'gold_lo');
    s.rect(12, 10, 40, 38, 'gold');
    if (t > 0.5) s.rect(18, 14, 28, 34, 'gold_hi');

    // Door panels, receding to the sides.
    const open = Math.round(t * 20);
    s.rect(8, 6, 24 - open, 42, 'slate');
    s.rect(32 + open, 6, 24 - open, 42, 'slate');
    s.rect(8, 6, Math.max(0, 24 - open - 2), 42, 'gray');
    s.rect(34 + open, 6, Math.max(0, 22 - open), 42, 'gray');

    // Stone frame on top of everything, dark enough to read against both doors and light.
    s.rect(4, 2, 56, 4, 'ink_hi');
    s.rect(4, 2, 6, 46, 'ink_hi');
    s.rect(54, 2, 6, 46, 'ink_hi');
    s.rect(4, 2, 56, 1, 'rock');
    s.rect(58, 2, 2, 46, 'night');

    frames.push(s.outline('ink'));
  }
  return Sprite.sheet(frames);
}

// ---- earning a medal --------------------------------------------------------------------------

export const BURST_SIZE = 32;
export const BURST_FRAMES = 8;

/**
 * An overlay, not a medal: an expanding gold ring with sparks, drawn on top of whichever medal
 * the screen already shows. The outer rings thin out with dithering so the burst dies away.
 */
export function medalBurst() {
  const frames = [];
  for (let f = 0; f < BURST_FRAMES; f++) {
    const s = new Sprite(BURST_SIZE, BURST_SIZE);
    const r = 3 + f * 2;
    const sparse = f >= BURST_FRAMES / 2;
    for (let y = 0; y < BURST_SIZE; y++) {
      for (let x = 0; x < BURST_SIZE; x++) {
        const dx = x - 15.5;
        const dy = y - 15.5;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < r - 1 || d > r + 0.5) continue;
        if (sparse && (x + y) % 2 === 0) continue;
        s.px(x, y, f < 3 ? 'white' : f < 6 ? 'gold_hi' : 'gold');
      }
    }
    // Four sparks flying out along the diagonals.
    const k = Math.round(4 + f * 2.2);
    for (const [sx, sy] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      s.px(16 + sx * k, 16 + sy * k, f < 5 ? 'white' : 'gold_hi');
    }
    frames.push(s);
  }
  return Sprite.sheet(frames);
}

// ---- evolving a Forma -------------------------------------------------------------------------

export const EVOLVE_W = 32;
export const EVOLVE_H = 48;
export const EVOLVE_FRAMES = 8;

/**
 * A silhouette flash the size of the avatar: the screen crossfades the two Formas underneath it,
 * so one sheet serves every Forma pair instead of six bespoke sequences.
 */
export function evolutionFlash() {
  const frames = [];
  for (let f = 0; f < EVOLVE_FRAMES; f++) {
    const s = new Sprite(EVOLVE_W, EVOLVE_H);
    const t = f / (EVOLVE_FRAMES - 1);
    // Vertical light column that widens, then rising motes.
    const half = Math.round(2 + t * 13);
    const color = f < 4 ? 'white' : 'gold_hi';
    for (let y = 0; y < EVOLVE_H; y++) {
      const taper = Math.round(half * (0.55 + 0.45 * Math.sin((y / EVOLVE_H) * Math.PI)));
      for (let x = 16 - taper; x < 16 + taper; x++) {
        // Past halfway the column thins into a checkerboard, which is how the flash fades.
        if (f >= 4 && (x + y) % 2 === 0) continue;
        s.px(x, y, color);
      }
    }
    for (let i = 0; i < 6; i++) {
      const y = EVOLVE_H - 2 - ((f * 5 + i * 8) % EVOLVE_H);
      s.px(4 + ((i * 7 + f) % 24), y, 'gold');
    }
    frames.push(s);
  }
  return Sprite.sheet(frames);
}

// ---- the PV pulse -----------------------------------------------------------------------------

export const PV_SIZE = 16;
export const PV_FRAMES = 4;
export const PV_STATES = { ok: 'control', cargado: 'aventura', ko: 'fuerza' };

/**
 * The PV orb, one sheet per state (SPEC §4.1 OK / CARGADO / KO). It breathes: four frames that
 * grow by one pixel and back, which reads as alive without ever pulling the eye.
 */
export function pvPulse(state) {
  const ramp = PV_STATES[state];
  if (!ramp) throw new Error(`Unknown PV state: ${state}`);
  const frames = [];
  for (let f = 0; f < PV_FRAMES; f++) {
    const s = new Sprite(PV_SIZE, PV_SIZE);
    const r = [5, 6, 6, 5][f];
    s.ellipse(7, 7, r, r, ramp);
    s.ellipse(5, 5, Math.max(1, r - 3), Math.max(1, r - 3), `${ramp}_hi`);
    if (f === 1 || f === 2) s.ellipse(7, 7, r, r, `${ramp}_hi`, { fill: false });
    frames.push(s.emboss(RAMPS).outline('ink'));
  }
  return Sprite.sheet(frames);
}
