// Types for the art pipeline's PNG encoder. The implementation is plain ESM so `pnpm art` can
// run with nothing installed; these declarations are what lets the tests import it typed.
import type { Buffer } from 'node:buffer';

export declare function parseHex(hex: string): [number, number, number];

export declare function encodeIndexedPng(image: {
  width: number;
  height: number;
  /** One palette index per pixel, row-major. */
  pixels: Uint8Array;
  /** Up to 256 '#rrggbb' entries. */
  palette: readonly string[];
  /** Written fully transparent. Defaults to 0. */
  transparentIndex?: number;
}): Buffer;
