// Weekly aerobic counter (SPEC §8.4): Z2 minutes vs the wave target, longest route, next route.
import { Card, Eyebrow, Meter, Pill } from '@/components';
import { aerobicRowForWave, waveLabel } from '@/domain/content/block';
import { fuelIntraByMinutes } from '@/domain/content/nutrition';
import { plannedItemLabel } from '@/domain/content/week';
import type { RouteLog, Wave, WeekPlan, WildLog } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { nextPlannedRoute, z2TargetFor } from './weekly';

export function WeeklyCard({
  wave,
  routes,
  wild,
  plan,
  nextPlan,
  today,
}: {
  wave: Wave | null;
  routes: RouteLog[];
  wild: WildLog[];
  plan: WeekPlan | null;
  nextPlan: WeekPlan | null;
  today: string;
}) {
  const z2 = routes.filter((r) => r.countsAs === 'z2');
  const minutes = z2.reduce((sum, r) => sum + r.minutes, 0);
  const longest = routes.reduce((m, r) => Math.max(m, r.minutes), 0);
  const target = z2TargetFor(wave);
  const row = aerobicRowForWave(wave ?? 1);
  const next = nextPlannedRoute(plan, nextPlan, today, routes);
  const tone = minutes >= target[0] ? 'ok' : minutes > 0 ? 'cargado' : 'accent';

  return (
    <Card
      eyebrow={`Esta semana · ${wave ? waveLabel(wave) : 'fuera del bloque'}`}
      title={`${minutes}' Z2`}
      right={
        <Pill tone="neutral">
          objetivo {target[0]}–{target[1]}'
        </Pill>
      }
    >
      <Meter value={minutes} max={target[1]} tone={tone} label="Minutos Z2" height={8} />
      <div className="grid grid-cols-3 gap-2 text-center mt-3">
        <div>
          <div className="display text-xl">{z2.length}</div>
          <Eyebrow>rutas Z2</Eyebrow>
        </div>
        <div>
          <div className="display text-xl">{longest || '—'}</div>
          <Eyebrow>ruta más larga (min)</Eyebrow>
        </div>
        <div>
          <div className="display text-xl">{wild.length}</div>
          <Eyebrow>aventuras</Eyebrow>
        </div>
      </div>
      <p className="text-xs text-ink3 mt-3">
        {row.z2} · {row.adventure}
      </p>
      <div className="mt-3 border-t border-line pt-3">
        <Eyebrow className="block mb-0.5">Próxima ruta planificada</Eyebrow>
        {next ? (
          <>
            <p className="text-sm text-ink">
              {formatShort(next.date)} · {plannedItemLabel(next.item)}
            </p>
            <p className="text-xs text-ink3">Intra: {fuelIntraByMinutes(next.item.minutes[1])}</p>
          </>
        ) : (
          <p className="text-sm text-ink3">Ninguna pendiente esta semana.</p>
        )}
      </div>
    </Card>
  );
}
