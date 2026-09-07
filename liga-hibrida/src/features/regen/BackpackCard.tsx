// Mochila: objects with their rule; creatina daily tick (SPEC §8.6, §6.8).
import { useState } from 'react';
import { Card, Eyebrow } from '@/components';
import { BACKPACK_ITEMS, NOT_NEEDED, RECOVERY_ORDER } from '@/domain/content/items';
import { todayISO } from '@/lib/date';
import { isCreatineTaken, setCreatineTaken } from './creatine';

export function BackpackCard() {
  const today = todayISO();
  const [taken, setTaken] = useState(() => isCreatineTaken(today));

  return (
    <Card eyebrow="Mochila" title="Objetos y su regla">
      <ul className="flex flex-col gap-2">
        {BACKPACK_ITEMS.map((item) => (
          <li key={item.id} className="list-item p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{item.name}</span>
              {item.daily && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={taken}
                  aria-label="Creatina hoy"
                  onClick={() => {
                    const next = !taken;
                    setTaken(next);
                    setCreatineTaken(today, next);
                  }}
                  className={`min-h-touch min-w-touch px-3 rounded-list border text-sm font-bold ${
                    taken
                      ? 'bg-status-ok text-[#141B2B] border-status-ok'
                      : 'bg-surface border-line text-ink2'
                  }`}
                >
                  {taken ? 'Hoy ✓' : 'Hoy'}
                </button>
              )}
            </div>
            <p className="text-xs text-ink2 mt-1">{item.rule}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink3 mt-3">No necesitamos: {NOT_NEEDED.join(', ')}.</p>
      <Eyebrow className="block mt-4 mb-1">Orden de importancia</Eyebrow>
      <p className="text-sm text-ink2">{RECOVERY_ORDER.join(' → ')}</p>
    </Card>
  );
}
