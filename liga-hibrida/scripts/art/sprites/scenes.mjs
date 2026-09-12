/**
 * The two backdrops of SPEC §9 Etapa IV: Ruta (the easy Z2 window) and Zona Salvaje (the
 * Saturday adventure window). Both are 160×48 banners meant to sit behind a card title, so they
 * are painted in bands with the horizon low and the centre left calm enough for text.
 *
 * Scenery is shaded by hand instead of through `emboss`/`outline`: a contour around the sky
 * would be nonsense, and flat bands are what give 16-bit backgrounds their depth.
 */
import { Sprite } from '../lib/sprite.mjs';

export const SCENE_W = 160;
export const SCENE_H = 48;

/** Rows [y0, y1) in one colour. */
function band(s, y0, y1, color) {
  s.rect(0, y0, s.width, y1 - y0, color);
}

/** Two-row checkerboard that blends one band into the next. */
function blend(s, y, a, b) {
  s.dither(0, y, s.width, 1, a, b);
  s.dither(0, y + 1, s.width, 1, b, a);
}

/** Upper half of an ellipse: a hill. */
function hump(s, cx, baseY, rx, ry, color) {
  for (let x = cx - rx; x <= cx + rx; x++) {
    const t = (x - cx) / rx;
    const h = Math.round(ry * Math.sqrt(Math.max(0, 1 - t * t)));
    s.rect(x, baseY - h, 1, h + 1, color);
  }
}

function pine(s, x, baseY, height, color, tip = null) {
  const half = Math.max(1, Math.round(height / 3));
  for (let i = 0; i < height; i++) {
    const w = Math.max(1, Math.round((half * 2 * (i + 1)) / height));
    s.rect(x - Math.floor(w / 2), baseY - height + i, w, 1, i < 2 && tip ? tip : color);
  }
  s.rect(x, baseY, 1, 2, 'earth_lo');
}

function peak(s, cx, baseY, halfW, height, { rock, snow, shade }) {
  for (let i = 0; i < height; i++) {
    const w = Math.max(1, Math.round((halfW * 2 * (i + 1)) / height));
    const y = baseY - height + i;
    const x0 = cx - Math.floor(w / 2);
    s.rect(x0, y, w, 1, i < Math.round(height * 0.3) ? snow : rock);
    // Shaded right flank, so the light keeps coming from the top left.
    if (w > 3) {
      const flank = Math.max(1, Math.round(w / 3));
      s.rect(x0 + w - flank, y, flank, 1, shade);
    }
  }
}

/** RUTA · the easy aerobic window: daylight, rolling hills and a path that leaves the frame. */
export function ruta() {
  const s = new Sprite(SCENE_W, SCENE_H);
  band(s, 0, 14, 'sky_hi');
  blend(s, 14, 'sky_hi', 'sky');
  band(s, 16, 26, 'sky');

  // Sun with a soft rim, kept to the right so a title can sit on the left.
  s.ellipse(132, 9, 5, 5, 'gold_hi');
  s.ellipse(132, 9, 6, 6, 'gold', { fill: false });

  // Far hills, then near hills. The far ones overlap generously: a gap between two of them
  // leaves a notch of sky below the horizon, which reads as a hole in the ground.
  hump(s, 22, 28, 38, 9, 'moss_lo');
  hump(s, 94, 28, 46, 11, 'moss_lo');
  hump(s, 146, 28, 32, 8, 'moss_lo');
  band(s, 28, 33, 'moss');
  band(s, 33, SCENE_H, 'moss_lo');
  hump(s, 60, 38, 34, 6, 'moss');
  hump(s, 132, 40, 28, 5, 'moss');

  // The path: narrow at the horizon, wide at the bottom, drifting to the right.
  for (let y = 29; y < SCENE_H; y++) {
    const t = (y - 29) / (SCENE_H - 1 - 29);
    const width = Math.round(2 + t * 26);
    const centre = Math.round(78 + t * 18);
    s.rect(centre - Math.floor(width / 2), y, width, 1, 'earth');
    s.rect(centre - Math.floor(width / 2), y, Math.max(1, Math.round(width / 5)), 1, 'earth_hi');
  }

  // Trees along the left, small to large so the eye reads distance.
  pine(s, 14, 33, 9, 'moss_lo');
  pine(s, 30, 36, 12, 'moss_lo');
  pine(s, 8, 42, 16, 'moss_lo');
  pine(s, 150, 38, 13, 'moss_lo');
  return s;
}

/** ZONA SALVAJE · the Saturday adventure window: dusk, snow on the peaks and a rocky trail. */
export function zonaSalvaje() {
  const s = new Sprite(SCENE_W, SCENE_H);
  band(s, 0, 10, 'masa_lo');
  blend(s, 10, 'masa_lo', 'dusk_lo');
  band(s, 12, 18, 'dusk_lo');
  blend(s, 18, 'dusk_lo', 'dusk');
  band(s, 20, 30, 'dusk');

  // The low sun behind the ridge.
  s.ellipse(112, 28, 7, 7, 'gold');

  // Three peaks, the tallest off-centre.
  const stone = { rock: 'rock', snow: 'bone', shade: 'rock_lo' };
  peak(s, 34, 32, 15, 26, stone);
  peak(s, 74, 32, 22, 32, stone);
  peak(s, 126, 32, 17, 22, stone);
  band(s, 30, 34, 'rock_lo');

  // Valley floor and scattered stones.
  band(s, 34, SCENE_H, 'earth');
  band(s, 42, SCENE_H, 'earth_lo');
  for (const [x, y, w] of [
    [12, 40, 4],
    [46, 44, 5],
    [98, 41, 3],
    [140, 45, 6],
  ]) {
    s.rect(x, y, w, 2, 'rock');
    s.rect(x, y, Math.max(1, w - 2), 1, 'rock_hi');
  }

  // The trail, climbing away to the left.
  for (let y = 34; y < SCENE_H; y++) {
    const t = (y - 34) / (SCENE_H - 1 - 34);
    const width = Math.round(3 + t * 18);
    const centre = Math.round(88 - t * 34);
    s.rect(centre - Math.floor(width / 2), y, width, 1, 'earth_hi');
  }

  pine(s, 20, 36, 11, 'moss_lo');
  pine(s, 150, 39, 14, 'moss_lo');
  pine(s, 136, 43, 10, 'moss_lo');
  return s;
}
