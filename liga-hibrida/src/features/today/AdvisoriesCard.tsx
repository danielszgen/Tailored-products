// Active warnings sorted by the Constitution level they protect (SPEC §7 intro, §8.2).
import { Card, Eyebrow, Pill } from '@/components';
import { hierarchyName } from '@/domain/content/constitution';
import type { Advisory } from '@/domain/types';

export function AdvisoriesCard({ advisories }: { advisories: Advisory[] }) {
  if (advisories.length === 0) return null;
  const sorted = [...advisories].sort((a, b) => a.level - b.level);
  return (
    <Card
      eyebrow="Avisos activos"
      title={`${sorted.length} aviso${sorted.length === 1 ? '' : 's'}`}
    >
      <ul className="flex flex-col gap-3">
        {sorted.map((a, i) => (
          <li key={`${a.source}-${i}`} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Pill tone={a.level === 1 ? 'ko' : a.level === 2 ? 'cargado' : 'neutral'}>
                Nivel {a.level} · {hierarchyName(a.level)}
              </Pill>
            </div>
            <p className="text-sm text-ink">{a.message}</p>
            <Eyebrow>Fuente {a.source}</Eyebrow>
          </li>
        ))}
      </ul>
    </Card>
  );
}
