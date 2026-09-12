/**
 * The people of Liga Híbrida: the trainer in the four Formas (SPEC §6.3) and the four gym
 * leaders (SPEC §9 Etapa IV).
 *
 * Everyone comes out of the same `body()` program, so the world looks drawn by one hand; what
 * tells them apart is the build, the kit colours, the pose and the prop. The mirror axis runs
 * between x = 15 and x = 16, so a program paints the left half only and calls `mirrorX()`;
 * asymmetric props go on afterwards.
 *
 * Each leader's palette is the dominant type of their gym (SPEC §6.5), so the colour already
 * says what the session trains: CANTERA fuerza, YUNQUE masa, RESORTE aventura, VÉRTIGO control.
 */
import { Sprite } from '../lib/sprite.mjs';
import { RAMPS } from '../lib/palette.mjs';

export const CHAR_W = 32;
export const CHAR_H = 48;

const HEAD_Y = 6;
const HEAD_H = 9;
const NECK_Y = 15;
const TORSO_Y = 17;
const TORSO_H = 15;
const LEG_Y = 32;
const SHORTS_H = 7;
const FOOT_Y = 45;

/** Head, torso, one arm and one leg — the left half of a front-facing figure. */
function body(
  s,
  { shoulder, waist, limb, thigh, top, bottom, shoe, sleeve = null, arms = 'down', footY = FOOT_Y },
) {
  s.rect(11, HEAD_Y, 5, HEAD_H, 'skin');
  s.rect(14, NECK_Y, 2, 2, 'skin');

  for (let i = 0; i < TORSO_H; i++) {
    const half = Math.round(shoulder + (waist - shoulder) * (i / (TORSO_H - 1)));
    s.rect(16 - half, TORSO_Y + i, half, 1, top);
  }

  const armX = 16 - shoulder - limb;
  if (arms === 'up') {
    s.rect(armX, TORSO_Y, limb, 3, sleeve ?? top);
    s.rect(armX, TORSO_Y - 11, limb, 11, 'skin');
    s.rect(armX - 1, TORSO_Y - 13, limb + 1, 2, 'skin'); // fist
  } else {
    s.rect(armX, TORSO_Y + 2, limb, 6, sleeve ?? top);
    s.rect(armX, TORSO_Y + 8, limb, 9, 'skin');
  }

  s.rect(15 - thigh, LEG_Y, thigh, SHORTS_H, bottom);
  s.rect(15 - thigh, LEG_Y + SHORTS_H, thigh, Math.max(1, footY - LEG_Y - SHORTS_H), 'skin');
  s.rect(14 - thigh, footY, thigh + 1, 3, shoe);
  return s;
}

/** Hair, eyes and mouth. Drawn before the mirror so the face comes out symmetric. */
function face(s, { hair = 'hair', long = false, y = HEAD_Y } = {}) {
  s.rect(11, y - 2, 5, 3, hair);
  s.rect(11, y + 1, 1, long ? 6 : 2, hair);
  s.rect(13, y + 4, 1, 2, 'ink');
  s.px(15, y + 6, 'skin_lo');
  return s;
}

/** Finishes any character: volume from the shared light source, then the single dark contour. */
function finish(s) {
  return s.emboss(RAMPS).outline('ink');
}

// ---- the trainer ------------------------------------------------------------------------------

function headband(s, color) {
  s.rect(11, HEAD_Y + 1, 10, 1, color);
}

function wristbands(s, color) {
  for (let x = 4; x <= 9; x++) {
    if (s.at(x, TORSO_Y + 14) === 'skin') s.px(x, TORSO_Y + 14, color);
    if (s.at(CHAR_W - 1 - x, TORSO_Y + 14) === 'skin') s.px(CHAR_W - 1 - x, TORSO_Y + 14, color);
  }
}

/** The champion's sash of Forma IV: a diagonal that only paints where the torso already is. */
function sash(s, color) {
  for (let i = 0; i < 11; i++) {
    const x = 10 + i;
    for (const y of [TORSO_Y + 1 + i, TORSO_Y + 2 + i]) {
      if (s.opaque(x, y)) s.px(x, y, color);
    }
  }
}

/**
 * The four Formas are the same person growing: shoulders, limbs and thighs widen, the kit gets
 * more serious, and Forma IV earns the gold sash. SPEC §6.3 drives the order, never the look.
 */
const FORMAS = [
  {
    id: 1,
    build: { shoulder: 5, waist: 4, limb: 2, thigh: 3, top: 'cloth', bottom: 'rock', shoe: 'gray' },
    extras: () => {},
  },
  {
    id: 2,
    build: { shoulder: 6, waist: 4, limb: 3, thigh: 4, top: 'masa', bottom: 'rock', shoe: 'gray' },
    extras: (s) => headband(s, 'masa_hi'),
  },
  {
    id: 3,
    build: {
      shoulder: 7,
      waist: 5,
      limb: 3,
      thigh: 4,
      top: 'control',
      bottom: 'rock',
      shoe: 'aventura',
    },
    extras: (s) => {
      headband(s, 'control_hi');
      wristbands(s, 'bone');
    },
  },
  {
    id: 4,
    build: {
      shoulder: 7,
      waist: 5,
      limb: 4,
      thigh: 5,
      top: 'accent',
      bottom: 'ink_hi',
      shoe: 'gold',
    },
    extras: (s) => {
      headband(s, 'gold');
      wristbands(s, 'gold_hi');
      sash(s, 'gold');
    },
  },
];

/** @param {1|2|3|4} forma */
export function avatar(forma) {
  const spec = FORMAS.find((f) => f.id === forma);
  if (!spec) throw new Error(`Forma out of range: ${forma}`);
  const s = new Sprite(CHAR_W, CHAR_H);
  body(s, spec.build);
  face(s, { long: forma >= 3 });
  s.mirrorX();
  spec.extras(s);
  return finish(s);
}

