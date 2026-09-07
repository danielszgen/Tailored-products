import type { ReactNode } from 'react';
import type { GymId } from '@/domain/types';
import { colors } from '@/brand/tokens';
import { IconSvg, type IconBaseProps } from './TypeGlyph';

export type MedalState = 'locked' | 'progress' | 'earned';

export interface MedalIconProps extends IconBaseProps {
  gym: GymId;
  state: MedalState;
}

/** Gym → color: each gym borrows the token of the type it trains most (SPEC §4.1, §4.3). */
// eslint-disable-next-line react-refresh/only-export-components -- shared constant that belongs with the medal art
export const GYM_COLORS: Record<GymId, string> = {
  cantera: colors.types.fuerza,
  yunque: colors.types.masa,
  resorte: colors.types.aventura,
  vertigo: colors.types.control,
};

const LOCKED_STROKE = 'var(--c-ink3)';
const EMBLEM = '#FFFFFF';
const GLINT = colors.light.gold;

interface MedalShape {
  /** Outer badge; drawn without fill/stroke of its own so the state group can paint it. */
  badge: ReactNode;
  /** Stroke-only emblem parts (always outlines). */
  lines?: ReactNode;
  /** Stroke width for `lines` (default 2). */
  lineWidth?: number;
  /** Filled emblem parts; they become outlines in the locked state. */
  solids?: ReactNode;
  /** Where the glint sits on the badge's top-right shoulder. */
  glint: [number, number];
}

// Original medal geometry (SPEC §4.3), all in a 24 px box.
const SHAPES: Record<GymId, MedalShape> = {
  // Cantera (Lower A): hexagon holding a mountain.
  cantera: {
    badge: <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />,
    solids: <path d="M6.5 15.75l3.6-6.5 2.4 3.6 1.7-2.4 3.3 5.3z" />,
    glint: [18.4, 4.8],
  },
  // Yunque (Upper A): circle holding a loaded bar (bar + two discs).
  yunque: {
    badge: <circle cx="12" cy="12" r="10" />,
    lines: <path d="M4.5 12h2.5M10.4 12h3.2M17 12h2.5" />,
    solids: (
      <>
        <rect x="7" y="7.5" width="3.4" height="9" rx="1.2" />
        <rect x="13.6" y="7.5" width="3.4" height="9" rx="1.2" />
      </>
    ),
    glint: [19.2, 4.8],
  },
  // Resorte (Lower B): rounded square holding a spiral (half-turns of growing radius).
  resorte: {
    badge: <rect x="2" y="2" width="20" height="20" rx="5.5" />,
    lines: <path d="M12 11.25a1.5 1.5 0 0 1 3 0a3 3 0 0 1-6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1-12 0" />,
    lineWidth: 1.7,
    glint: [19.6, 4.4],
  },
  // Vértigo (Upper B): triangle holding an inverted figure (a handstand).
  vertigo: {
    badge: <path d="M12 2.5l9.5 18h-19z" />,
    lines: <path d="M12 6.2v6.8M12 13l-3.2 5.2M12 13l3.2 5.2" />,
    solids: <circle cx="12" cy="16.4" r="1.7" />,
    glint: [17.4, 6.2],
  },
};

const sparkle = (r: number) => `M0 ${-r}Q0 0 ${r} 0Q0 0 0 ${r}Q0 0 ${-r} 0Q0 0 0 ${-r}z`;

function Glint({ at: [x, y] }: { at: [number, number] }) {
  return (
    <g data-part="glint" transform={`translate(${x} ${y})`}>
      <path d={sparkle(3)} fill={GLINT} />
      <path d={sparkle(1.6)} fill={EMBLEM} />
    </g>
  );
}

interface MedalArtProps extends IconBaseProps {
  gym: GymId;
  /** 'solid' = plain gym color with no state styling (used by GymIcon). */
  state: MedalState | 'solid';
}

/** Shared renderer for MedalIcon and GymIcon. */
export function MedalArt({ gym, state, ...base }: MedalArtProps) {
  const shape = SHAPES[gym];
  const locked = state === 'locked';
  const body = (
    <>
      <g
        fill={locked ? 'none' : GYM_COLORS[gym]}
        stroke={locked ? LOCKED_STROKE : 'none'}
        strokeWidth={2}
        strokeLinejoin="round"
      >
        {shape.badge}
      </g>
      {shape.lines && (
        <g
          fill="none"
          stroke={locked ? LOCKED_STROKE : EMBLEM}
          strokeWidth={shape.lineWidth ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {shape.lines}
        </g>
      )}
      {shape.solids && (
        <g
          fill={locked ? 'none' : EMBLEM}
          stroke={locked ? LOCKED_STROKE : 'none'}
          strokeWidth={1.75}
          strokeLinejoin="round"
        >
          {shape.solids}
        </g>
      )}
    </>
  );
  return (
    <IconSvg {...base}>
      {state === 'progress' ? <g opacity={0.5}>{body}</g> : body}
      {state === 'earned' && <Glint at={shape.glint} />}
    </IconSvg>
  );
}

/**
 * Gym medal (SPEC §4.3). States: locked = grey outline only; progress = gym color at 50 %;
 * earned = full color plus a glint.
 */
export function MedalIcon({ gym, state, ...base }: MedalIconProps) {
  return <MedalArt gym={gym} state={state} {...base} />;
}
