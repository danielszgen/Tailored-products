// Combustible: day fuel type, pre/post of the main gym and the 5-tick checklist (SPEC §8.2).
import { useEffect, useState } from 'react';
import { Card, Eyebrow } from '@/components';
import { GYMS } from '@/domain/content/gyms';
import { DAY_FUEL_LABELS } from '@/domain/content/week';
import { DAILY_CHECKLIST, fuelDayTypeFor, type ChecklistId } from '@/domain/content/nutrition';
import type { GymId, PlannedDay } from '@/domain/types';
import { readChecklist, writeChecklist, type ChecklistState } from './checklist';
import type { TodayModel } from './useToday';

function mainGym(day: PlannedDay | null): GymId | null {
  if (!day) return null;
  if (day.am?.kind === 'gym') return day.am.gymId;
  if (day.pm?.kind === 'gym') return day.pm.gymId;
  return null;
}

export function FuelCard({ model }: { model: TodayModel }) {
  const { today, day } = model;
  const [ticks, setTicks] = useState<ChecklistState>(() => readChecklist(today));

  useEffect(() => {
    setTicks(readChecklist(today));
  }, [today]);

  const toggle = (id: ChecklistId) => {
    const next = { ...ticks, [id]: !ticks[id] };
    setTicks(next);
    writeChecklist(today, next);
  };

  const gymId = mainGym(day);
  const gym = gymId ? GYMS[gymId] : null;
  const fuel = day?.fuel;
  const dayType = fuel ? fuelDayTypeFor(fuel) : undefined;
  const done = DAILY_CHECKLIST.filter((c) => ticks[c.id]).length;

  return (
    <Card
      eyebrow="Combustible"
      title={fuel ? DAY_FUEL_LABELS[fuel] : '—'}
      right={
        <span className="font-pixel text-[11px] tracking-[1px] text-ink3">
          {done}/{DAILY_CHECKLIST.length}
        </span>
      }
    >
      {dayType && <p className="text-sm text-ink2 mb-3">Tipo de día: {dayType.dayType}</p>}
      {gym && (
        <div className="flex flex-col gap-2 mb-3">
          <div>
            <Eyebrow className="block mb-0.5">Pre · {gym.name}</Eyebrow>
            <p className="text-sm text-ink2">{gym.fuelPre}</p>
          </div>
          <div>
            <Eyebrow className="block mb-0.5">Post</Eyebrow>
            <p className="text-sm text-ink2">{gym.fuelPost}</p>
          </div>
        </div>
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
