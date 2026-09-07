import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  padded?: boolean;
}

/** First-level surface: 14 px radius, 1 px line border (SPEC §4.2). */
export function Card({
  eyebrow,
  title,
  right,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section className={cn('card', padded && 'p-4', className)} {...rest}>
      {(eyebrow || title || right) && (
        <header className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
            {title && <h2 className="display text-lg leading-tight text-ink">{title}</h2>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
