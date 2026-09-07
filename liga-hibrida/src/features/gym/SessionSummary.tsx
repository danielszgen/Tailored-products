// Combat summary: volume, sets, best sets vs previous session, medal placeholder (SPEC §8.3).
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Pill } from '@/components';
import { GYM_NAMES, getExercise } from '@/domain/content/gyms';
import type { SessionLog } from '@/domain/types';
import { bestSet, formatKg, type PreviousLog } from './suggestion';
import { compareBest, formatSet, sessionVolume, setCount } from './volume';

export function SessionSummary({
  session,
  previous,
}: {
  session: SessionLog;
  previous: Record<string, PreviousLog[]>;
}) {
  const navigate = useNavigate();
  const lower = session.gymId === 'cantera' || session.gymId === 'resorte';
  const volume = sessionVolume(session);
  return (
    <>
      <Card eyebrow="Resumen del combate" title={GYM_NAMES[session.gymId]}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="display text-2xl">{formatKg(Math.round(volume))}</div>
            <Eyebrow>kg volumen</Eyebrow>
          </div>
          <div>
            <div className="display text-2xl">{setCount(session)}</div>
            <Eyebrow>series</Eyebrow>
          </div>
          <div>
            <div className="display text-2xl">{session.durationMin ?? '—'}</div>
            <Eyebrow>min</Eyebrow>
          </div>
        </div>
      </Card>

      <Card eyebrow="Mejores series" title="Hoy vs última sesión">
        <ul className="flex flex-col gap-2">
          {session.exercises
            .filter((e) => e.sets.length > 0)
            .map((e) => {
              const spec = getExercise(session.gymId, e.exerciseId);
              const best = bestSet(e);
              const prevBest = bestSet(previous[e.exerciseId]?.[0]?.log);
              const cmp = compareBest(best, prevBest);
              return (
                <li key={e.exerciseId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="block text-ink truncate">{spec?.name ?? e.exerciseId}</span>
                    <span className="block text-xs text-ink3">{best ? formatSet(best) : '—'}</span>
                  </span>
                  <Pill tone={cmp.delta > 0 ? 'ok' : 'neutral'}>{cmp.text}</Pill>
                </li>
              );
            })}
        </ul>
        <p className="text-xs text-ink3 mt-3">Avance de medalla: se calcula en la Etapa III.</p>
      </Card>

      {lower && (
        <Card eyebrow="Recordatorio" title="Aductor 30–60 min después">
          <p className="text-sm text-ink2">Registra el aductor tras la sesión en HOY.</p>
        </Card>
      )}

      <Button full size="lg" onClick={() => navigate('/')}>
        Volver a HOY
      </Button>
    </>
  );
}
