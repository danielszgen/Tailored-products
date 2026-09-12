/**
 * Medals and type glyphs.
 *
 * The shapes are the ones SPEC §4.3 already fixed for the SVG iconography, redrawn as pixels so
 * the arcade world and the interface agree: CANTERA a hexagon with a mountain, YUNQUE a circle
 * with a bar and discs, RESORTE a rounded square with a spiral, VÉRTIGO a triangle with an
 * inverted figure. The three medal states are also from §4.3 — locked (grey outline), in
 * progress (half colour) and earned (full colour plus shine).
 */
import { Sprite } from '../lib/sprite.mjs';
import { RAMPS } from '../lib/palette.mjs';

export const MEDAL_SIZE = 24;
export const GLYPH_SIZE = 16;

/** The dominant type of each gym (SPEC §6.5) is what colours its medal. */
const MEDALS = {
  cantera: { ramp: 'fuerza', shape: hexagon, mark: mountainMark },
  yunque: { ramp: 'masa', shape: circle, mark: barbellMark },
  resorte: { ramp: 'aventura', shape: roundedSquare, mark: spiralMark },
  vertigo: { ramp: 'control', shape: triangle, mark: handstandMark },
};

export const MEDAL_STATES = ['locked', 'progress', 'earned'];

// ---- shapes -----------------------------------------------------------------------------------

function hexagon(s, color) {
  s.poly(
    [
      [12, 1],
      [21, 7],
      [21, 17],
      [12, 23],
      [3, 17],
      [3, 7],
    ],
    color,
  );
}

function circle(s, color) {
  s.ellipse(11, 11, 10, 10, color);
}

function roundedSquare(s, color) {
  s.rect(2, 2, 20, 20, color);
  for (const [x, y] of [
    [2, 2],
    [21, 2],
    [2, 21],
    [21, 21],
  ]) {
    s.px(x, y, 'void');
  }
}

function triangle(s, color) {
  s.poly(
    [
      [11, 1],
      [22, 22],
      [1, 22],
    ],
    color,
  );
}

// ---- marks ------------------------------------------------------------------------------------

function mountainMark(s, color) {
  s.poly(
    [
      [5, 17],
      [10, 8],
      [13, 12],
      [15, 9],
      [19, 17],
    ],
    color,
  );
}

function barbellMark(s, color) {
  s.rect(5, 10, 13, 3, color);
  s.rect(4, 7, 3, 9, color);
  s.rect(16, 7, 3, 9, color);
}

/** A square spiral, wound clockwise from the outside in — SPEC §4.3 for RESORTE. */
function spiralMark(s, color) {
  s.rect(6, 5, 11, 2, color); // outer top
  s.rect(15, 5, 2, 11, color); // outer right
  s.rect(8, 14, 9, 2, color); // outer bottom
  s.rect(8, 9, 2, 7, color); // outer left, stopping short of the top
  s.rect(8, 9, 6, 2, color); // inner top
  s.rect(12, 9, 2, 4, color); // inner right
}

/**
 * The VÉRTIGO figure, upside down (SPEC §4.3): body straight up, arms spreading down like a
 * tripod, head hanging between them.
 *
 * This is the same geometry as the SVG medal in src/brand/icons/MedalIcon.tsx, so the two
 * iconographies agree. The round head at the bottom is what says "inverted"; legs split into a
 * V just read as a tree inside a triangle that is widest at the base.
 */
function handstandMark(s, color) {
  s.rect(11, 5, 2, 7, color); // legs together, feet at the top
  s.rect(9, 12, 6, 1, color); // shoulders
  s.line(9, 13, 4, 19, color); // arms, 1 px so the badge stays visible between them
  s.line(14, 13, 19, 19, color);
  s.ellipse(11, 16, 2, 2, color); // the head, hanging between the arms
}

// ---- medals -----------------------------------------------------------------------------------

/**
 * @param {'cantera'|'yunque'|'resorte'|'vertigo'} gym
 * @param {'locked'|'progress'|'earned'} state
 */
