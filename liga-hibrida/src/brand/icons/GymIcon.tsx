import type { GymId } from '@/domain/types';
import { MedalArt } from './MedalIcon';
import type { IconBaseProps } from './TypeGlyph';

export interface GymIconProps extends IconBaseProps {
  gym: GymId;
}

/** The gym's medal shape in solid gym color, without state styling — for lists and cards. */
export function GymIcon({ gym, ...base }: GymIconProps) {
  return <MedalArt gym={gym} state="solid" {...base} />;
}
