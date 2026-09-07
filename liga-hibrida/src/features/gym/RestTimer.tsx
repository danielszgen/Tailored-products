// Sticky rest countdown above the tab bar (SPEC §8.3).
import { Button } from '@/components';
import { formatRest } from '@/domain/content/gyms';
import { formatCountdown } from './useRestTimer';

export interface RestTimerProps {
  running: boolean;
  remaining: number;
  range: [number, number] | null;
  onAdd: (seconds: number) => void;
  onSkip: () => void;
}

export function RestTimer({ running, remaining, range, onAdd, onSkip }: RestTimerProps) {
  if (!running) return null;
  return (
    <div
      role="timer"
      aria-live="polite"
      className="fixed left-0 right-0 z-40 px-4"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-md mx-auto card bg-surface shadow-2xl p-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Descanso {range ? formatRest(range) : ''}</div>
          <div className="display text-3xl leading-none text-ink">{formatCountdown(remaining)}</div>
        </div>
        <Button variant="secondary" onClick={() => onAdd(15)}>
          +15 s
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Saltar
        </Button>
      </div>
    </div>
  );
}
