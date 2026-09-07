#!/usr/bin/env node
/**
 * Rasterizes public/icons/icon.svg into the PNGs the PWA manifest and iOS expect:
 * icon-192.png, icon-512.png and apple-touch-icon-180.png.
 *
 * No npm dependencies. The SVG is shown on a blank HTML page at the exact pixel size and
 * screenshotted by a locally available Chromium in headless mode, then the PNG is
 * re-compressed with node:zlib. Browser lookup order:
 *   1. CHROME_PATH / CHROMIUM_PATH / PUPPETEER_EXECUTABLE_PATH, or a Playwright
 *      chromium_headless_shell build (PLAYWRIGHT_BROWSERS_PATH or the default cache);
 *   2. the Playwright package (PLAYWRIGHT_MODULE, a local install, or a global one);
 *   3. a full Chrome/Chromium build (Playwright's or the system one) with --headless=new.
 *
 *   pnpm icons
 *   CHROME_PATH=/path/to/headless_shell pnpm icons
 *   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs pnpm icons
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import zlib from 'node:zlib';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public', 'icons', 'icon.svg');
const OUT_DIR = path.join(ROOT, 'public', 'icons');
const OUTPUTS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon-180.png', size: 180 },
];

// ---------------------------------------------------------------------------------------------
// Browser discovery
// ---------------------------------------------------------------------------------------------

const exists = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};
const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** Chromium binaries available on this machine, split by kind. */
function findBinaries() {
  const env = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean);
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright'),
  ].filter(Boolean);
  const shells = [];
  const browsers = [];
  for (const root of roots) {
    if (!isDir(root)) continue;
    for (const dir of fs.readdirSync(root).sort().reverse()) {
      const base = path.join(root, dir);
      if (dir.startsWith('chromium_headless_shell-')) {
        for (const platform of ['chrome-linux', 'chrome-mac', 'chrome-mac-arm64', 'chrome-win']) {
          shells.push(path.join(base, platform, 'headless_shell'));
          shells.push(path.join(base, platform, 'headless_shell.exe'));
        }
      } else if (dir.startsWith('chromium-')) {
        browsers.push(path.join(base, 'chrome-linux', 'chrome'));
        browsers.push(
          path.join(base, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        );
        browsers.push(
          path.join(base, 'chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        );
        browsers.push(path.join(base, 'chrome-win', 'chrome.exe'));
      }
    }
  }
  browsers.push(
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  );
  return {
    env: env.filter(exists),
    shells: shells.filter(exists),
    browsers: browsers.filter(exists),
  };
}

/** Loads the Playwright package if one is reachable (local, global or PLAYWRIGHT_MODULE). */
async function loadPlaywright() {
  const prefix = path.dirname(path.dirname(process.execPath));
  const specifiers = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    path.join(prefix, 'lib', 'node_modules', 'playwright', 'index.mjs'),
    path.join(path.dirname(process.execPath), 'node_modules', 'playwright', 'index.mjs'),
  ].filter(Boolean);
  for (const spec of specifiers) {
    try {
      const target = path.isAbsolute(spec) ? pathToFileURL(spec).href : spec;
      const mod = await import(target);
      if (mod.chromium) return { chromium: mod.chromium, spec };
    } catch {
      // Not available here; try the next candidate.
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Renderers: (htmlUrl, size, outFile) => Promise<Buffer>
// ---------------------------------------------------------------------------------------------

function cliRenderer(binary, tmp) {
  const isShell = /headless_shell/i.test(path.basename(binary));
  const render = async (htmlUrl, size, outFile) => {
    const args = [
      isShell ? '--headless' : '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      `--user-data-dir=${path.join(tmp, 'profile')}`,
      `--window-size=${size},${size}`,
      `--screenshot=${outFile}`,
      htmlUrl,
    ];
    await run(binary, args, { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
    return fs.readFileSync(outFile);
  };
  return { via: binary, render, close: async () => {} };
}

async function playwrightRenderer(pw) {
  const browser = await pw.chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const render = async (htmlUrl, size) => {
    await page.setViewportSize({ width: size, height: size });
    await page.goto(htmlUrl);
    return page.screenshot({ type: 'png', omitBackground: true });
  };
  return { via: `Playwright (${pw.spec})`, render, close: () => browser.close() };
}

async function pickRenderer(tmp) {
  const { env, shells, browsers } = findBinaries();
  const preferred = env[0] ?? shells[0];
  if (preferred) return cliRenderer(preferred, tmp);
  const pw = await loadPlaywright();
  if (pw) return playwrightRenderer(pw);
  if (browsers[0]) return cliRenderer(browsers[0], tmp);
  throw new Error(
    'No Chromium found. Install one with `npx playwright install chromium-headless-shell` ' +
      'or point CHROME_PATH at a Chrome/Chromium binary.',
  );
}

// ---------------------------------------------------------------------------------------------
// PNG helpers (8-bit RGB/RGBA, non-interlaced — what Chromium writes)
// ---------------------------------------------------------------------------------------------

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 =
  typeof zlib.crc32 === 'function'
    ? (buf) => zlib.crc32(buf) >>> 0
    : (buf) => {
        let c = 0xffffffff;
        for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      };

function readChunks(png) {
  if (!png.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG file');
  const chunks = [];
  for (let p = 8; p < png.length;) {
    const length = png.readUInt32BE(p);
    const type = png.toString('ascii', p + 4, p + 8);
    chunks.push({ type, data: png.subarray(p + 8, p + 8 + length) });
    p += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

function writeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function readHeader(png) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colorType: png[25] };
}

/** Re-compresses the image data at maximum level and drops ancillary chunks. */
function optimizePng(png) {
  const chunks = readChunks(png);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const keep = chunks.filter((c) => ['PLTE', 'tRNS'].includes(c.type));
  let best = png;
  for (const strategy of [zlib.constants.Z_DEFAULT_STRATEGY, zlib.constants.Z_FILTERED]) {
    const data = zlib.deflateSync(raw, { level: 9, memLevel: 9, strategy });
    const out = Buffer.concat([
      SIGNATURE,
      writeChunk('IHDR', ihdr.data),
      ...keep.map((c) => writeChunk(c.type, c.data)),
      writeChunk('IDAT', data),
      writeChunk('IEND', Buffer.alloc(0)),
    ]);
    if (out.length < best.length) best = out;
  }
  return best;
}

/** True when at least one pixel is opaque (guards against a browser that painted nothing). */
function hasOpaquePixels(png) {
  const { width, height, colorType } = readHeader(png);
  if (colorType === 2) return true; // RGB has no alpha channel
  if (colorType !== 6) return true; // unexpected layout: skip the check
  const bpp = 4;
  const stride = width * bpp;
  const raw = zlib.inflateSync(
    Buffer.concat(
      readChunks(png)
        .filter((c) => c.type === 'IDAT')
        .map((c) => c.data),
    ),
  );
  const prev = Buffer.alloc(stride);
  const row = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = v & 0xff;
      if (i % bpp === 3 && row[i] === 0xff) return true;
    }
    row.copy(prev);
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

const page = (svg, size) =>
  '<!doctype html><html><head><meta charset="utf-8"><style>' +
  'html,body{margin:0;padding:0;background:transparent;overflow:hidden}' +
  `svg{display:block;width:${size}px;height:${size}px}` +
  `</style></head><body>${svg}</body></html>`;

async function main() {
  const svg = fs.readFileSync(SOURCE, 'utf8').replace(/^\s*<\?xml[^>]*>\s*/, '');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'liga-hibrida-icons-'));
  const renderer = await pickRenderer(tmp);
  console.log(`Rendering ${path.relative(ROOT, SOURCE)} with ${renderer.via}`);
  try {
    for (const { file, size } of OUTPUTS) {
      const html = path.join(tmp, `icon-${size}.html`);
      fs.writeFileSync(html, page(svg, size));
      const shot = await renderer.render(pathToFileURL(html).href, size, path.join(tmp, file));
      const png = optimizePng(shot);
      const { width, height } = readHeader(png);
      if (width !== size || height !== size) {
        throw new Error(`${file}: expected ${size}×${size}, got ${width}×${height}`);
      }
      if (!hasOpaquePixels(png)) {
        throw new Error(
          `${file}: the browser painted nothing. Try a headless_shell build ` +
            '(`npx playwright install chromium-headless-shell`) or set PLAYWRIGHT_MODULE.',
        );
      }
      fs.writeFileSync(path.join(OUT_DIR, file), png);
      console.log(`  ${file.padEnd(26)} ${String(size).padStart(3)}×${size}  ${png.length} bytes`);
    }
  } finally {
    await renderer.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
