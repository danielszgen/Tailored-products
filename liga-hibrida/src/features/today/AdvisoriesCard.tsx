// Active warnings sorted by the Constitution level they protect (SPEC §7 intro, §8.2).
// Sticky advisories (R8) must be read: they stay highlighted until "Leído".
import { useState } from 'react';
import { Button, Card, Eyebrow, Pill } from '@/components';
import { hierarchyName } from '@/domain/content/constitution';
import type { Advisory, ISODate } from '@/domain/types';
import { acknowledge, isAcknowledged } from './acks';

export function AdvisoriesCard({ advisories, today }: { advisories: Advisory[]; today: ISODate }) {
  const [, bump] = useState(0);
  if (advisories.length === 0) return null;
  const sorted = [...advisories].sort((a, b) => a.level - b.level);
  return (
    <Card
      eyebrow="Avisos activos"
      title={`${sorted.length} aviso${sorted.length === 1 ? '' : 's'}`}
    >
      <ul className="flex flex-col gap-3">
        {sorted.map((a, i) => {
          const pending = !!a.sticky && !!a.id && !isAcknowledged(a.id);
          return (
            <li
              key={a.id ?? `${a.source}-${i}`}
              className={`flex flex-col gap-1 ${pending ? 'rounded-list border border-status-ko p-3' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Pill tone={a.level === 1 ? 'ko' : a.level === 2 ? 'cargado' : 'neutral'}>
                  Nivel {a.level} · {hierarchyName(a.level)}
                </Pill>
              </div>
              <p className="text-sm text-ink">{a.message}</p>
              <Eyebrow>Fuente {a.source}</Eyebrow>
              {pending && (
                <Button
                  variant="danger"
                  onClick={() => {
                    acknowledge(a.id!, today);
                    bump((n) => n + 1);
                  }}
                >
                  Leído
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
