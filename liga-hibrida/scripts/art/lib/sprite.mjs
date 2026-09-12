/**
 * A tiny pixel canvas: the drawing surface every sprite program in the visual bible paints on.
 *
 * Pixels hold palette *names*, not colours, so a sprite program reads like a description of the
 * drawing ("fuerza_lo", "skin_hi") and a token change repaints the whole bible. Indices are
 * allocated in first-use order with 0 reserved for `void` (transparent).
 *
 * Coordinates are integers with the origin at the top-left. Every primitive clips silently, so a
 * sprite program can draw past the edge without guarding.
 */
import { colorOf } from './palette.mjs';
import { encodeIndexedPng } from './png.mjs';

export class Sprite {
  /** @param {number} width @param {number} height */
  constructor(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new Error(`Sprite size must be positive integers, got ${width}×${height}`);
    }
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height); // 0 everywhere = fully transparent
    this.names = ['void'];
    this.indexOf = new Map([['void', 0]]);
  }

  // ---- palette -------------------------------------------------------------------------------

  /** Palette index for a colour name, allocating on first use. */
  id(name) {
    const existing = this.indexOf.get(name);
    if (existing !== undefined) return existing;
    colorOf(name); // validates the name
    if (this.names.length >= 256) throw new Error('A sprite cannot use more than 256 colours');
    const index = this.names.length;
    this.names.push(name);
    this.indexOf.set(name, index);
    return index;
  }

  // ---- reading -------------------------------------------------------------------------------

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Colour name at a pixel, or `'void'` when transparent / out of bounds. */
  at(x, y) {
    if (!this.inside(x, y)) return 'void';
    return this.names[this.data[y * this.width + x]];
  }

  opaque(x, y) {
    return this.inside(x, y) && this.data[y * this.width + x] !== 0;
  }

  /** Bounding box of the opaque pixels, or null when the sprite is empty. */
  bounds() {
    let x0 = this.width;
    let y0 = this.height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.data[y * this.width + x] === 0) continue;
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  }

  // ---- primitives ----------------------------------------------------------------------------

  px(x, y, color) {
    if (!this.inside(x, y)) return this;
    this.data[y * this.width + x] = color === 'void' ? 0 : this.id(color);
    return this;
  }

  rect(x, y, width, height, color) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) this.px(x + dx, y + dy, color);
    }
    return this;
  }

  /** 1px border only. */
  frame(x, y, width, height, color) {
    this.hline(x, y, width, color);
    this.hline(x, y + height - 1, width, color);
    this.vline(x, y, height, color);
    this.vline(x + width - 1, y, height, color);
    return this;
  }

  hline(x, y, length, color) {
    for (let i = 0; i < length; i++) this.px(x + i, y, color);
    return this;
  }

  vline(x, y, length, color) {
    for (let i = 0; i < length; i++) this.px(x, y + i, color);
    return this;
  }

  /** Bresenham. */
  line(x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, color);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    return this;
  }

  /**
   * Filled or hollow ellipse. Radii are inclusive half-extents, so `ellipse(8, 8, 3, 3)` covers
   * a 7×7 disc centred on (8, 8).
   */
  ellipse(cx, cy, rx, ry, color, { fill = true } = {}) {
    const inside = (x, y) => {
      const nx = (x - cx) / (rx + 0.5);
      const ny = (y - cy) / (ry + 0.5);
      return nx * nx + ny * ny <= 1;
    };
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (!inside(x, y)) continue;
        const edge =
          !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        if (fill || edge) this.px(x, y, color);
      }
    }
    return this;
  }

  /** Scanline polygon fill (even-odd) over `[[x, y], ...]`. */
  poly(points, color) {
    const ys = points.map(([, y]) => y);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % points.length];
        if (ay === by) continue;
        const lo = Math.min(ay, by);
        const hi = Math.max(ay, by);
        if (y < lo || y >= hi) continue;
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) this.px(x, y, color);
      }
    }
    return this;
  }

  /** Checkerboard of two colours — the 16-bit way to fake a third shade. */
  dither(x, y, width, height, a, b, { phase = 0 } = {}) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.px(x + dx, y + dy, (dx + dy + phase) % 2 === 0 ? a : b);
      }
    }
    return this;
  }

  // ---- transforms ----------------------------------------------------------------------------

  /** Copies the opaque pixels of `src` onto this sprite. */
  blit(src, dx = 0, dy = 0) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const name = src.at(x, y);
        if (name !== 'void') this.px(x + dx, y + dy, name);
      }
    }
    return this;
  }

  /** Mirrors the left half onto the right half. Characters are drawn once and doubled. */
  mirrorX() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < Math.floor(this.width / 2); x++) {
        this.px(this.width - 1 - x, y, this.at(x, y));
      }
    }
    return this;
  }

  /** Surrounds every opaque pixel with `color`, the classic pixel-art contour. */
  outline(color = 'ink', { diagonal = false } = {}) {
    const targets = [];
    const offsets = diagonal
      ? [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ]
      : [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.opaque(x, y)) continue;
        if (offsets.some(([ox, oy]) => this.opaque(x + ox, y + oy))) targets.push([x, y]);
      }
    }
    for (const [x, y] of targets) this.px(x, y, color);
    return this;
  }

  /**
   * Gives flat shapes volume: every pixel of a listed ramp that is exposed up or left becomes
   * `_hi`, every pixel exposed down or right becomes `_lo`. One pass over the whole sprite is
   * what keeps the light source identical across the bible — call it before `outline()`, while
   * the outside is still transparent.
   */
  emboss(ramps) {
    const changes = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const name = this.at(x, y);
        if (!ramps.includes(name)) continue;
        if (!this.opaque(x - 1, y) || !this.opaque(x, y - 1)) changes.push([x, y, `${name}_hi`]);
        else if (!this.opaque(x + 1, y) || !this.opaque(x, y + 1)) {
          changes.push([x, y, `${name}_lo`]);
        }
      }
    }
    for (const [x, y, name] of changes) this.px(x, y, name);
    return this;
  }

  /** Nearest-neighbour integer upscale. */
  scale(factor) {
    const out = new Sprite(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const name = this.at(x, y);
        if (name === 'void') continue;
        out.rect(x * factor, y * factor, factor, factor, name);
      }
    }
    return out;
  }

  clone() {
    const out = new Sprite(this.width, this.height);
    return out.blit(this);
  }

  /** Packs frames left to right into one sheet. All frames must share their size. */
  static sheet(frames) {
    if (frames.length === 0) throw new Error('A sheet needs at least one frame');
    const { width, height } = frames[0];
    if (frames.some((f) => f.width !== width || f.height !== height)) {
      throw new Error('Every frame of a sheet must have the same size');
    }
    const out = new Sprite(width * frames.length, height);
    frames.forEach((frame, i) => out.blit(frame, i * width, 0));
    return out;
  }

  // ---- output --------------------------------------------------------------------------------

  toPng() {
    return encodeIndexedPng({
      width: this.width,
      height: this.height,
      pixels: this.data,
      palette: this.names.map(colorOf),
      transparentIndex: 0,
    });
  }

  /**
   * Run-length-encoded SVG of the same grid, for the places that need a vector (the app icon and
   * the favicon). Horizontal runs collapse into one <rect>, which keeps the file tiny.
   */
  toSvg({ background = null } = {}) {
    const rects = [];
    for (let y = 0; y < this.height; y++) {
      let x = 0;
      while (x < this.width) {
        const name = this.at(x, y);
        if (name === 'void') {
          x++;
          continue;
        }
        let run = 1;
        while (x + run < this.width && this.at(x + run, y) === name) run++;
        rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colorOf(name)}"/>`);
        x += run;
      }
    }
    const bg = background
      ? `<rect width="${this.width}" height="${this.height}" fill="${colorOf(background)}"/>`
      : '';
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" ` +
      `width="${this.width}" height="${this.height}" shape-rendering="crispEdges">` +
      bg +
      rects.join('') +
      '</svg>'
    );
  }
}
