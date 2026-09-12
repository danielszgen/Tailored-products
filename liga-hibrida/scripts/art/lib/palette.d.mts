// Types for the art pipeline's palette. See palette.mjs for how the ramps are derived.

/** Every colour of the bible, from `void` (transparent) to the per-hue `_lo`/`_hi` ramps. */
export declare const PALETTE: Record<string, string>;

export declare const COLOR_NAMES: string[];

/** The colours that have both a `_lo` and a `_hi`, i.e. what `Sprite#emboss` can shade. */
export declare const RAMPS: string[];

/** '#rrggbb' for a palette name; throws on a typo instead of painting the wrong colour. */
export declare function colorOf(name: string): string;
