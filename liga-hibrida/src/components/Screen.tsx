import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface ScreenProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  right?: ReactNode;
  /** Show a back button; string = explicit route, true = history back. */
  back?: boolean | string;
  children?: ReactNode;
  className?: string;
}

/** Page frame: sticky header (safe-area top) + content column, max 28 rem for one-hand use. */
export function Screen({ title, eyebrow, right, back, children, className }: ScreenProps) {
  const navigate = useNavigate();
  return (
    <div className={cn('max-w-md mx-auto', className)}>
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur safe-top">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          {back && (
            <button
              type="button"
              aria-label="Volver"
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="min-w-touch min-h-touch -ml-2 flex items-center justify-center text-ink2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1 className="display text-2xl leading-tight text-ink truncate">{title}</h1>
          </div>
          {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
        </div>
      </header>
      <div className="px-4 pb-6 flex flex-col gap-4">{children}</div>
    </div>
  );
}
