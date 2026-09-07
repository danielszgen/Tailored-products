// Recent routes and adventures with delete.
import { Button, Card, Pill } from '@/components';
import { deleteRoute, deleteWild } from '@/data';
import { ROUTE_KIND_LABELS, WILD_KIND_LABELS } from '@/domain/content/routes';
import type { RouteLog, WildLog } from '@/domain/types';
import { formatShort } from '@/lib/date';

const COUNTS_TONE = { z2: 'ok', medio: 'cargado', duro: 'ko' } as const;
const INTENSITY_TONE = { facil: 'ok', moderada: 'cargado', dura: 'ko' } as const;

type Entry =
  | { kind: 'route'; date: string; id: string; log: RouteLog }
  | { kind: 'wild'; date: string; id: string; log: WildLog };

export function LogList({ routes, wild }: { routes: RouteLog[]; wild: WildLog[] }) {
  const entries: Entry[] = [
    ...routes.map((r) => ({ kind: 'route' as const, date: r.date, id: r.id, log: r })),
    ...wild.map((w) => ({ kind: 'wild' as const, date: w.date, id: w.id, log: w })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <Card eyebrow="Últimos 14 días" title="Rutas y aventuras">
      {entries.length === 0 ? (
        <p className="text-sm text-ink3">Nada registrado todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Registros">
          {entries.map((e) => (
            <li key={e.id} className="list-item p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink3">{formatShort(e.date)}</span>
                  {e.kind === 'route' ? (
                    <Pill tone={COUNTS_TONE[e.log.countsAs]}>{e.log.countsAs}</Pill>
                  ) : (
                    <Pill tone={INTENSITY_TONE[e.log.intensity]}>{e.log.intensity}</Pill>
                  )}
                </div>
                <p className="text-sm text-ink truncate">
                  {e.kind === 'route'
                    ? `${ROUTE_KIND_LABELS[e.log.kind]} ${e.log.minutes}' · RPE ${e.log.rpe}${e.log.elevationM ? ` · ${e.log.elevationM} m+` : ''}`
                    : `Zona Salvaje · ${WILD_KIND_LABELS[e.log.kind]} ${e.log.minutes}'`}
                </p>
                {e.log.note && <p className="text-xs text-ink3 truncate">{e.log.note}</p>}
              </div>
              <Button
                variant="ghost"
                aria-label={`Borrar registro del ${formatShort(e.date)}`}
                onClick={() => (e.kind === 'route' ? deleteRoute(e.id) : deleteWild(e.id))}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
