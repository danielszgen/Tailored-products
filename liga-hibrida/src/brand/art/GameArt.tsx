import type { Form, GymId, StatKey, Status } from '@/domain/types';
import { GYM_NAMES } from '@/domain/content/gyms';
import { ART } from './manifest';
import { findArt } from './lookup';
import { PixelArt } from './PixelArt';
import { SpriteAnimation } from './SpriteAnimation';

/**
 * The domain-aware layer of the visual bible: these components take a gym, a Forma or a status
 * and pick the sprite. Screens never handle `ART` ids themselves, so a renamed asset is one
 * edit here, and a sprite that does not exist renders nothing instead of throwing.
 */

const FORM_LABEL: Record<Form, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

const MEDAL_STATE_WORD = {
  locked: 'bloqueada',
  progress: 'en progreso',
  earned: 'conseguida',
} as const;

/** The trainer in the Forma they are in (SPEC §6.3). */
export function TrainerAvatar({
  form,
  scale = 2,
  className,
}: {
  form: Form;
  scale?: number;
  className?: string;
}) {
  const id = findArt(`avatar-forma-${form}`);
  if (!id) return null;
  return (
    <PixelArt
      id={id}
      scale={scale}
      alt={`Entrenador en Forma ${FORM_LABEL[form]}`}
      className={className}
    />
  );
}

/** The leader who runs a gym. Decorative: their name is always written next to it. */
export function GymLeader({
  gymId,
  scale = 2,
  className,
}: {
  gymId: GymId;
  scale?: number;
  className?: string;
}) {
  const id = findArt(`leader-${gymId}`);
  if (!id) return null;
  return <PixelArt id={id} scale={scale} className={className} />;
}

/** A medal in one of the three states of SPEC §4.3. */
export function PixelMedal({
  gymId,
  earned,
  progress,
  scale = 2,
  alt,
  className,
}: {
  gymId: GymId;
  earned: boolean;
  /** 0–1. Anything above zero shows the in-progress medal rather than the locked one. */
  progress: number;
  scale?: number;
  /** Overrides the accessible name, for callers that already phrase it (the LIGA medal list). */
  alt?: string;
  className?: string;
}) {
  const state = earned ? 'earned' : progress > 0 ? 'progress' : 'locked';
  const id = findArt(`medal-${gymId}-${state}`);
  if (!id) return null;
  return (
    <PixelArt
      id={id}
      scale={scale}
      alt={alt ?? `Medalla ${GYM_NAMES[gymId]} ${MEDAL_STATE_WORD[state]}`}
      className={className}
    />
  );
}

/** The PV orb, breathing in the colour of the day's status (R1). */
export function PvOrb({
  status,
  scale = 2,
  className,
}: {
  status: Status;
  scale?: number;
  className?: string;
}) {
  const id = findArt(`anim-pv-${status}`);
  if (!id) return null;
  return <SpriteAnimation id={id} scale={scale} loop durationMs={2200} className={className} />;
}

/** The burst that plays over a medal the moment it is earned. */
export function MedalBurst({ scale = 2, onDone }: { scale?: number; onDone?: () => void }) {
  return <SpriteAnimation id="anim-medal-burst" scale={scale} onDone={onDone} />;
}

/** The gate that opens when a Combate starts. */
export function GymGate({ scale = 3, onDone }: { scale?: number; onDone?: () => void }) {
  return <SpriteAnimation id="anim-gate" scale={scale} durationMs={640} onDone={onDone} />;
}

/** The light column of an evolution, played over the Forma that is being left behind. */
export function EvolutionFlash({ scale = 2, onDone }: { scale?: number; onDone?: () => void }) {
  return <SpriteAnimation id="anim-evolution" scale={scale} durationMs={720} onDone={onDone} />;
}

/**
 * One of the six type glyphs of SPEC §4.3, at the arcade scale.
 *
 * The SVG `TypeGlyph` stays where the glyph has to be tiny or follow the text colour (the type
 * pills are 12 px in the accent of their own pill); a 16 px sprite squeezed into 12 px would just
 * lose pixels. Here, at 16 or 32 px, the sprite is the one that belongs.
 */
export function PixelTypeGlyph({
  type,
  scale = 1,
  alt = '',
  className,
}: {
  type: StatKey | 'regen';
  scale?: number;
  alt?: string;
  className?: string;
}) {
  const id = findArt(`type-${type}`);
  if (!id) return null;
  return <PixelArt id={id} scale={scale} alt={alt} className={className} />;
}

/** A Mochila object (SPEC §6.8), by the item id of src/domain/content/items.ts. */
export function ObjectIcon({
  itemId,
  scale = 2,
  className,
}: {
  itemId: string;
  scale?: number;
  className?: string;
}) {
  const id = findArt(`object-${itemId.replace(/_/g, '-')}`);
  if (!id) return null;
  return <PixelArt id={id} scale={scale} className={className} />;
}

/**
 * A full-width backdrop for the RUTAS cards. The banner stretches to the card, which means a
 * non-integer scale, but `image-rendering: pixelated` keeps the blocks hard instead of blurring.
 */
export function SceneBanner({
  scene,
  className,
}: {
  scene: 'ruta' | 'zona-salvaje';
  className?: string;
}) {
  const asset = ART[`scene-${scene}`];
  return (
    <img
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      className={['pixel-art block w-full h-auto', className].filter(Boolean).join(' ')}
      draggable={false}
    />
  );
}
