// Four gym medals with R10 progress, the literal condition and an animation when one is earned
// (SPEC §6.10, §8.5, §9 Etapa III "medallas con animación").
import { useEffect, useState } from 'react';
import { Card, Eyebrow, Meter, Pill } from '@/components';
import { MedalIcon } from '@/brand/icons';
import type { MedalProgress } from '@/domain/rules/league';
import type { GymId } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { markMedalsSeen, seenMedals } from './medalsSeen';

const TONE: Record<GymId, 'fuerza' | 'masa' | 'aventura' | 'control'> = {
  cantera: 'fuerza',
  yunque: 'masa',
  resorte: 'aventura',
  vertigo: 'control',
};

function stateOf(m: MedalProgress): 'locked' | 'progress' | 'earned' {
  if (m.earned) return 'earned';
  return m.progress > 0 ? 'progress' : 'locked';
}

export function MedalsCard({ medals }: { medals: MedalProgress[] | null }) {
  // Earned medals not yet celebrated on this device pop once; they are then remembered as seen
  // (HOY may have persisted the medal earlier, so `isNew` alone is not enough).
  const [celebrated, setCelebrated] = useState<GymId[]>([]);
  useEffect(() => {
    const seen = seenMedals();
    const fresh = (medals ?? []).filter(
      (m) => m.earned && !seen.includes(m.id) && !celebrated.includes(m.id),
    );
    if (fresh.length > 0) {
      const ids = fresh.map((m) => m.id);
      setCelebrated((c) => [...c, ...ids]);
      markMedalsSeen(ids);
    }
  }, [medals, celebrated]);

  return (
    <Card eyebrow="Medallas del Bloque 1" title="Cuatro gimnasios">
      {!medals ? (
        <p className="text-sm text-ink3">Calculando…</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Medallas">
          {medals.map((m) => {
            const state = stateOf(m);
            const pop = celebrated.includes(m.id);
            return (
              <li key={m.id} className="flex gap-3" data-testid={`medal-${m.id}`}>
                <span className={pop ? 'medal-pop shrink-0' : 'shrink-0'}>
                  <MedalIcon
                    gym={m.id}
                    state={state}
                    size={44}
                    title={`Medalla ${m.name} ${state === 'earned' ? 'conseguida' : state === 'progress' ? 'en progreso' : 'bloqueada'}`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">{m.name}</span>
                    {m.earned ? (
                      <Pill tone="gold">{pop ? '¡Nueva medalla!' : 'Conseguida'}</Pill>
                    ) : (
                      <Eyebrow>{Math.round(m.progress * 100)} %</Eyebrow>
                    )}
                  </div>
                  <p className="text-xs text-ink2">{m.condition}</p>
                  <Meter
                    value={m.progress * 100}
                    tone={m.earned ? 'gold' : TONE[m.id]}
                    height={6}
                    className="mt-1"
                    showValue={false}
                    label={undefined}
                  />
                  <p className="text-xs text-ink3 mt-1">
                    {m.earned && m.earnedOn ? `Conseguida el ${formatShort(m.earnedOn)}. ` : ''}
                    {m.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
