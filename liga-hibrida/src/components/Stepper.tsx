import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { clamp, decimalsOf, roundTo } from '@/lib/math';

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  hint?: string;
  size?: 'md' | 'lg';
  inputMode?: 'decimal' | 'numeric';
  className?: string;
  /** Optional second step for a "big" increment (e.g. ±5 kg). */
  bigStep?: number;
}

/**
 * One-hand numeric control: big − / + buttons (≥ 44 px) around a decimal input
 * (inputmode="decimal", ≥ 16 px so iOS does not zoom).
 */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  unit,
  decimals = decimalsOf(step),
  hint,
  size = 'md',
  inputMode = 'decimal',
  className,
  bigStep,
}: StepperProps) {
  const id = useId();
  const [text, setText] = useState(format(value, decimals));

  useEffect(() => {
    setText(format(value, decimals));
  }, [value, decimals]);

  const commit = (raw: string) => {
    const parsed = Number(raw.replace(',', '.'));
    if (Number.isFinite(parsed)) onChange(roundTo(clamp(parsed, min, max), decimals));
    else setText(format(value, decimals));
  };

  const nudge = (delta: number) => onChange(roundTo(clamp(value + delta, min, max), decimals));

  const btn = cn(
    'flex items-center justify-center rounded-list bg-surface2 text-ink font-display select-none active:bg-line disabled:opacity-30',
    size === 'lg' ? 'min-w-[56px] min-h-[56px] text-2xl' : 'min-w-touch min-h-touch text-xl',
  );

  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={id} className="eyebrow block mb-1">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        {bigStep && (
          <button
            type="button"
            className={btn}
            aria-label={`Restar ${bigStep} a ${label}`}
            onClick={() => nudge(-bigStep)}
            disabled={value <= min}
          >
            −{bigStep}
          </button>
        )}
        <button
          type="button"
          className={btn}
          aria-label={`Restar ${step} a ${label}`}
          onClick={() => nudge(-step)}
          disabled={value <= min}
        >
          −
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 rounded-list bg-surface border border-line px-2">
          <input
            id={id}
            className={cn(
              'w-full bg-transparent text-center font-display text-ink outline-none',
              size === 'lg' ? 'text-3xl' : 'text-2xl',
            )}
            inputMode={inputMode}
            pattern="[0-9]*[.,]?[0-9]*"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-describedby={hint ? `${id}-hint` : undefined}
          />
          {unit && <span className="eyebrow shrink-0">{unit}</span>}
        </div>
        <button
          type="button"
          className={btn}
          aria-label={`Sumar ${step} a ${label}`}
          onClick={() => nudge(step)}
          disabled={value >= max}
        >
          +
        </button>
        {bigStep && (
          <button
            type="button"
            className={btn}
            aria-label={`Sumar ${bigStep} a ${label}`}
            onClick={() => nudge(bigStep)}
            disabled={value >= max}
          >
            +{bigStep}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-ink3 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

function format(value: number, decimals: number): string {
  return Number.isFinite(value) ? value.toFixed(decimals).replace('.', ',') : '';
}
