// 12-week board with waves, deloads, tests and the current week (SPEC §8.5).
import { Card, Eyebrow, Pill } from '@/components';
import { BLOCK_END, blockWeeks } from '@/domain/content/block';
import type { ISODate } from '@/domain/types';
import { formatShort } from '@/lib/date';

export function BlockBoard({
  blockStart,
  currentWeek,
}: {
  blockStart: ISODate;
  currentWeek: number | null;
}) {
  const weeks = blockWeeks(blockStart);
  return (
    <Card
      eyebrow="Bloque 1"
      title="La Liga · 12 semanas"
      right={<Eyebrow>Final · {formatShort(BLOCK_END)}</Eyebrow>}
    >
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Semanas del bloque">
        {weeks.map((w) => {
          const current = w.weekOfBlock === currentWeek;
          return (
            <li
              key={w.weekOfBlock}
              aria-current={current ? 'true' : undefined}
              className={`rounded-list border p-2 min-h-[64px] flex flex-col justify-between ${
                current
                  ? 'border-accent bg-accent text-on-accent'
                  : w.isDeload
                    ? 'border-line bg-surface2'
                    : 'border-line bg-surface'
              }`}
            >
              <span className="font-pixel text-[10px] tracking-[1px]">S{w.weekOfBlock}</span>
              <span
                className={`text-[11px] leading-tight ${current ? 'text-on-accent' : 'text-ink2'}`}
              >
                {w.label}
              </span>
              <span
                className={`text-[10px] ${current ? 'text-on-accent opacity-80' : 'text-ink3'}`}
              >
                {formatShort(w.start)}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex gap-2 mt-3">
        <Pill tone="neutral">S4 · S8 descarga</Pill>
        <Pill tone="gold">S4 · S8 · S12 Combate de Liga</Pill>
      </div>
    </Card>
  );
}
