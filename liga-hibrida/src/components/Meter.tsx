import type { StatKey, Status } from '@/domain/types';
import { cn } from '@/lib/cn';
import { clamp } from '@/lib/math';

export type MeterTone = Status | StatKey | 'regen' | 'accent' | 'gold';

const fills: Record<MeterTone, string> = {
  ok: 'bg-status-ok',
  cargado: 'bg-status-cargado',
  ko: 'bg-status-ko',
  masa: 'bg-type-masa',
  fuerza: 'bg-type-fuerza',
  motor: 'bg-type-motor',
  control: 'bg-type-control',
  aventura: 'bg-type-aventura',
  regen: 'bg-type-regen',
  accent: 'bg-accent',
  gold: 'bg-gold',
};

export interface MeterProps {
  value: number;
  max?: number;
  tone?: MeterTone;
  label?: string;
  showValue?: boolean;
  height?: number;
  className?: string;
}

/** Horizontal bar (PV, medal progress, weekly minutes). */
export function Meter({
  value,
  max = 100,
  tone = 'accent',
  label,
  showValue = true,
  height = 10,
  className,
}: MeterProps) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between mb-1">
          {label && <span className="eyebrow">{label}</span>}
          {showValue && (
            <span className="font-pixel text-[11px] tracking-[1px] text-ink">
              {Math.round(value)}
              {max !== 100 && <span className="text-ink3">/{max}</span>}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        className="w-full rounded-pill bg-surface2 overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn('h-full rounded-pill transition-[width] duration-300', fills[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
