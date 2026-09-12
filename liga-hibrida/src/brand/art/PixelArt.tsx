import { ART, type ArtId } from './manifest';

interface PixelArtProps {
  /** Key in the generated manifest, e.g. `avatar-forma-2`. */
  id: ArtId;
  /** Integer multiplier. Sprites are authored small, so keep this a whole number. */
  scale?: number;
  /** Empty (the default) marks the sprite decorative, which is right next to a text label. */
  alt?: string;
  className?: string;
}

/**
 * One still sprite of the visual bible, at an integer scale so the pixels stay square.
 *
 * Animation sheets go through `SpriteAnimation` instead — this component would show every frame
 * at once, so it throws in development if it is handed one.
 */
export function PixelArt({ id, scale = 2, alt = '', className }: PixelArtProps) {
  const asset = ART[id];
  if (import.meta.env.DEV && asset.frames > 1) {
    throw new Error(`${id} is a ${asset.frames}-frame sheet: use <SpriteAnimation> for it`);
  }
  return (
    <img
      src={asset.src}
      width={asset.width * scale}
      height={asset.height * scale}
      alt={alt}
      className={['pixel-art', className].filter(Boolean).join(' ')}
      draggable={false}
    />
  );
}
