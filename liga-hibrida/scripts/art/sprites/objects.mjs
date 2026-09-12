/**
 * The Mochila: one 16×16 object per item of SPEC §6.8, keyed by the ids in
 * src/domain/content/items.ts so REGEN can look a sprite up by item id.
 *
 * These are portraits of the object, never advice: the rule text next to them is the one the
 * domain content already carries, untouched.
 */
import { Sprite } from '../lib/sprite.mjs';
import { RAMPS } from '../lib/palette.mjs';

export const OBJECT_SIZE = 16;

const OBJECTS = {
  /** Tub of powder with its lid and label. */
  creatina: (s) => {
    s.rect(3, 4, 10, 11, 'bone');
    s.rect(2, 2, 12, 3, 'regen');
    s.rect(4, 7, 8, 4, 'regen_lo');
    s.rect(5, 8, 6, 1, 'bone');
  },
  /** Shaker bottle, screw cap and the measuring line. */
  whey: (s) => {
    s.rect(4, 3, 8, 12, 'masa');
    s.rect(3, 1, 10, 3, 'masa_lo');
    s.rect(5, 6, 6, 1, 'bone');
    s.rect(5, 9, 6, 1, 'bone');
  },
  /** Cup with a handle and steam. */
  cafeina: (s) => {
    s.rect(2, 7, 9, 7, 'earth');
    s.rect(3, 8, 7, 2, 'ink_hi');
    s.rect(11, 8, 3, 1, 'earth_lo');
    s.rect(13, 9, 1, 3, 'earth_lo');
    s.rect(11, 12, 3, 1, 'earth_lo');
    for (const [x, y] of [
      [4, 3],
      [5, 2],
      [7, 4],
      [8, 3],
    ]) {
      s.rect(x, y, 1, 2, 'steel');
    }
  },
  /** A drop of water carrying salt: the drop shape plus a plus sign. */
  electrolitos: (s) => {
    s.poly(
      [
        [7, 1],
        [13, 9],
        [7, 15],
        [2, 9],
      ],
      'motor',
    );
    s.rect(6, 6, 2, 7, 'bone');
    s.rect(4, 8, 7, 2, 'bone');
  },
  /** Two-tone capsule. */
  b12: (s) => {
    s.rect(2, 6, 12, 5, 'fuerza');
    s.rect(8, 6, 6, 5, 'bone');
    for (const [x, y] of [
      [2, 6],
      [2, 10],
      [13, 6],
      [13, 10],
    ]) {
      s.px(x, y, 'void');
    }
  },
  /** Two things in one item, as in SPEC §6.8: the sun for D, a fish for Omega-3. */
  d_omega3: (s) => {
    s.ellipse(4, 4, 3, 3, 'gold');
    for (const [x, y] of [
      [4, 0],
      [0, 4],
      [8, 4],
      [4, 8],
    ]) {
      s.px(x, y, 'gold_hi');
    }
    s.ellipse(9, 11, 4, 3, 'motor');
    s.poly(
      [
        [13, 8],
        [15, 11],
        [13, 14],
      ],
      'motor_lo',
    );
    s.px(7, 10, 'bone');
  },
  /** Hot stones with steam. */
  sauna: (s) => {
    s.rect(2, 11, 12, 4, 'slate');
    s.ellipse(5, 10, 3, 2, 'ink_hi');
    s.ellipse(10, 10, 2, 2, 'ink_hi');
    s.ellipse(7, 8, 2, 1, 'ink_hi');
    for (const [x, y] of [
      [4, 3],
      [7, 1],
      [10, 4],
    ]) {
      s.rect(x, y, 1, 3, 'fuerza_lo');
    }
  },
  /** Snowflake: the clearest cold/contrast mark at this size. */
  frio: (s) => {
    s.rect(7, 1, 2, 14, 'regen');
    s.rect(1, 7, 14, 2, 'regen');
    for (let i = 0; i < 5; i++) {
      s.px(3 + i, 3 + i, 'regen_hi');
      s.px(12 - i, 3 + i, 'regen_hi');
    }
  },
  /** Crescent moon and two stars: a nap reads faster than a pillow at this size. */
  siesta: (s) => {
    s.ellipse(7, 8, 6, 6, 'masa');
    s.ellipse(11, 6, 5, 5, 'void');
    for (const [x, y] of [
      [13, 12],
      [12, 1],
    ]) {
      s.px(x, y, 'gold_hi');
      s.px(x - 1, y + 1, 'gold_hi');
      s.px(x + 1, y + 1, 'gold_hi');
      s.px(x, y + 2, 'gold_hi');
    }
  },
  /** Two footprints: unmistakable at 16 px, where a shoe is just a blob. */
  paseo: (s) => {
    for (const [x, y] of [
      [2, 2],
      [9, 7],
    ]) {
      s.ellipse(x + 2, y + 3, 2, 3, 'control');
      s.rect(x + 1, y, 4, 2, 'control');
      s.px(x, y + 1, 'control_lo');
    }
  },
  /** Tall glass with a straw. */
  batido: (s) => {
    s.rect(4, 4, 8, 11, 'bone');
    s.rect(5, 6, 6, 8, 'earth');
    s.rect(5, 6, 6, 2, 'earth_hi');
    s.rect(9, 1, 2, 5, 'accent');
  },
};

export const OBJECT_IDS = Object.keys(OBJECTS);

/** @param {string} id one of OBJECT_IDS */
export function object(id) {
  const draw = OBJECTS[id];
  if (!draw) throw new Error(`Unknown Mochila object: ${id}`);
  const s = new Sprite(OBJECT_SIZE, OBJECT_SIZE);
  draw(s);
  return s.emboss(RAMPS).outline('ink');
}
