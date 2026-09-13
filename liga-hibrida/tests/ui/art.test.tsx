// The Etapa IV visual bible as the app sees it: the generated manifest, what it must cover, and
// the two components that draw it. The disk checks are the ones that matter most day to day —
// they fail when someone edits a sprite program and forgets to run `pnpm art`.
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ART,
  findArt,
  LEADER_NAMES,
  LEADER_TAGLINES,
  ObjectIcon,
  PixelArt,
  PixelMedal,
  PixelTypeGlyph,
  PvOrb,
  SceneBanner,
  SpriteAnimation,
  TrainerAvatar,
  type ArtId,
} from '@/brand/art';
import { GYM_NAMES, GYM_ORDER } from '@/domain/content/gyms';
import { BACKPACK_ITEMS } from '@/domain/content/items';
import type { Form, StatKey, Status } from '@/domain/types';

const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const FORMS: Form[] = [1, 2, 3, 4];
const STATUSES: Status[] = ['ok', 'cargado', 'ko'];
const TYPES: Array<StatKey | 'regen'> = ['masa', 'fuerza', 'motor', 'control', 'aventura', 'regen'];

/** Width and height straight out of the PNG header. */
function pngSize(file: string) {
  const buffer = fs.readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('the art manifest', () => {
  it('points at a file that exists, at exactly the size it claims', () => {
    for (const [id, asset] of Object.entries(ART)) {
      const file = path.join(PUBLIC_DIR, asset.src);
      expect(fs.existsSync(file), `${id} → ${asset.src} is missing`).toBe(true);
      // A sheet is one row of frames, so the file is `width * frames` across.
      expect(pngSize(file), `${id} is the wrong size`).toEqual({
        width: asset.width * asset.frames,
        height: asset.height,
      });
    }
  });

  it('leaves no orphan PNG in public/art', () => {
    const declared = new Set(
      Object.values(ART)
        .map((a) => a.src)
        .filter((src) => src.startsWith('/art/'))
        .map((src) => src.slice('/art/'.length)),
    );
    for (const file of fs.readdirSync(path.join(PUBLIC_DIR, 'art'))) {
      expect(declared.has(file), `public/art/${file} is not in the manifest`).toBe(true);
    }
  });

  it('covers every Forma, gym, medal state, type, Mochila object and PV state', () => {
    const ids = new Set(Object.keys(ART));
    for (const form of FORMS) expect(ids).toContain(`avatar-forma-${form}`);
    for (const gym of GYM_ORDER) {
      expect(ids).toContain(`leader-${gym}`);
      for (const state of ['locked', 'progress', 'earned']) {
        expect(ids).toContain(`medal-${gym}-${state}`);
      }
    }
    for (const type of TYPES) expect(ids).toContain(`type-${type}`);
    for (const item of BACKPACK_ITEMS) {
      expect(ids).toContain(`object-${item.id.replace(/_/g, '-')}`);
    }
    for (const status of STATUSES) expect(ids).toContain(`anim-pv-${status}`);
    for (const id of ['scene-ruta', 'scene-zona-salvaje', 'anim-gate', 'anim-medal-burst']) {
      expect(ids).toContain(id);
    }
  });

  it('marks the animations as sheets and the sprites as stills', () => {
    for (const [id, asset] of Object.entries(ART)) {
      if (id.startsWith('anim-')) expect(asset.frames, id).toBeGreaterThan(1);
      else expect(asset.frames, id).toBe(1);
    }
  });

  it('names and describes all four leaders', () => {
    for (const gym of GYM_ORDER) {
      expect(LEADER_NAMES[gym]).toMatch(/\S/);
      expect(LEADER_TAGLINES[gym]).toMatch(/\S/);
    }
    expect(new Set(Object.values(LEADER_NAMES)).size).toBe(GYM_ORDER.length);
  });
});

describe('findArt', () => {
  it('returns the id when the bible has it and null when it does not', () => {
    expect(findArt('avatar-forma-1')).toBe('avatar-forma-1');
    expect(findArt('leader-gimnasio-inventado')).toBeNull();
    // Not fooled by keys inherited from Object.prototype.
    expect(findArt('toString')).toBeNull();
  });
});

describe('PixelArt', () => {
  it('renders the sprite at a whole multiple of its authored size', () => {
    render(<PixelArt id="mark" scale={3} alt="Marca" />);
    const img = screen.getByRole('img', { name: 'Marca' });
    expect(img).toHaveAttribute('src', ART.mark.src);
    expect(img).toHaveAttribute('width', String(ART.mark.width * 3));
    expect(img).toHaveAttribute('height', String(ART.mark.height * 3));
  });

  it('is decorative by default so it can sit next to its own label', () => {
    const { container } = render(<PixelArt id="mark" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('refuses an animation sheet, which it would render as every frame at once', () => {
    // The guard only fires in development, which is where a wrong id gets written.
    expect(() => render(<PixelArt id="anim-gate" />)).toThrow(/use <SpriteAnimation>/);
  });
});

describe('SpriteAnimation', () => {
  it('steps through the frames of the sheet', () => {
    const { container } = render(<SpriteAnimation id="anim-medal-burst" scale={2} />);
    const span = container.querySelector('span');
    const asset = ART['anim-medal-burst'];
    expect(span).toHaveStyle({
      width: `${asset.width * 2}px`,
      animationTimingFunction: `steps(${asset.frames})`,
      animationIterationCount: '1',
    });
    // The sheet is scrolled by its whole width, so `steps()` lands on frames 0..n-1.
    expect(span?.style.getPropertyValue('--sprite-end')).toBe(
      `-${asset.width * 2 * asset.frames}px`,
    );
  });

  it('finishes on animationend and removes itself', async () => {
    const onDone = vi.fn();
    const { container } = render(
      <SpriteAnimation id="anim-medal-burst" durationMs={50} onDone={onDone} />,
    );
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(container.querySelector('span')).toBeNull();
  });

  it('never reports done twice, however the end arrives', async () => {
    const onDone = vi.fn();
    render(<SpriteAnimation id="anim-gate" durationMs={20} onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('loops for ever without ever reporting done', async () => {
    const onDone = vi.fn();
    const { container } = render(
      <SpriteAnimation id="anim-pv-ok" loop durationMs={20} onDone={onDone} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(onDone).not.toHaveBeenCalled();
    expect(container.querySelector('span')).toHaveStyle({ animationIterationCount: 'infinite' });
  });
});

describe('the domain-aware sprites', () => {
  it('names the Forma it is showing', () => {
    render(<TrainerAvatar form={3} />);
    expect(screen.getByRole('img', { name: 'Entrenador en Forma III' })).toBeInTheDocument();
  });

  it('picks the medal state from earned and progress', () => {
    const { rerender } = render(<PixelMedal gymId="cantera" earned={false} progress={0} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', ART['medal-cantera-locked'].src);
    rerender(<PixelMedal gymId="cantera" earned={false} progress={0.4} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', ART['medal-cantera-progress'].src);
    rerender(<PixelMedal gymId="cantera" earned progress={1} />);
    const earned = screen.getByRole('img');
    expect(earned).toHaveAttribute('src', ART['medal-cantera-earned'].src);
    expect(earned).toHaveAccessibleName(`Medalla ${GYM_NAMES.cantera} conseguida`);
  });

  it('gives the PV orb the colour of the status', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<PvOrb status={status} />);
      expect(container.querySelector('span')?.style.backgroundImage).toContain(
        ART[`anim-pv-${status}`].src,
      );
      unmount();
    }
  });

  it('draws every Mochila object of SPEC §6.8', () => {
    for (const item of BACKPACK_ITEMS) {
      const { container, unmount } = render(<ObjectIcon itemId={item.id} />);
      expect(container.querySelector('img'), item.id).not.toBeNull();
      unmount();
    }
  });

  it('draws the six type glyphs, named only where no text names them', () => {
    for (const type of TYPES) {
      const { container, unmount } = render(<PixelTypeGlyph type={type} alt={type} />);
      expect(container.querySelector('img'), type).toHaveAttribute('src', ART[`type-${type}`].src);
      unmount();
    }
    const { container } = render(<PixelTypeGlyph type="masa" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('renders nothing instead of throwing when a sprite has not been drawn', () => {
    const { container } = render(<ObjectIcon itemId="objeto_que_no_existe" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stretches the scene banners to the card', () => {
    const { container } = render(<SceneBanner scene="zona-salvaje" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', ART['scene-zona-salvaje'].src);
    expect(img?.className).toContain('w-full');
    expect(img?.className).toContain('pixel-art');
  });
});

describe('the art ids used across the app', () => {
  it('resolves every id the screens ask for', () => {
    const used: ArtId[] = [
      'mark',
      'anim-gate',
      'anim-medal-burst',
      'anim-evolution',
      'scene-ruta',
      'scene-zona-salvaje',
    ];
    for (const id of used) expect(ART[id]).toBeDefined();
  });
});
