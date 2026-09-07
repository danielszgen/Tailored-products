import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  description?: string;
}

export interface SegmentedProps<T extends string | number> {
  label?: string;
  options: SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  columns?: number;
  size?: 'md' | 'lg';
  className?: string;
  /** Visual hint under the group, e.g. "1 destruidas · 5 frescas". */
  hint?: string;
}

/** Radio-style segmented control with ≥ 44 px targets. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
  size = 'md',
  className,
  hint,
}: SegmentedProps<T>) {
  return (
    <div className={cn('w-full', className)}>
      {label && <div className="eyebrow mb-1">{label}</div>}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              title={opt.description}
              onClick={() => onChange(opt.value)}
              className={cn(
                'rounded-list border font-bold select-none px-1',
                size === 'lg' ? 'min-h-[56px] text-lg' : 'min-h-touch text-base',
                selected
                  ? 'bg-ink text-bg border-ink'
                  : 'bg-surface text-ink2 border-line active:bg-surface2',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-ink3 mt-1">{hint}</p>}
    </div>
  );
}
