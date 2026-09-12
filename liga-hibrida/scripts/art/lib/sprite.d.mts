// Types for the art pipeline's pixel canvas. See sprite.mjs for the behaviour of each primitive.
import type { Buffer } from 'node:buffer';

/** A key of the palette, such as `fuerza_lo`, `skin_hi` or `void`. */
export type ColorName = string;

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export declare class Sprite {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number);

  /** Palette index for a colour name, allocating on first use. */
  id(name: ColorName): number;

  inside(x: number, y: number): boolean;
  /** Colour name at a pixel, or `'void'` when transparent or out of bounds. */
  at(x: number, y: number): ColorName;
  opaque(x: number, y: number): boolean;
  /** Bounding box of the opaque pixels, or null when nothing has been drawn. */
  bounds(): Bounds | null;

  px(x: number, y: number, color: ColorName): this;
  rect(x: number, y: number, width: number, height: number, color: ColorName): this;
  frame(x: number, y: number, width: number, height: number, color: ColorName): this;
  hline(x: number, y: number, length: number, color: ColorName): this;
  vline(x: number, y: number, length: number, color: ColorName): this;
  line(x0: number, y0: number, x1: number, y1: number, color: ColorName): this;
  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: ColorName,
    options?: { fill?: boolean },
  ): this;
  poly(points: readonly (readonly [number, number])[], color: ColorName): this;
  dither(
    x: number,
    y: number,
    width: number,
    height: number,
    a: ColorName,
    b: ColorName,
    options?: { phase?: number },
  ): this;

  blit(src: Sprite, dx?: number, dy?: number): this;
  /** Mirrors the left half onto the right half. */
  mirrorX(): this;
  /** Surrounds every opaque pixel with `color`. */
  outline(color?: ColorName, options?: { diagonal?: boolean }): this;
  /** Shades the listed ramps with the light at the top left. Call before `outline`. */
  emboss(ramps: readonly string[]): this;

  /** Nearest-neighbour integer upscale. */
  scale(factor: number): Sprite;
  clone(): Sprite;
  /** Packs frames of equal size left to right into one sheet. */
  static sheet(frames: readonly Sprite[]): Sprite;

  toPng(): Buffer;
  toSvg(options?: { background?: ColorName | null }): string;
}