export function medal(gym, state) {
  const spec = MEDALS[gym];
  if (!spec) throw new Error(`Unknown gym: ${gym}`);
  if (!MEDAL_STATES.includes(state)) throw new Error(`Unknown medal state: ${state}`);
  const s = new Sprite(MEDAL_SIZE, MEDAL_SIZE);

  if (state === 'locked') {
    // Outline only: the shape is drawn solid, hollowed out, and left grey.
    spec.shape(s, 'gray');
    const solid = s.clone();
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const interior =
          solid.opaque(x - 1, y) &&
          solid.opaque(x + 1, y) &&
          solid.opaque(x, y - 1) &&
          solid.opaque(x, y + 1);
        if (interior) s.px(x, y, 'void');
      }
    }
    spec.mark(s, 'slate');
    return s.outline('ink');
  }

  const fill = state === 'earned' ? spec.ramp : `${spec.ramp}_lo`;
  spec.shape(s, fill);
  spec.mark(s, state === 'earned' ? 'white' : 'steel');
  if (state === 'earned') {
    s.emboss(RAMPS);
    // Gold rim and a shine, so an earned medal reads across the room.
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (!s.opaque(x, y)) continue;
        const edge =
          !s.opaque(x - 1, y) || !s.opaque(x + 1, y) || !s.opaque(x, y - 1) || !s.opaque(x, y + 1);
        if (edge) s.px(x, y, 'gold');
      }
    }
    s.px(18, 4, 'white');
    s.px(19, 3, 'white');
    s.px(20, 4, 'white');
    s.px(19, 5, 'white');
  }
  return s.outline('ink');
}

// ---- type glyphs ------------------------------------------------------------------------------

/** The 6 geometric glyphs of SPEC §4.3, at the arcade scale. */
const GLYPHS = {
  masa: (s) => {
    s.ellipse(7, 7, 6, 6, 'masa');
    s.rect(1, 6, 14, 3, 'bone');
  },
  fuerza: (s) =>
    s.poly(
      [
        [7, 0],
        [14, 4],
        [14, 11],
        [7, 15],
        [0, 11],
        [0, 4],
      ],
      'fuerza',
    ),
  motor: (s) => {
    // A wave that ends in an arrow head.
    for (const [x, y] of [
      [0, 9],
      [1, 8],
      [2, 7],
      [3, 7],
      [4, 8],
      [5, 9],
      [6, 9],
      [7, 8],
      [8, 6],
      [9, 5],
      [10, 4],
    ]) {
      s.rect(x, y, 2, 2, 'motor');
    }
    s.poly(
      [
        [9, 1],
        [15, 1],
        [15, 7],
      ],
      'motor_hi',
    );
  },
  control: (s) => {
    s.poly(
      [
        [0, 2],
        [15, 2],
        [7, 15],
      ],
      'control',
    );
    s.rect(6, 5, 3, 3, 'bone');
  },
  aventura: (s) =>
    s.poly(
      [
        [0, 14],
        [5, 3],
        [9, 9],
        [11, 6],
        [15, 14],
      ],
      'aventura',
    ),
  regen: (s) => {
    s.poly(
      [
        [7, 0],
        [13, 9],
        [7, 15],
        [2, 9],
      ],
      'regen',
    );
    s.rect(5, 8, 2, 3, 'regen_hi');
  },
};

export const TYPE_NAMES = Object.keys(GLYPHS);

/** @param {'masa'|'fuerza'|'motor'|'control'|'aventura'|'regen'} type */
export function typeGlyph(type) {
  const draw = GLYPHS[type];
  if (!draw) throw new Error(`Unknown type: ${type}`);
  const s = new Sprite(GLYPH_SIZE, GLYPH_SIZE);
  draw(s);
  return s.emboss(RAMPS).outline('ink');
}

export const MEDAL_GYMS = Object.keys(MEDALS);
