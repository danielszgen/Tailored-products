// Combat summary: volume, sets, best sets vs previous session, medal advance (SPEC §8.3).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Meter, Pill, type MeterTone } from '@/components';
import { MedalIcon, type MedalState } from '@/brand/icons';
import { GYM_NAMES, getExercise } from '@/domain/content/gyms';
import type { MedalProgress } from '@/domain/rules/league';
import type { GymId, SessionLog } from '@/domain/types';
import { useLeague } from '@/features/league/useLeague';
import { formatShort } from '@/lib/date';
import { bestSet, formatKg, type PreviousLog } from './suggestion';
import { compareBest, formatSet, sessionVolume, setCount } from './volume';

/** Each gym borrows the tone of the type it trains most (as in the LIGA medals card). */
const MEDAL_TONE: Record<GymId, MeterTone> = {
  cantera: 'fuerza',
  yunque: 'masa',
  resorte: 'aventura',
  vertigo: 'control',
};

const STATE_LABEL: Record<MedalState, string> = {
  earned: 'conseguida',
  progress: 'en progreso',
  locked: 'bloqueada',
};

function medalState(medal: MedalProgress): MedalState {
  if (medal.earned) return 'earned';
  return medal.progress > 0 ? 'progress' : 'locked';
}

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
      </Card>

      <MedalAdvance gymId={session.gymId} />

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

/** "Avance de la medalla" of the gym (R10 via useLeague, SPEC §8.3). */
function MedalAdvance({ gymId }: { gymId: GymId }) {
  const { loading, summary } = useLeague();
  const medal = summary?.medals.find((m) => m.id === gymId);
  // useLeague stores a newly earned medal at once, which clears `isNew` on the next evaluation:
  // latch it so the celebration stays on screen for the whole summary.
  const [celebrate, setCelebrate] = useState(false);
  const isNew = medal?.isNew ?? false;
  useEffect(() => {
    if (isNew) setCelebrate(true);
  }, [isNew]);

  if (loading || !medal) {
    return (
      <Card eyebrow="Avance de la medalla" title={GYM_NAMES[gymId]}>
        <p className="text-sm text-ink3">Calculando…</p>
      </Card>
    );
  }

  const state = medalState(medal);
  return (
    <Card
      eyebrow="Avance de la medalla"
      title={medal.name}
      right={
        isNew || celebrate ? (
          <Pill tone="gold" size="md">
            ¡Nueva medalla!
          </Pill>
        ) : undefined
      }
    >
      <div className="flex gap-3">
        <MedalIcon
          gym={gymId}
          state={state}
          size={44}
          title={`Medalla ${medal.name} ${STATE_LABEL[state]}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink2">{medal.condition}</p>
          <Meter
            value={medal.progress * 100}
            tone={MEDAL_TONE[gymId]}
            label="Progreso"
            height={8}
            className="mt-2"
          />
          <p className="text-xs text-ink3 mt-2">{medal.detail}</p>
          {medal.earnedOn && (
            <Eyebrow className="block mt-1">Conseguida el {formatShort(medal.earnedOn)}</Eyebrow>
          )}
        </div>
      </div>
    </Card>
  );
}
