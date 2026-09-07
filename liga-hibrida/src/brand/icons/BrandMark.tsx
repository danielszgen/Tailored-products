import { colors } from '@/brand/tokens';
import { IconSvg, type IconBaseProps } from './TypeGlyph';

export type BrandMarkProps = IconBaseProps;

const GOLD = colors.light.gold;
const ACCENT = colors.light.accent;
const SNOW = '#FFFFFF';

/**
 * App mark: a hexagonal badge (gold rim, accent face) holding a mountain above a loaded bar —
 * the outdoors and the iron of the hybrid league. Original geometry, no text.
 * Keep the paths in sync with public/icons/icon.svg (the PWA icon).
 */
export function BrandMark(props: BrandMarkProps) {
  return (
    <IconSvg viewBox="0 0 64 64" {...props}>
      <path d="M32 2l25.98 15v30L32 62 6.02 47V17z" fill={GOLD} />
      <path d="M32 6.5l22.08 12.75v25.5L32 57.5 9.92 44.75v-25.5z" fill={ACCENT} />
      <path d="M13.5 35.5L26.5 17l6.5 9.5 5.5-5.5L50.5 35.5z" fill={SNOW} />
      <rect x="13" y="39.5" width="38" height="4" rx="2" fill={GOLD} />
      <rect x="17.5" y="35.5" width="5" height="12" rx="1.5" fill={GOLD} />
      <rect x="41.5" y="35.5" width="5" height="12" rx="1.5" fill={GOLD} />
    </IconSvg>
  );
}
