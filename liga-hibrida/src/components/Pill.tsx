import type { ReactNode } from 'react';
import type { StatKey, Status } from '@/domain/types';
import { cn } from '@/lib/cn';

export type PillTone = Status | StatKey | 'regen' | 'neutral' | 'accent' | 'gold';

const STATUS_LABEL: Record<Status, string> = { ok: 'OK', cargado: 'CARGADO', ko: 'KO' };

// Status pills: solid status color + dark ink (≥ 4.5:1 on all three).
// Type pills: tinted background + ink text + a solid color dot, legible in both themes.
const tones: Record<PillTone, string> = {
  ok: 'bg-status-ok text-[#141B2B]',
  cargado: 'bg-status-cargado text-[#141B2B]',
  ko: 'bg-status-ko text-[#141B2B]',
  masa: 'bg-type-masa/20 text-ink',
  fuerza: 'bg-type-fuerza/20 text-ink',
  motor: 'bg-type-motor/20 text-ink',
  control: 'bg-type-control/20 text-ink',
  aventura: 'bg-type-aventura/20 text-ink',
  regen: 'bg-type-regen/20 text-ink',
  neutral: 'bg-surface2 text-ink2',
  accent: 'bg-accent text-white',
  gold: 'bg-gold text-[#141B2B]',
};

const dots: Partial<Record<PillTone, string>> = {
  masa: 'bg-type-masa',
  fuerza: 'bg-type-fuerza',
  motor: 'bg-type-motor',
  control: 'bg-type-control',
  aventura: 'bg-type-aventura',
  regen: 'bg-type-regen',
};

export interface PillProps {
  tone?: PillTone;
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Pill({ tone = 'neutral', children, className, size = 'sm' }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-pixel uppercase tracking-[1px] whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-[11px] px-2.5 py-1.5',
        tones[tone],
        className,
      )}
    >
      {dots[tone] && <span aria-hidden className={cn('w-1.5 h-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

/** Convenience: status pill with the canonical OK / CARGADO / KO label. */
export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <Pill tone={status} size="md" className={className}>
      {STATUS_LABEL[status]}
    </Pill>
  );
}

export const STATUS_LABELS = STATUS_LABEL;
