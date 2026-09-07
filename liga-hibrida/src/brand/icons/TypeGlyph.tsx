import type { CSSProperties, ReactNode } from 'react';
import type { StatKey } from '@/domain/types';
import { colors } from '@/brand/tokens';

/** Props shared by every brand icon (SPEC §4.3). */
export interface IconBaseProps {
  /** Rendered width and height in px; the artwork scales from its viewBox. Default 24. */
  size?: number;
  className?: string;
  /**
   * Accessible name. When given, the icon is exposed as role="img" with a <title>;
   * without it the icon is decorative (aria-hidden).
   */
  title?: string;
  style?: CSSProperties;
}

interface IconSvgProps extends IconBaseProps {
  viewBox?: string;
  children: ReactNode;
}

/**
 * Shared <svg> wrapper for all brand icons: sizing plus the accessibility contract.
 * It lives next to the first icon set so the icons stay a flat group of files.
 */
export function IconSvg({
  size = 24,
  className,
  title,
  style,
  viewBox = '0 0 24 24',
  children,
}: IconSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export type GlyphType = StatKey | 'regen';

export interface TypeGlyphProps extends IconBaseProps {
  type: GlyphType;
  /** Overrides the token color. Any CSS color works, including 'currentColor'. */
  color?: string;
}

const STROKE = {
  fill: 'none',
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// Original 24 px geometry, one color per glyph (SPEC §4.3).
const GLYPHS: Record<GlyphType, (c: string) => ReactNode> = {
  // Weight plate threaded on its bar.
  masa: (c) => (
    <>
      <circle cx="12" cy="12" r="6.5" {...STROKE} stroke={c} strokeWidth={3} />
      <path d="M2 12h20" {...STROKE} stroke={c} strokeWidth={3} />
    </>
  ),
  // Solid hexagon: the nut that holds everything together.
  fuerza: (c) => <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill={c} />,
  // Wavy shaft with a chevron head: sustained movement.
  motor: (c) => (
    <>
      <path d="M2.5 12c1.75-5 3.5-5 5.25 0s3.5 5 5.25 0 3.5-5 5.25 0" {...STROKE} stroke={c} />
      <path d="M16.5 7.5l4.5 4.5-4.5 4.5" {...STROKE} stroke={c} />
    </>
  ),
  // Inverted triangle balanced on its tip, with a point at its centre.
  control: (c) => (
    <>
      <path d="M3 5h18L12 20.5z" {...STROKE} stroke={c} />
      <circle cx="12" cy="10" r="2.4" fill={c} />
    </>
  ),
  // Two-peak mountain.
  aventura: (c) => <path d="M2 20L9 6.5l3.6 6 2.8-3.5L22 20z" fill={c} />,
  // Drop.
  regen: (c) => (
    <path d="M12 2.5c3.5 4.5 6.5 8 6.5 12a6.5 6.5 0 0 1-13 0c0-4 3-7.5 6.5-12z" fill={c} />
  ),
};

/** The six geometric type glyphs (SPEC §4.3), colored with the type token unless overridden. */
export function TypeGlyph({ type, color, ...base }: TypeGlyphProps) {
  return <IconSvg {...base}>{GLYPHS[type](color ?? colors.types[type])}</IconSvg>;
}
