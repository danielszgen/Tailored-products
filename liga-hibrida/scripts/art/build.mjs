#!/usr/bin/env node
/**
 * Renders the whole visual bible and the manifest the app reads.
 *
 *   pnpm art                       # writes public/art, public/splash, public/icons/icon.svg
 *   node scripts/art/build.mjs --preview /tmp/bible.png
 *
 * Outputs:
 *   public/art/*.png            one indexed PNG per sprite; animations are horizontal sheets
 *   public/splash/*.png         iOS startup images
 *   public/icons/icon.svg       the app mark, still the single source the PNG icons come from
 *   src/brand/art/manifest.ts   generated: id → { src, width, height, frames }
 *
 * The sprite programs live in scripts/art/sprites and are never imported by the app, so none of
 * this drawing code reaches the browser bundle — only the PNGs and the small manifest do.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Sprite } from './lib/sprite.mjs';
import { avatar, LEADERS, CHAR_W, CHAR_H } from './sprites/characters.mjs';
import {
  medal,
  typeGlyph,
  MEDAL_GYMS,
  MEDAL_STATES,
  TYPE_NAMES,
  MEDAL_SIZE,
  GLYPH_SIZE,
} from './sprites/emblems.mjs';
import { object, OBJECT_IDS, OBJECT_SIZE } from './sprites/objects.mjs';
import { ruta, zonaSalvaje, SCENE_W, SCENE_H } from './sprites/scenes.mjs';
import {
  gymGate,
  medalBurst,
  evolutionFlash,
  pvPulse,
  GATE_W,
  GATE_H,
  GATE_FRAMES,
  BURST_SIZE,
  BURST_FRAMES,
  EVOLVE_W,
  EVOLVE_H,
  EVOLVE_FRAMES,
  PV_SIZE,
  PV_FRAMES,
  PV_STATES,
} from './sprites/animations.mjs';
import { appIcon, brandMark, splash, SPLASH_DEVICES, MARK_SIZE } from './sprites/icon.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ART_DIR = path.join(ROOT, 'public', 'art');
const SPLASH_DIR = path.join(ROOT, 'public', 'splash');
const MANIFEST = path.join(ROOT, 'src', 'brand', 'art', 'manifest.ts');

/** SPEC §9 Etapa IV acceptance: every generated asset together stays under 3 MB. */
const BUDGET_BYTES = 3 * 1024 * 1024;

// ---------------------------------------------------------------------------------------------
// What to render
// ---------------------------------------------------------------------------------------------

/** @type {{ id: string, file: string, frames: number, width: number, height: number, draw: () => Sprite }[]} */
const ASSETS = [
  { id: 'mark', file: 'mark', width: MARK_SIZE, height: MARK_SIZE, frames: 1, draw: brandMark },

  ...[1, 2, 3, 4].map((n) => ({
    id: `avatar-forma-${n}`,
    file: `avatar-forma-${n}`,
    width: CHAR_W,
    height: CHAR_H,
    frames: 1,
    draw: () => avatar(n),
  })),

  ...Object.entries(LEADERS).map(([gym, leader]) => ({
    id: `leader-${gym}`,
    file: `leader-${gym}`,
    width: CHAR_W,
    height: CHAR_H,
    frames: 1,
    draw: leader.draw,
  })),

  ...MEDAL_GYMS.flatMap((gym) =>
    MEDAL_STATES.map((state) => ({
      id: `medal-${gym}-${state}`,
      file: `medal-${gym}-${state}`,
      width: MEDAL_SIZE,
      height: MEDAL_SIZE,
      frames: 1,
      draw: () => medal(gym, state),
    })),
  ),

  ...TYPE_NAMES.map((type) => ({
    id: `type-${type}`,
    file: `type-${type}`,
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
    frames: 1,
    draw: () => typeGlyph(type),
  })),

  ...OBJECT_IDS.map((item) => ({
    id: `object-${item.replace(/_/g, '-')}`,
    file: `object-${item.replace(/_/g, '-')}`,
    width: OBJECT_SIZE,
    height: OBJECT_SIZE,
    frames: 1,
    draw: () => object(item),
  })),

  {
    id: 'scene-ruta',
    file: 'scene-ruta',
    width: SCENE_W,
    height: SCENE_H,
    frames: 1,
    draw: ruta,
  },
  {
    id: 'scene-zona-salvaje',
    file: 'scene-zona-salvaje',
    width: SCENE_W,
    height: SCENE_H,
    frames: 1,
    draw: zonaSalvaje,
  },

  {
    id: 'anim-gate',
    file: 'anim-gate',
    width: GATE_W,
    height: GATE_H,
    frames: GATE_FRAMES,
    draw: gymGate,
  },
  {
    id: 'anim-medal-burst',
    file: 'anim-medal-burst',
    width: BURST_SIZE,
    height: BURST_SIZE,
    frames: BURST_FRAMES,
    draw: medalBurst,
  },
  {
    id: 'anim-evolution',
    file: 'anim-evolution',
    width: EVOLVE_W,
    height: EVOLVE_H,
    frames: EVOLVE_FRAMES,
    draw: evolutionFlash,
  },
  ...Object.keys(PV_STATES).map((state) => ({
    id: `anim-pv-${state}`,
    file: `anim-pv-${state}`,
    width: PV_SIZE,
    height: PV_SIZE,
    frames: PV_FRAMES,
    draw: () => pvPulse(state),
  })),
];

// ---------------------------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------------------------

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Removes stale PNGs so a renamed sprite cannot linger in the build. */
function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.png')) fs.rmSync(path.join(dir, name));
  }
}

