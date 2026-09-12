/**
 * The palette of the visual bible, derived from the brand tokens (SPEC §4.2).
 *
 * 16-bit arcade art needs a ramp per hue, not a single value, so every brand colour is expanded
 * into `_lo` (shadow), base (light) and `_hi` (highlight). Deriving them from the tokens instead
 * of hand-picking keeps the sprites in step with the app: change a token and re-run `pnpm art`.
 *
 * Light source is top-left throughout, so `_hi` goes up/left and `_lo` down/right.
 */
import { parseHex } from './png.mjs';

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');

/** Linear sRGB mix. Good enough for flat pixel shading and perfectly predictable. */
function mix(a, b, t) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';

/** base → { name_lo, name, name_hi }. */
function ramp(name, base, { shade = 0.34, light = 0.3 } = {}) {
  return {
    [`${name}_lo`]: mix(base, BLACK, shade),
    [name]: base,
    [`${name}_hi`]: mix(base, WHITE, light),
  };
}

// Brand tokens, copied from src/brand/tokens.ts. Kept literal so this script has no build step.
const TYPES = {
  masa: '#8E5CF0',
  fuerza: '#E23D4A',
  motor: '#2F8DFF',
  control: '#22B573',
  aventura: '#E9A82A',
  regen: '#3BB8D6',
};

export const PALETTE = {
  // Reserved: index 0 of every sprite. Never drawn, only left untouched.
  void: '#000000',

  // Outlines and neutrals. `ink` is the single outline colour of the whole bible: one dark
  // contour reads well on the light and the dark theme without two sets of assets.
  ink: '#141B2B',
  ink_hi: '#2B3648',
  night: '#0E1420',
  slate: '#4A5468',
  gray: '#7E8899',
  steel: '#B4BDCC',
  bone: '#EEF2F8',
  white: WHITE,

  ...ramp('gold', '#E9A82A'),
  ...ramp('accent', '#DA3541'),

  ...ramp('masa', TYPES.masa),
  ...ramp('fuerza', TYPES.fuerza),
  ...ramp('motor', TYPES.motor),
  ...ramp('control', TYPES.control),
  ...ramp('aventura', TYPES.aventura),
  ...ramp('regen', TYPES.regen),

  // Character palette: one skin ramp and one hair ramp keep the avatar and the four leaders
  // recognisably from the same world.
  ...ramp('skin', '#D79B6E', { shade: 0.3, light: 0.22 }),
  ...ramp('hair', '#3B2A21', { shade: 0.35, light: 0.45 }),
  ...ramp('cloth', '#3C4A63', { shade: 0.35, light: 0.28 }),

  // Scenery ramps for the Ruta and Zona Salvaje backdrops.
  ...ramp('sky', '#7FC4E8'),
  ...ramp('dusk', '#F0946B'),
  ...ramp('rock', '#6C7280'),
  ...ramp('moss', '#4E8C52'),
  ...ramp('earth', '#8A6647'),
  ...ramp('water', '#2E7BB5'),
};

export const COLOR_NAMES = Object.keys(PALETTE);

/**
 * Every colour that has BOTH a `_lo` and a `_hi`, i.e. everything `Sprite#emboss` can shade.
 *
 * Both halves matter: `ink_hi` exists as a standalone neutral with no `ink_lo` behind it, so
 * testing only for `_hi` would put `ink` in this list and make embossing an inked shape throw.
 */
export const RAMPS = COLOR_NAMES.filter(
  (name) => COLOR_NAMES.includes(`${name}_lo`) && COLOR_NAMES.includes(`${name}_hi`),
);

/** Throws on a typo in a sprite program instead of silently painting the wrong colour. */
export function colorOf(name) {
  const value = PALETTE[name];
  if (!value) throw new Error(`Unknown palette colour: ${name}`);
  return value;
}

export { mix };
