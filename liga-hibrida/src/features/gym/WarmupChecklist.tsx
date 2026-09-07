// Mandatory warm-up checklist: main work stays locked until every item is checked (SPEC §8.3).
import { useState } from 'react';
import { Button, Card, Eyebrow } from '@/components';
import type { GymSpec, WarmupItem } from '@/domain/types';

export interface WarmupChecklistProps {
  gym: GymSpec;
  omitTags: string[];
  done: boolean;
  onComplete: () => void;
}

export function WarmupChecklist({ gym, omitTags, done, onComplete }: WarmupChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const visible = gym.warmup.filter((w) => !w.tags?.some((t) => omitTags.includes(t)));
  const omitted = gym.warmup.filter((w) => w.tags?.some((t) => omitTags.includes(t)));
  const allChecked = visible.every((w) => checked[w.id]);

  if (done) {
    return (
      <Card eyebrow="Calentamiento" title="Hecho ✓">
        <p className="text-sm text-ink3">{gym.warmupTitle}</p>
      </Card>
    );
  }

  const toggle = (item: WarmupItem) => setChecked((c) => ({ ...c, [item.id]: !c[item.id] }));

  return (
    <Card eyebrow="Calentamiento obligatorio" title={gym.warmupTitle}>
      <ul className="flex flex-col gap-1.5">
        {visible.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(item)}
                className={`w-full min-h-[52px] flex items-start gap-3 rounded-list border px-3 py-2 text-left ${
                  isChecked ? 'bg-status-ok/15 border-status-ok' : 'bg-surface border-line'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-pill border flex items-center justify-center text-xs ${
                    isChecked ? 'bg-status-ok border-status-ok text-[#141B2B]' : 'border-line'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink font-bold">{item.name}</span>
                  <span className="block text-xs text-ink2">
                    {item.dose} · {item.cue}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {omitted.length > 0 && (
        <p className="text-xs text-status-ko mt-3">
          Omitido hoy por estado: {omitted.map((w) => w.name).join(', ')}.
        </p>
      )}
      <div className="flex flex-col gap-2 mt-4">
        <Button full disabled={!allChecked} onClick={onComplete}>
          Calentamiento completo
        </Button>
        <Button variant="ghost" onClick={onComplete}>
          Ya lo he hecho fuera
        </Button>
        <Eyebrow>El trabajo principal se desbloquea al terminar</Eyebrow>
      </div>
    </Card>
  );
}
