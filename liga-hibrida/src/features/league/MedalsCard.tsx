// Four gym medals with state and the literal condition (SPEC §6.10, §8.5).
import { Card, Meter } from '@/components';
import { MedalIcon } from '@/brand/icons';
import { useMedals } from '@/data';
import { MEDALS } from '@/domain/content/tests';
import type { Medal } from '@/domain/types';

function stateOf(m: Medal | undefined): 'locked' | 'progress' | 'earned' {
  if (!m) return 'locked';
  if (m.earnedOn) return 'earned';
  return m.progress > 0 ? 'progress' : 'locked';
}

export function MedalsCard() {
  const medals = useMedals();
  return (
    <Card eyebrow="Medallas del Bloque 1" title="Cuatro gimnasios">
      <ul className="flex flex-col gap-3">
        {MEDALS.map((spec) => {
          const m = medals?.find((x) => x.id === spec.id);
          const state = stateOf(m);
          return (
            <li key={spec.id} className="flex gap-3">
              <MedalIcon
                gym={spec.id}
                state={state}
                size={44}
                title={`Medalla ${spec.name} ${state === 'earned' ? 'conseguida' : state === 'progress' ? 'en progreso' : 'bloqueada'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink">{spec.name}</div>
                <p className="text-xs text-ink2">{spec.condition}</p>
                <Meter
                  value={(m?.progress ?? 0) * 100}
                  tone={
                    spec.id === 'cantera'
                      ? 'fuerza'
                      : spec.id === 'yunque'
                        ? 'masa'
                        : spec.id === 'resorte'
                          ? 'aventura'
                          : 'control'
                  }
                  height={6}
                  className="mt-1"
                  showValue={false}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink3 mt-3">El progreso se calcula en la Etapa III.</p>
    </Card>
  );
}
