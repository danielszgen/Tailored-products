import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CollapsibleProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
}

/** Native <details> collapsible: accessible, no JS, ≥ 44 px summary. */
export function Collapsible({
  title,
  eyebrow,
  defaultOpen,
  children,
  className,
}: CollapsibleProps) {
  return (
    <details className={cn('card group', className)} open={defaultOpen}>
      <summary className="list-none cursor-pointer select-none flex items-center justify-between gap-3 px-4 min-h-[52px] py-3">
        <span className="min-w-0">
          {eyebrow && <span className="eyebrow block mb-0.5">{eyebrow}</span>}
          <span className="display text-base text-ink">{title}</span>
        </span>
        <span aria-hidden className="text-ink3 transition-transform group-open:rotate-180">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-4 text-sm text-ink2">{children}</div>
    </details>
  );
}
