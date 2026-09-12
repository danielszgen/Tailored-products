/**
 * Minimal indexed-colour PNG encoder (colour type 3) with no npm dependencies.
 *
 * Pixel art is a handful of flat colours, so a palette PNG is both the smallest and the most
 * faithful container: one byte per pixel, no resampling, and index 0 reserved for transparency
 * through a 1-byte tRNS chunk. Every sprite in the visual bible goes through here.
 */
import zlib from 'node:zlib';

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

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** '#rrggbb' → [r, g, b]. */
export function parseHex(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Rows prefixed with PNG filter 0 (None). Indexed data rarely benefits from the others. */
function filterNone(pixels, width, height) {
  const out = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    out[y * (width + 1)] = 0;
    Buffer.from(pixels.subarray(y * width, (y + 1) * width)).copy(out, y * (width + 1) + 1);
  }
  return out;
}

/** Rows prefixed with PNG filter 1 (Sub): helps long horizontal runs of one index. */
function filterSub(pixels, width, height) {
  const out = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    const base = y * (width + 1);
    out[base] = 1;
    for (let x = 0; x < width; x++) {
      const left = x === 0 ? 0 : pixels[y * width + x - 1];
      out[base + 1 + x] = (pixels[y * width + x] - left) & 0xff;
    }
  }
  return out;
}

/**
 * Encodes palette indices as a PNG.
 *
 * @param {{ width: number, height: number, pixels: Uint8Array, palette: string[],
 *           transparentIndex?: number }} image
 *        `pixels` holds one palette index per pixel, row-major. `palette` is up to 256
 *        '#rrggbb' entries. `transparentIndex` (default 0) is written fully transparent.
 * @returns {Buffer}
 */
export function encodeIndexedPng({ width, height, pixels, palette, transparentIndex = 0 }) {
  if (palette.length === 0 || palette.length > 256) {
    throw new Error(`Palette must hold 1–256 colours, got ${palette.length}`);
  }
  if (pixels.length !== width * height) {
    throw new Error(`Expected ${width * height} pixels, got ${pixels.length}`);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // colour type: indexed
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const plte = Buffer.concat(palette.map((c) => Buffer.from(parseHex(c))));

  // tRNS for indexed images lists alpha per palette entry; entries beyond the chunk are opaque,
  // so one byte is enough when the transparent colour sits at index 0.
  const alphas = Buffer.alloc(transparentIndex + 1, 0xff);
  alphas[transparentIndex] = 0x00;

  let best = null;
  for (const raw of [filterNone(pixels, width, height), filterSub(pixels, width, height)]) {
    for (const strategy of [zlib.constants.Z_DEFAULT_STRATEGY, zlib.constants.Z_FILTERED]) {
      const data = zlib.deflateSync(raw, { level: 9, memLevel: 9, strategy });
      if (!best || data.length < best.length) best = data;
    }
  }

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('tRNS', alphas),
    chunk('IDAT', best),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
