import type { ReactNode } from 'react';
import type { Form } from '@/domain/types';
import { IconSvg, type IconBaseProps } from './TypeGlyph';

export interface FormSilhouetteProps extends IconBaseProps {
  form: Form;
}

const LIMB = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// Abstract, faceless trainer silhouettes that gain definition from Form I to Form IV.
// Everything is currentColor so the figure follows the surrounding text color / theme.
const SILHOUETTES: Record<Form, ReactNode> = {
  // I · Base: a soft rounded figure — head over a pill-shaped body.
  1: (
    <>
      <circle cx="12" cy="6.5" r="3.5" fill="currentColor" />
      <rect x="5.5" y="10.75" width="13" height="10.75" rx="5.5" fill="currentColor" />
    </>
  ),
  // II · Construcción: head plus a torso with shoulders and a waist.
  2: (
    <>
      <circle cx="12" cy="5.2" r="3" fill="currentColor" />
      <path
        d="M12 9.4c-3.4 0-5.6 1.4-5.6 3.4L7.4 21.5h9.2l1-8.7c0-2-2.2-3.4-5.6-3.4z"
        fill="currentColor"
      />
    </>
  ),
  // III · Integración: limbs appear.
  3: (
    <>
      <circle cx="12" cy="4.6" r="2.6" fill="currentColor" />
      <rect x="9.2" y="7.8" width="5.6" height="7.6" rx="2.2" fill="currentColor" />
      <path d="M9.6 9.6L5.6 14.4M14.4 9.6l4 4.8" {...LIMB} />
      <path d="M10.5 15l-2.5 6.5M13.5 15l2.5 6.5" {...LIMB} />
    </>
  ),
  // IV · Híbrido: athletic pose — neck, V-shaped torso, both arms flexed, feet planted wide.
  4: (
    <>
      <circle cx="12" cy="4" r="2.5" fill="currentColor" />
      <path d="M12 6.5v2" {...LIMB} />
      <path d="M8.2 8.4h7.6l-1.3 7.2H9.5z" fill="currentColor" />
      <path d="M8.6 9.2L4.8 8.6l.8-4.6" {...LIMB} />
      <path d="M15.4 9.2l3.8-.6-.8-4.6" {...LIMB} />
      <path d="M10.4 15.6l-1.6 6M13.6 15.6l1.6 6" {...LIMB} />
    </>
  ),
};

/** Trainer silhouette for Forms I–IV (SPEC §4.3): original, monochrome, no face. */
export function FormSilhouette({ form, ...base }: FormSilhouetteProps) {
  return <IconSvg {...base}>{SILHOUETTES[form]}</IconSvg>;
}