function renderAssets() {
  ensureDir(ART_DIR);
  cleanDir(ART_DIR);
  const rows = [];
  for (const asset of ASSETS) {
    const sprite = asset.draw();
    const expectedW = asset.width * asset.frames;
    if (sprite.width !== expectedW || sprite.height !== asset.height) {
      throw new Error(
        `${asset.id}: drew ${sprite.width}×${sprite.height}, manifest says ` +
          `${expectedW}×${asset.height}`,
      );
    }
    if (!sprite.bounds()) throw new Error(`${asset.id}: nothing was drawn`);
    const png = sprite.toPng();
    fs.writeFileSync(path.join(ART_DIR, `${asset.file}.png`), png);
    rows.push({ ...asset, sprite, bytes: png.length });
  }
  return rows;
}

function renderSplashes() {
  ensureDir(SPLASH_DIR);
  cleanDir(SPLASH_DIR);
  return SPLASH_DEVICES.map((device) => {
    const png = splash(device.width, device.height).toPng();
    fs.writeFileSync(path.join(SPLASH_DIR, `${device.file}.png`), png);
    return { ...device, bytes: png.length };
  });
}

function renderIcon() {
  const svg = appIcon().toSvg();
  const header =
    '<!-- GENERATED by scripts/art/build.mjs — edit scripts/art/sprites/icon.mjs instead.\n' +
    '     Liga Híbrida app mark on the pixel grid. scripts/icons.mjs rasterises it to the\n' +
    '     PNG sizes the manifest and iOS ask for. -->\n';
  const file = path.join(ROOT, 'public', 'icons', 'icon.svg');
  fs.writeFileSync(file, `${header}${svg}\n`);
  return fs.statSync(file).size;
}

function writeManifest(rows) {
  ensureDir(path.dirname(MANIFEST));
  const entries = rows
    .map(
      (r) =>
        `  '${r.id}': { src: '/art/${r.file}.png', width: ${r.width}, ` +
        `height: ${r.height}, frames: ${r.frames} },`,
    )
    .join('\n');
  const body = `// GENERATED by scripts/art/build.mjs — do not edit by hand. Run \`pnpm art\`.
//
// The visual bible of Etapa IV: every sprite is an indexed PNG under public/art. Animations are
// horizontal sheets, so \`width\` is one frame and the file is \`width * frames\` wide.

export interface ArtAsset {
  /** Absolute path served from public/. */
  readonly src: string;
  /** Width of a single frame, in sprite pixels. */
  readonly width: number;
  /** Height of a single frame, in sprite pixels. */
  readonly height: number;
  /** 1 for a still sprite, >1 for an animation sheet. */
  readonly frames: number;
}

export const ART = {
${entries}
} as const satisfies Record<string, ArtAsset>;

export type ArtId = keyof typeof ART;
`;
  fs.writeFileSync(MANIFEST, body);
  return body.length;
}

/** One upscaled contact sheet of the whole bible, for eyeballing the style in a single look. */
function writePreview(rows, out) {
  const stills = rows.filter((r) => r.frames === 1 && r.width <= 64);
  const sheets = rows.filter((r) => r.frames > 1);
  const cell = 52;
  const cols = 8;
  const stillRows = Math.ceil(stills.length / cols);
  const sheetH = sheets.reduce((sum, r) => sum + r.height + 4, 0);
  const canvas = new Sprite(cols * cell, stillRows * cell + sheetH + 8);
  canvas.rect(0, 0, canvas.width, canvas.height, 'bone');

  stills.forEach((r, i) => {
    const cx = (i % cols) * cell + Math.round((cell - r.width) / 2);
    const cy = Math.floor(i / cols) * cell + Math.round((cell - r.height) / 2);
    canvas.blit(r.sprite, cx, cy);
  });
  let y = stillRows * cell + 4;
  for (const r of sheets) {
    canvas.blit(r.sprite, 2, y);
    y += r.height + 4;
  }
  fs.writeFileSync(out, canvas.scale(3).toPng());
  // The wide scenes do not fit the grid; write them separately, side by side.
  const wide = rows.filter((r) => r.frames === 1 && r.width > 64);
  if (wide.length) {
    const strip = new Sprite(wide[0].width, wide.length * (wide[0].height + 2));
    wide.forEach((r, i) => strip.blit(r.sprite, 0, i * (r.height + 2)));
    fs.writeFileSync(out.replace(/\.png$/, '-scenes.png'), strip.scale(3).toPng());
  }
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

const previewFlag = process.argv.indexOf('--preview');
const previewPath = previewFlag >= 0 ? process.argv[previewFlag + 1] : null;

const rows = renderAssets();
const splashes = renderSplashes();
const iconBytes = renderIcon();
const manifestBytes = writeManifest(rows);
if (previewPath) writePreview(rows, previewPath);

const artBytes = rows.reduce((sum, r) => sum + r.bytes, 0);
const splashBytes = splashes.reduce((sum, r) => sum + r.bytes, 0);
const total = artBytes + splashBytes + iconBytes;

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`${rows.length} sprites  ${kb(artBytes)}`);
for (const r of rows) {
  const frames = r.frames > 1 ? ` ×${r.frames}` : '';
  console.log(`  ${r.id.padEnd(26)} ${r.width}×${r.height}${frames.padEnd(4)} ${r.bytes} B`);
}
console.log(`${splashes.length} iOS startup images  ${kb(splashBytes)}`);
console.log(`icon.svg  ${iconBytes} B · manifest.ts  ${manifestBytes} B`);
console.log(`total generated assets  ${kb(total)}  (budget ${kb(BUDGET_BYTES)})`);

if (total > BUDGET_BYTES) {
  console.error(`Over the 3 MB asset budget of SPEC §9 Etapa IV by ${kb(total - BUDGET_BYTES)}`);
  process.exit(1);
}
