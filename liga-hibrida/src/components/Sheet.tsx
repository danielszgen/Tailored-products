import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Bottom sheet (one-hand reach). Closes on backdrop tap or Escape. */
export function Sheet({ open, onClose, title, children, footer, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-md max-h-[90dvh] flex flex-col bg-surface rounded-t-phone border-t border-line shadow-2xl safe-bottom',
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="w-10 h-1 rounded-pill bg-line absolute left-1/2 -translate-x-1/2 top-2" />
          {title && <h2 className="display text-lg text-ink mt-2">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto min-w-touch min-h-touch flex items-center justify-center text-ink2 mt-2"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="px-4 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-4 pb-4 pt-2 border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}
