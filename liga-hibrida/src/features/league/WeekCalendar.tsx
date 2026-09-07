// Read-only weekly calendar with prev/next inside the block (SPEC §9 Etapa I).
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Eyebrow, Pill } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { GymIcon } from '@/brand/icons';
import { getWeek } from '@/data';
import { BLOCK_WEEKS, waveLabel } from '@/domain/content/block';
import {
  BASE_WEEK_TABLE,
  buildWeekPlan,
  DAY_FUEL_LABELS,
  PRIORITIES,
  plannedItemLabel,
  WEEK_BUDGET,
} from '@/domain/content/week';
import type { DayIndex, ISODate, PlannedItem, WeekTemplate } from '@/domain/types';
import { addDaysISO, DAY_NAMES_ES, formatShort, todayISO, weekDates } from '@/lib/date';
import { clamp } from '@/lib/math';

const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

function Item({ item }: { item: PlannedItem | undefined }) {
  if (!item) return <span className="text-ink3">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      {item.kind === 'gym' && <GymIcon gym={item.gymId} size={16} />}
      <span>{plannedItemLabel(item)}</span>
    </span>
  );
}

export function WeekCalendar({
  blockStart,
  currentWeek,
  template,
}: {
  blockStart: ISODate;
  currentWeek: number | null;
  template: WeekTemplate;
}) {
  const [selected, setSelected] = useState<number>(clamp(currentWeek ?? 1, 1, BLOCK_WEEKS));
  const weekStart = addDaysISO(blockStart, (selected - 1) * 7);
  const stored = useLiveQuery(() => getWeek(weekStart), [weekStart]);
  const plan = stored ?? buildWeekPlan({ weekStart, weekOfBlock: selected, template });
  const dates = weekDates(weekStart);
  const today = todayISO();

  return (
    <Card
      eyebrow={`Semana ${selected}/${BLOCK_WEEKS} · ${waveLabel(plan.wave)}`}
      title="Calendario semanal"
      right={
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Semana anterior"
            className="min-w-touch min-h-touch rounded-list bg-surface2 text-ink disabled:opacity-30"
            disabled={selected <= 1}
            onClick={() => setSelected((s) => s - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Semana siguiente"
            className="min-w-touch min-h-touch rounded-list bg-surface2 text-ink disabled:opacity-30"
            disabled={selected >= BLOCK_WEEKS}
            onClick={() => setSelected((s) => s + 1)}
          >
            ›
          </button>
        </div>
      }
    >
      <ol className="flex flex-col gap-1.5">
        {DAYS.map((d) => {
          const day = plan.days[d];
          const isToday = dates[d] === today;
          return (
            <li
              key={d}
              className={`list-item p-3 text-sm ${isToday ? 'border-accent' : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-ink">
                  {DAY_NAMES_ES[d]}{' '}
                  <span className="text-ink3 font-normal">{formatShort(dates[d])}</span>
                </span>
                <Pill tone="neutral">{DAY_FUEL_LABELS[day.fuel]}</Pill>
              </div>
              <div className="grid grid-cols-[28px_1fr] gap-x-2 gap-y-0.5 text-ink2">
                <Eyebrow>AM</Eyebrow>
                <Item item={day.am} />
                <Eyebrow>PM</Eyebrow>
                <Item item={day.pm} />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink3 mt-3">
        Solo lectura · la edición llega con el Consejo de la Liga (Etapa II).
        {!stored && ' Semana generada desde la plantilla.'}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Collapsible title="Semana base (documento 04)">
          <ul className="flex flex-col gap-2">
            {BASE_WEEK_TABLE.map((row) => (
              <li key={row.day}>
                <span className="font-bold text-ink">{row.dayName}</span> · AM {row.am} · PM{' '}
                {row.pm} · <span className="font-pixel text-[10px] tracking-[1px]">{row.fuel}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">{WEEK_BUDGET.join(' ')}</p>
          <p className="mt-2">
            {PRIORITIES.A} {PRIORITIES.B} {PRIORITIES.C}
          </p>
        </Collapsible>
      </div>
    </Card>
  );
}
