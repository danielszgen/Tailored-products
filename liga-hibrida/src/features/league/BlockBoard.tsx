// 12-week board with waves, deloads, Combates de Liga, earned medals and the current week (SPEC §8.5).
import { Card, Eyebrow, Pill } from '@/components';
import { MedalIcon } from '@/brand/icons';
import { BLOCK_END, blockWeeks } from '@/domain/content/block';
import type { MedalProgress } from '@/domain/rules/league';
import type { ISODate, LeagueTest } from '@/domain/types';
import { formatShort, weekOfBlock } from '@/lib/date';

export function BlockBoard({
  blockStart,
  currentWeek,
  tests = [],
  medals = [],
}: {
  blockStart: ISODate;
  currentWeek: number | null;
  tests?: LeagueTest[];
  medals?: MedalProgress[];
}) {
  const weeks = blockWeeks(blockStart);
  const testDone = new Set(tests.map((t) => t.weekOfBlock));
  const earnedIn = (week: number) =>
    medals.filter((m) => m.earnedOn && weekOfBlock(m.earnedOn, blockStart) === week);
  return (
    <Card
      eyebrow="Bloque 1"
      title="La Liga · 12 semanas"
      right={<Eyebrow>Final · {formatShort(BLOCK_END)}</Eyebrow>}
    >
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Semanas del bloque">
        {weeks.map((w) => {
          const current = w.weekOfBlock === currentWeek;
          const earned = earnedIn(w.weekOfBlock);
          const done = testDone.has(w.weekOfBlock as 4 | 8 | 12);
          return (
            <li
              key={w.weekOfBlock}
              aria-current={current ? 'true' : undefined}
              className={`relative rounded-list border p-2 min-h-[64px] flex flex-col justify-between ${
                current
                  ? 'border-accent bg-accent text-on-accent'
                  : w.isDeload
                    ? 'border-line bg-surface2'
                    : 'border-line bg-surface'
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-pixel text-[10px] tracking-[1px]">S{w.weekOfBlock}</span>
                {earned.length > 0 && (
                  <span className="flex gap-0.5">
                    {earned.map((m) => (
                      <MedalIcon
                        key={m.id}
                        gym={m.id}
                        state="earned"
                        size={14}
                        title={`Medalla ${m.name} conseguida`}
                      />
                    ))}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] leading-tight ${current ? 'text-on-accent' : 'text-ink2'}`}
              >
                {w.label}
              </span>
              <span
                className={`text-[10px] ${current ? 'text-on-accent opacity-80' : 'text-ink3'}`}
              >
                {w.isTest ? (done ? 'Test ✓' : 'Test') : formatShort(w.start)}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2 mt-3">
        <Pill tone="neutral">S4 · S8 descarga</Pill>
        <Pill tone="gold">S4 · S8 · S12 Combate de Liga</Pill>
        {testDone.has(0) && <Pill tone="ok">Baseline S0 ✓</Pill>}
      </div>
    </Card>
  );
}
