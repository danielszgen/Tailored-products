import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="card p-6 flex flex-col items-center text-center gap-2">
      {icon && <div className="text-ink3">{icon}</div>}
      <h3 className="display text-lg text-ink">{title}</h3>
      {description && <p className="text-sm text-ink2 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
