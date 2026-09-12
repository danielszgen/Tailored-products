/**
 * The definitive app mark, splash and icon (SPEC §9 Etapa IV).
 *
 * The identity does not change with the art direction: the hexagon, the mountain inside it and
 * the barbell underneath are the same mark the app has carried since Etapa I — redrawn on the
 * pixel grid so the home-screen icon belongs to the same world as the sprites.
 */
import { Sprite } from '../lib/sprite.mjs';

export const MARK_SIZE = 24;
export const ICON_SIZE = 32;

/** The mark alone on a transparent ground. */
export function brandMark() {
  const s = new Sprite(MARK_SIZE, MARK_SIZE);
  s.poly(
    [
      [12, 1],
      [21, 7],
      [21, 17],
      [12, 23],
      [3, 17],
      [3, 7],
    ],
    'gold',
  );
  s.poly(
    [
      [12, 4],
      [19, 8],
      [19, 16],
      [12, 20],
      [5, 16],
      [5, 8],
    ],
    'fuerza',
  );
  s.poly(
    [
      [6, 12],
      [10, 6],
      [12, 9],
      [14, 7],
      [18, 12],
    ],
    'white',
  );

  // The barbell rests on the lower half of the red field. It is built in its own sprite so
  // `outline()` can give it a contour, which is what lets the gold read against the red.
  const bar = new Sprite(13, 7);
  bar.rect(3, 3, 7, 2, 'gold');
  bar.rect(1, 1, 2, 5, 'gold');
  bar.rect(10, 1, 2, 5, 'gold');
  bar.outline('ink');
  s.blit(bar, 6, 11);
  return s;
}

/**
 * The home-screen icon: full-bleed dark ground with the mark inside the central 75 %, so iOS can
 * apply its own mask and Android can use it as a maskable icon without clipping the mountain.
 */
export function appIcon() {
  const s = new Sprite(ICON_SIZE, ICON_SIZE);
  s.rect(0, 0, ICON_SIZE, ICON_SIZE, 'night');
  return s.blit(brandMark(), (ICON_SIZE - MARK_SIZE) / 2, (ICON_SIZE - MARK_SIZE) / 2);
}

/**
 * iOS startup images. Safari only honours an `apple-touch-startup-image` whose media query
 * matches the device exactly, so each size is its own file; they are flat colour plus the mark,
 * which compresses to a couple of kilobytes each.
 */
export const SPLASH_DEVICES = [
  { file: 'splash-750x1334', width: 750, height: 1334, css: [375, 667], ratio: 2 },
  { file: 'splash-828x1792', width: 828, height: 1792, css: [414, 896], ratio: 2 },
  { file: 'splash-1125x2436', width: 1125, height: 2436, css: [375, 812], ratio: 3 },
  { file: 'splash-1170x2532', width: 1170, height: 2532, css: [390, 844], ratio: 3 },
  { file: 'splash-1179x2556', width: 1179, height: 2556, css: [393, 852], ratio: 3 },
  { file: 'splash-1284x2778', width: 1284, height: 2778, css: [428, 926], ratio: 3 },
  { file: 'splash-1290x2796', width: 1290, height: 2796, css: [430, 932], ratio: 3 },
];

/** @param {number} width @param {number} height */
export function splash(width, height) {
  const s = new Sprite(width, height);
  s.rect(0, 0, width, height, 'night');

  const scale = Math.max(4, Math.round((Math.min(width, height) * 0.4) / MARK_SIZE));
  const mark = brandMark().scale(scale);
  const markY = Math.round((height - mark.height) / 2 - height * 0.04);
  s.blit(mark, Math.round((width - mark.width) / 2), markY);

  // A gold rule under the mark, the same weight as the bar inside it.
  const ruleW = Math.round(mark.width * 0.9);
  const ruleH = Math.max(3, Math.round(scale / 3));
  s.rect(Math.round((width - ruleW) / 2), markY + mark.height + scale * 2, ruleW, ruleH, 'gold');
  return s;
}
