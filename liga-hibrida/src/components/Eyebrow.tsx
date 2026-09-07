import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Pixel-font label (Silkscreen, 10 px, 1 px tracking) — SPEC §4.2. */
export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('eyebrow', className)} {...rest} />;
}
