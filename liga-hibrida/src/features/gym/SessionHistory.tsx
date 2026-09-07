// Completed combats, most recent first (SPEC §9 Etapa I: "queda en Dexie y aparece en el historial").
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Eyebrow } from '@/components';
import { GymIcon } from '@/brand/icons';
import { listSessions } from '@/data';
import { GYM_NAMES, getExercise, isMainLift } from '@/domain/content/gyms';
import type { GymId, SessionLog } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { bestSet, formatKg } from './suggestion';
import { formatSet, sessionVolume } from './volume';

const FEEL: Record<string, string> = { facil: 'fácil', normal: 'normal', pesado: 'pesado' };

function mainLiftSummary(session: SessionLog): string {
  return session.exercises
    .filter((e) => {
      const spec = getExercise(session.gymId, e.exerciseId);
      return spec && isMainLift(spec) && e.sets.length > 0;
    })
    .map((e) => {
      const spec = getExercise(session.gymId, e.exerciseId)!;
      const best = bestSet(e);
      return `${spec.slot} ${best ? formatSet(best) : '—'}`;
    })
    .join(' · ');
}

export function SessionHistory({ gymId, limit = 10 }: { gymId?: GymId; limit?: number }) {
  const sessions = useLiveQuery(
    () => listSessions({ gymId, completedOnly: true, limit }),
    [gymId, limit],
  );
  if (!sessions) return null;
  return (
    <Card eyebrow="Historial" title={sessions.length === 0 ? 'Sin combates todavía' : 'Combates'}>
      {sessions.length === 0 ? (
        <p className="text-sm text-ink3">Tu primer combate aparecerá aquí.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id} className="list-item p-3 flex gap-3">
              <GymIcon gym={s.gymId} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{GYM_NAMES[s.gymId]}</span>
                  <Eyebrow>
                    {formatShort(s.date)} · {s.version}&apos;
                  </Eyebrow>
                </div>
                <p className="text-xs text-ink2 truncate">
                  {mainLiftSummary(s) || 'Sin series principales'}
                </p>
                <p className="text-xs text-ink3">
                  {formatKg(Math.round(sessionVolume(s)))} kg · {s.feel ? FEEL[s.feel] : '—'}
                  {s.adductorAfter !== undefined ? ` · aductor después ${s.adductorAfter}/10` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
