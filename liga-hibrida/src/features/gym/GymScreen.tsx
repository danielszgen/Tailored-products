// GYM tab (SPEC §8.3): today's gym first, the four gyms, active combat, history.
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Screen, Splash, StatusPill } from '@/components';
import { GYM_NAMES, GYM_ORDER } from '@/domain/content/gyms';
import type { GymId, SessionVersion } from '@/domain/types';
import { useToday } from '@/features/today/useToday';
import { GymCard } from './GymCard';
import { SessionHistory } from './SessionHistory';

export function GymScreen() {
  const model = useToday();
  const navigate = useNavigate();
  const { profile, day, pvResult, activeSession } = model;
  if (profile === undefined) return <Splash />;

  const plannedGym: GymId | null =
    day?.am?.kind === 'gym' ? day.am.gymId : day?.pm?.kind === 'gym' ? day.pm.gymId : null;
  const plannedVersion: SessionVersion =
    day?.am?.kind === 'gym' ? day.am.version : day?.pm?.kind === 'gym' ? day.pm.version : 60;

  const status = pvResult?.status;
  const suggestedVersion: SessionVersion =
    status === 'cargado' || status === 'ko' ? 45 : plannedVersion;
  const order: GymId[] = plannedGym
    ? [plannedGym, ...GYM_ORDER.filter((g) => g !== plannedGym)]
    : [...GYM_ORDER];

  return (
    <Screen title="Gimnasios" eyebrow="Combates">
      <Card
        eyebrow="Estado de hoy"
        title={
          pvResult ? (
            <span className="flex items-center gap-2">
              <StatusPill status={pvResult.status} />
              <span className="font-pixel text-sm tracking-[1px]">PV {pvResult.pv}</span>
            </span>
          ) : (
            'Sin check-in hoy'
          )
        }
      >
        {pvResult ? (
          <p className="text-sm text-ink2">
            {status === 'ok' && 'Plan completo.'}
            {status === 'cargado' &&
              "Estado CARGADO: versión sugerida 45', −1 serie en accesorios, RIR +1."}
            {status === 'ko' && "Estado KO: sesión reducida a técnica suave y movilidad (45')."}
            {model.wave === 'deload' && ' Semana de descarga: 90 % de carga, series × 0,65, RIR 4.'}
          </p>
        ) : (
          <p className="text-sm text-ink2">
            Haz el{' '}
            <Link to="/" className="text-accent font-bold">
              check-in en HOY
            </Link>{' '}
            para ajustar la sesión a tu estado.
          </p>
        )}
      </Card>

      {activeSession && (
        <Card eyebrow="Combate en curso" title={GYM_NAMES[activeSession.gymId]}>
          <Button full onClick={() => navigate(`/gym/${activeSession.gymId}`)}>
            Continuar combate
          </Button>
        </Card>
      )}

      {plannedGym && <Eyebrow>Planificado hoy: {GYM_NAMES[plannedGym]}</Eyebrow>}
      {order.map((g) => (
        <GymCard
          key={g}
          gymId={g}
          isToday={g === plannedGym}
          version={g === plannedGym ? suggestedVersion : status && status !== 'ok' ? 45 : 60}
          onEnter={() =>
            navigate(
              `/gym/${g}?version=${g === plannedGym ? suggestedVersion : status && status !== 'ok' ? 45 : 60}`,
            )
          }
        />
      ))}

      <SessionHistory limit={10} />
    </Screen>
  );
}
