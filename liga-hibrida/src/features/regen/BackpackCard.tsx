// Mochila: objects with their rule; creatina daily tick (SPEC §8.6, §6.8).
import { Card, Eyebrow } from '@/components';
import { ObjectIcon } from '@/brand/art';
import { setCreatineTaken, useDayLog } from '@/data';
import { BACKPACK_ITEMS, NOT_NEEDED, RECOVERY_ORDER } from '@/domain/content/items';
import { todayISO } from '@/lib/date';

export function BackpackCard() {
  const today = todayISO();
  // Stored in Dexie so the streak travels in the export (schema v2).
  const taken = useDayLog(today)?.creatine ?? false;

  return (
    <Card eyebrow="Mochila" title="Objetos y su regla">
      <ul className="flex flex-col gap-2">
        {BACKPACK_ITEMS.map((item) => (
          <li key={item.id} className="list-item p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <ObjectIcon itemId={item.id} scale={2} className="shrink-0" />
                <span className="text-sm font-bold text-ink">{item.name}</span>
              </span>
              {item.daily && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={taken}
                  aria-label="Creatina hoy"
                  onClick={() => void setCreatineTaken(today, !taken)}
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
