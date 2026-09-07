// Combustible (R6): day type, pre/post of the main gym, intra guide and the 5-tick checklist.
import { useEffect, useState } from 'react';
import { Card, Eyebrow } from '@/components';
import { GYM_NAMES } from '@/domain/content/gyms';
import { DAILY_CHECKLIST, type ChecklistId } from '@/domain/content/nutrition';
import { readChecklist, writeChecklist, type ChecklistState } from './checklist';
import type { TodayModel } from './useToday';

export function FuelCard({ model }: { model: TodayModel }) {
  const { today, fuel } = model;
  const [ticks, setTicks] = useState<ChecklistState>(() => readChecklist(today));

  useEffect(() => {
    setTicks(readChecklist(today));
  }, [today]);

  const toggle = (id: ChecklistId) => {
    const next = { ...ticks, [id]: !ticks[id] };
    setTicks(next);
    writeChecklist(today, next);
  };

  const done = DAILY_CHECKLIST.filter((c) => ticks[c.id]).length;

  return (
    <Card
      eyebrow="Combustible · R6"
      title={fuel ? fuel.label : '—'}
      right={
        <span className="font-pixel text-[11px] tracking-[1px] text-ink3">
          {done}/{DAILY_CHECKLIST.length}
        </span>
      }
    >
      {fuel?.dayType && (
        <div className="mb-3">
          <p className="text-sm text-ink2">Tipo de día: {fuel.dayType.dayType}</p>
          <p className="text-xs text-ink3">
            Desayuno {fuel.dayType.breakfast} · Comida {fuel.dayType.lunch} · Merienda pre{' '}
            {fuel.dayType.preSnack} · Cena/post {fuel.dayType.dinnerPost}
          </p>
        </div>
      )}
      {fuel?.gymId && (
        <div className="flex flex-col gap-2 mb-3">
          <div>
            <Eyebrow className="block mb-0.5">Pre · {GYM_NAMES[fuel.gymId]}</Eyebrow>
            <p className="text-sm text-ink2">{fuel.pre}</p>
          </div>
          <div>
            <Eyebrow className="block mb-0.5">Post</Eyebrow>
            <p className="text-sm text-ink2">{fuel.post}</p>
          </div>
        </div>
      )}
      {fuel?.intra && (
        <div className="mb-3">
          <Eyebrow className="block mb-0.5">Intra · por duración</Eyebrow>
          <p className="text-sm text-ink2">{fuel.intra}</p>
        </div>
      )}
      {fuel && fuel.notes.length > 0 && (
        <ul className="text-xs text-ink3 mb-3 flex flex-col gap-0.5">
          {fuel.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-1 gap-1.5" aria-label="Checklist diario">
        {DAILY_CHECKLIST.map((item) => {
          const checked = !!ticks[item.id];
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(item.id)}
                className={`w-full min-h-touch flex items-center gap-3 rounded-list border px-3 text-left text-sm ${
                  checked
                    ? 'bg-status-ok/15 border-status-ok text-ink'
                    : 'bg-surface border-line text-ink2'
                }`}
              >
                <span
                  aria-hidden
                  className={`w-5 h-5 rounded-pill border flex items-center justify-center ${
                    checked ? 'bg-status-ok border-status-ok text-[#141B2B]' : 'border-line'
                  }`}
                >
                  {checked ? '✓' : ''}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
