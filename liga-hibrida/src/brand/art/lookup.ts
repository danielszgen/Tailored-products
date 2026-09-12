import { ART, type ArtId } from './manifest';

/**
 * Narrows a runtime string to an `ArtId`, or null when the bible has no such sprite.
 *
 * Some ids are built from domain values (a Mochila item id, a gym id), which the compiler cannot
 * check. Screens use this so a sprite that has not been drawn yet degrades to the SVG icon or to
 * plain text instead of throwing.
 */
export function findArt(id: string): ArtId | null {
  return Object.prototype.hasOwnProperty.call(ART, id) ? (id as ArtId) : null;
}
