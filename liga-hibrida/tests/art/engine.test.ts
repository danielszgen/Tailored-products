// @vitest-environment node
// The pixel engine behind the Etapa IV visual bible (scripts/art/lib). Every sprite in the game
// goes through these primitives and this encoder, so a regression here silently corrupts the
// whole bible — and a PNG that a browser refuses is not something the app can report.
import { describe, expect, it } from 'vitest';
import zlib from 'node:zlib';

import { Sprite } from '../../scripts/art/lib/sprite.mjs';
import { encodeIndexedPng, parseHex } from '../../scripts/art/lib/png.mjs';
import { PALETTE, RAMPS, colorOf } from '../../scripts/art/lib/palette.mjs';

/** Minimal PNG reader: signature, then length/type/data triples. */
function readPng(buffer: Buffer) {
  expect([...buffer.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunks: Record<string, Buffer> = {};
  const order: string[] = [];
  for (let p = 8; p < buffer.length;) {
    const length = buffer.readUInt32BE(p);
    const type = buffer.toString('ascii', p + 4, p + 8);
    chunks[type] = buffer.subarray(p + 8, p + 8 + length);
    order.push(type);
    p += 12 + length;
  }
  const ihdr = chunks.IHDR;
  return {
    order,
    chunks,
    width: ihdr.readUInt32BE(0),
    height: ihdr.readUInt32BE(4),
    bitDepth: ihdr[8],
    colorType: ihdr[9],
    pixels: zlib.inflateSync(chunks.IDAT),
  };
}

describe('palette', () => {
  it('reserves index 0 for transparency and derives a ramp per brand colour', () => {
    expect(PALETTE.void).toBeDefined();
    expect(RAMPS).toContain('fuerza');
    expect(RAMPS).toContain('skin');
    for (const name of RAMPS) {
      expect(PALETTE[`${name}_lo`]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(PALETTE[`${name}_hi`]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('shades down and lights up around the base colour', () => {
    const sum = (hex: string) => parseHex(hex).reduce((a, b) => a + b, 0);
    for (const name of RAMPS) {
      expect(sum(colorOf(`${name}_lo`))).toBeLessThan(sum(colorOf(name)));
      expect(sum(colorOf(`${name}_hi`))).toBeGreaterThan(sum(colorOf(name)));
    }
  });

  it('rejects a colour that is not in the palette', () => {
    expect(() => colorOf('chartreuse')).toThrow(/Unknown palette colour/);
  });
});

describe('Sprite', () => {
  it('starts fully transparent and clips every primitive to its bounds', () => {
    const s = new Sprite(4, 4);
    expect(s.bounds()).toBeNull();
    s.rect(-2, -2, 3, 3, 'gold'); // mostly outside
    s.px(99, 99, 'gold'); // entirely outside
    expect(s.bounds()).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(s.at(0, 0)).toBe('gold');
    expect(s.at(1, 0)).toBe('void');
    expect(s.at(-1, 0)).toBe('void');
  });

  it('rejects a non-positive size', () => {
    expect(() => new Sprite(0, 8)).toThrow(/positive integers/);
    expect(() => new Sprite(8, 1.5)).toThrow(/positive integers/);
  });

  it('mirrors the left half onto the right half', () => {
    const s = new Sprite(6, 1);
    s.px(0, 0, 'gold');
    s.px(1, 0, 'fuerza');
    s.mirrorX();
    expect([0, 1, 2, 3, 4, 5].map((x) => s.at(x, 0))).toEqual([
      'gold',
      'fuerza',
      'void',
      'void',
      'fuerza',
      'gold',
    ]);
  });

  it('outlines the outside of a shape without touching it', () => {
    const s = new Sprite(5, 5);
    s.px(2, 2, 'gold');
    s.outline('ink');
    expect(s.at(2, 2)).toBe('gold');
    expect(s.at(1, 2)).toBe('ink');
    expect(s.at(3, 2)).toBe('ink');
    expect(s.at(2, 1)).toBe('ink');
    expect(s.at(2, 3)).toBe('ink');
    expect(s.at(1, 1)).toBe('void'); // 4-neighbour by default
  });

  it('embosses with the light at the top left', () => {
    const s = new Sprite(3, 3);
    s.rect(0, 0, 3, 3, 'fuerza');
    s.emboss(RAMPS);
    expect(s.at(0, 0)).toBe('fuerza_hi'); // exposed up and left
    expect(s.at(1, 1)).toBe('fuerza'); // enclosed
    expect(s.at(2, 2)).toBe('fuerza_lo'); // exposed down and right
  });

  it('leaves colours outside the given ramps alone when embossing', () => {
    const s = new Sprite(2, 2);
    s.rect(0, 0, 2, 2, 'steel'); // a flat neutral, no _lo/_hi
    s.emboss(RAMPS);
    expect(s.at(0, 0)).toBe('steel');
  });

  it('scales by whole pixels', () => {
    const s = new Sprite(2, 1);
    s.px(0, 0, 'gold');
    const big = s.scale(3);
    expect([big.width, big.height]).toEqual([6, 3]);
    expect(big.at(0, 0)).toBe('gold');
    expect(big.at(2, 2)).toBe('gold');
    expect(big.at(3, 0)).toBe('void');
  });

  it('packs frames of equal size into one sheet and refuses mismatched ones', () => {
    const a = new Sprite(4, 4).px(0, 0, 'gold');
    const b = new Sprite(4, 4).px(0, 0, 'fuerza');
    const sheet = Sprite.sheet([a, b]);
    expect([sheet.width, sheet.height]).toEqual([8, 4]);
    expect(sheet.at(0, 0)).toBe('gold');
    expect(sheet.at(4, 0)).toBe('fuerza');
    expect(() => Sprite.sheet([a, new Sprite(5, 4).px(0, 0, 'gold')])).toThrow(/same size/);
    expect(() => Sprite.sheet([])).toThrow(/at least one frame/);
  });

  it('run-length-encodes its SVG so a flat row is one rect', () => {
    const s = new Sprite(4, 1);
    s.rect(0, 0, 4, 1, 'gold');
    const svg = s.toSvg();
    expect(svg.match(/<rect/g)).toHaveLength(1);
    expect(svg).toContain('width="4"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });
});

describe('encodeIndexedPng', () => {
  it('writes a valid indexed PNG with index 0 transparent', () => {
    const s = new Sprite(3, 2);
    s.px(0, 0, 'gold');
    s.px(2, 1, 'fuerza');
    const png = readPng(s.toPng());

    expect(png.order).toEqual(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);
    expect([png.width, png.height]).toEqual([3, 2]);
    expect(png.bitDepth).toBe(8);
    expect(png.colorType).toBe(3); // indexed
    expect(png.chunks.PLTE.length).toBe(3 * 3); // void + gold + fuerza
    expect([...png.chunks.tRNS]).toEqual([0]); // only index 0 is see-through
    // Each row is one filter byte plus one index per pixel.
    expect(png.pixels.length).toBe(2 * (3 + 1));
  });

  it('keeps the palette in first-use order so the indices are stable', () => {
    const s = new Sprite(2, 1);
    s.px(0, 0, 'fuerza');
    s.px(1, 0, 'gold');
    const plte = readPng(s.toPng()).chunks.PLTE;
    expect([...plte.subarray(3, 6)]).toEqual(parseHex(colorOf('fuerza')));
    expect([...plte.subarray(6, 9)]).toEqual(parseHex(colorOf('gold')));
  });

  it('refuses a palette or a pixel buffer that does not add up', () => {
    expect(() =>
      encodeIndexedPng({ width: 2, height: 2, pixels: new Uint8Array(3), palette: ['#ffffff'] }),
    ).toThrow(/Expected 4 pixels/);
    expect(() =>
      encodeIndexedPng({ width: 1, height: 1, pixels: new Uint8Array(1), palette: [] }),
    ).toThrow(/1–256 colours/);
  });

  it('parses only #rrggbb', () => {
    expect(parseHex('#E9A82A')).toEqual([233, 168, 42]);
    expect(() => parseHex('rgb(1,2,3)')).toThrow(/Not a #rrggbb/);
  });
});