// ---- the four gym leaders ---------------------------------------------------------------------

/**
 * BASALTO · CANTERA. The quarry: squat, quads and adductors. Widest build of the four, stone
 * kit and a loaded bar across the traps, so the card says "lower body" before any text does.
 */
function basalto() {
  const s = new Sprite(CHAR_W, CHAR_H);
  body(s, {
    shoulder: 8,
    waist: 6,
    limb: 4,
    thigh: 5,
    top: 'rock',
    bottom: 'ink_hi',
    shoe: 'fuerza',
  });
  face(s, {});
  s.mirrorX();
  s.rect(11, TORSO_Y + 5, 10, 2, 'fuerza_lo'); // lifting belt
  // Bar on the traps, a plate at each end.
  s.rect(3, TORSO_Y - 1, 26, 2, 'steel');
  for (const x of [0, 28]) {
    s.rect(x, TORSO_Y - 4, 4, 8, 'fuerza');
    s.rect(x + 1, TORSO_Y - 2, 2, 4, 'fuerza_lo');
  }
  return finish(s);
}

/**
 * FRAGUA · YUNQUE. The forge: torso strength and mass. Leather apron, a hammer raised in one
 * hand and the anvil at their feet with the embers still glowing.
 */
function fragua() {
  const s = new Sprite(CHAR_W, CHAR_H);
  body(s, {
    shoulder: 7,
    waist: 6,
    limb: 4,
    thigh: 4,
    top: 'masa',
    bottom: 'earth',
    shoe: 'earth',
  });
  face(s, {});
  s.mirrorX();
  // Apron from the chest to the thighs.
  s.rect(11, TORSO_Y + 4, 10, 12, 'earth');
  s.rect(12, TORSO_Y + 7, 8, 1, 'earth_lo');
  // Right arm raised, hammer in the fist: handle up the forearm, head across the top.
  s.rect(24, TORSO_Y + 8, 4, 9, 'void');
  s.rect(24, TORSO_Y - 2, 4, 11, 'skin');
  s.rect(25, TORSO_Y - 9, 2, 8, 'earth_lo'); // handle
  s.rect(22, TORSO_Y - 12, 8, 4, 'steel'); // head
  s.rect(23, TORSO_Y - 11, 2, 2, 'bone'); // highlight
  // Anvil and embers on the floor to the left.
  s.rect(1, FOOT_Y - 5, 9, 3, 'slate');
  s.rect(3, FOOT_Y - 2, 5, 4, 'gray');
  for (const [x, y] of [
    [2, FOOT_Y - 8],
    [5, FOOT_Y - 10],
    [8, FOOT_Y - 7],
  ]) {
    s.rect(x, y, 1, 1, 'fuerza_hi');
  }
  return finish(s);
}

/**
 * MUELLE · RESORTE. The spring: posterior chain, unilateral work and power. Leanest build,
 * caught mid-bounce with both feet off the floor and the coil still compressed underneath.
 */
function muelle() {
  const s = new Sprite(CHAR_W, CHAR_H);
  body(s, {
    shoulder: 6,
    waist: 5,
    limb: 3,
    thigh: 4,
    top: 'aventura',
    bottom: 'ink_hi',
    shoe: 'aventura_lo',
    arms: 'up',
    footY: 38,
  });
  face(s, {});
  s.mirrorX();
  // Just left the floor: the dust still settling, and a rising chevron at each side.
  s.rect(6, 46, 20, 2, 'slate');
  s.rect(9, 45, 14, 1, 'steel');
  s.rect(12, 44, 8, 1, 'bone');
  for (const x of [3, 27]) {
    s.rect(x, 40, 2, 1, 'steel');
    s.rect(x, 43, 2, 1, 'steel');
  }
  return finish(s);
}

/**
 * CORNISA · VÉRTIGO. Heights, shoulders and handstand: the only leader upside down, which is
 * exactly what this gym trains. Built top-down — feet in the air, head between the arms, hands
 * flat on the ledge.
 */
function cornisa() {
  const s = new Sprite(CHAR_W, CHAR_H);
  const top = 'control';

  s.rect(12, 0, 3, 3, 'control_lo'); // sole
  s.rect(12, 3, 3, 12, 'skin'); // shin
  s.rect(12, 15, 4, 5, 'ink_hi'); // shorts
  for (let i = 0; i < 11; i++) {
    // Torso: hips at the top, shoulders at the bottom.
    const half = Math.round(4 + (7 - 4) * (i / 10));
    s.rect(16 - half, 20 + i, half, 1, top);
  }
  s.rect(12, 31, 4, 9, 'skin'); // head, hanging between the arms
  s.rect(12, 31, 4, 2, 'hair');
  s.rect(13, 35, 1, 2, 'ink'); // eye
  s.rect(9, 31, 3, 14, 'skin'); // arm down to the ledge
  s.rect(9, 31, 3, 3, top); // deltoid
  s.rect(8, 44, 5, 2, 'skin'); // hand flat on the rock
  s.mirrorX();

  s.rect(0, 46, 32, 2, 'rock'); // the ledge
  for (const [x, y] of [
    [6, 42],
    [25, 41],
  ]) {
    s.rect(x, y, 1, 1, 'bone'); // chalk dust
  }
  return finish(s);
}

export const LEADERS = {
  cantera: { name: 'Basalto', draw: basalto },
  yunque: { name: 'Fragua', draw: fragua },
  resorte: { name: 'Muelle', draw: muelle },
  vertigo: { name: 'Cornisa', draw: cornisa },
};
