import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent active:opacity-90 disabled:opacity-40',
  secondary: 'bg-surface2 text-ink border border-line active:bg-line disabled:opacity-40',
  ghost: 'bg-transparent text-ink2 active:bg-surface2 disabled:opacity-40',
  danger:
    'bg-transparent text-status-ko border border-status-ko active:bg-status-ko/10 disabled:opacity-40',
};

const sizes: Record<Size, string> = {
  md: 'min-h-touch px-4 text-base',
  lg: 'min-h-[56px] px-5 text-lg',
};

/** Touch-first button: ≥ 44 px, bold body font, no hover states (mobile). */
export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-list font-bold select-none transition-opacity',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
