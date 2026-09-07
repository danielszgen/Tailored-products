// HOY (SPEC §8.2): trainer card, check-in, plan AM/PM, Combustible, advisories, CTA.
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Pill, Screen, Splash } from '@/components';
import { GYM_NAMES } from '@/domain/content/gyms';
import type { Advisory, GymId, PlannedItem } from '@/domain/types';
import { formatDayLabel } from '@/lib/date';
import { AdductorAfterCard } from './AdductorAfterCard';
import { AdvisoriesCard } from './AdvisoriesCard';
import { CheckinCard } from './CheckinCard';
import { FuelCard } from './FuelCard';
import { PlanCards } from './PlanCards';
import { TrainerHeader } from './TrainerHeader';
import { useToday } from './useToday';

function gymOf(item: PlannedItem | undefined): GymId | null {
  return item?.kind === 'gym' ? item.gymId : null;
}

export function TodayScreen() {
  const model = useToday();
  const navigate = useNavigate();
  const { profile, day, pvResult, activeSession } = model;

  if (profile === undefined) return <Splash />;
  if (!profile) return null;

  const gymId = gymOf(day?.am) ?? gymOf(day?.pm);
  const plannedItem = gymId ? (day?.am?.kind === 'gym' ? day.am : day?.pm) : undefined;
  const plannedVersion = plannedItem?.kind === 'gym' ? plannedItem.version : 60;
  const adjustment =
    gymId && pvResult && pvResult.status !== 'ok' ? model.adjustmentFor(gymId) : null;
  const version = adjustment?.status === 'cargado' ? 45 : plannedVersion;
  const advisories: Advisory[] = adjustment?.advisories ?? [];

  return (
    <Screen
      title="Hoy"
      eyebrow={formatDayLabel(model.today)}
      right={
        <Link
          to="/regen/ajustes"
          aria-label="Ajustes"
          className="min-w-touch min-h-touch flex items-center justify-center text-ink2"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      }
    >
      <TrainerHeader model={model} />

      {activeSession && (
        <Card eyebrow="Combate en curso" title={GYM_NAMES[activeSession.gymId]}>
          <Button full onClick={() => navigate(`/gym/${activeSession.gymId}`)}>
            Continuar combate
          </Button>
        </Card>
      )}

      <CheckinCard model={model} />
      <AdductorAfterCard sessions={model.todaySessions} />
      <PlanCards model={model} />
      <FuelCard model={model} />
      <AdvisoriesCard advisories={advisories} />

      <div className="flex flex-col gap-2">
        {gymId ? (
          <Button size="lg" full onClick={() => navigate(`/gym/${gymId}?version=${version}`)}>
            Entrar a {GYM_NAMES[gymId]}
          </Button>
        ) : (
          <Button size="lg" full variant="secondary" onClick={() => navigate('/gym')}>
            Ver gimnasios
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled>
            Registrar ruta <Pill tone="neutral">Etapa II</Pill>
          </Button>
          <Button variant="secondary" disabled>
            Zona Salvaje <Pill tone="neutral">Etapa II</Pill>
          </Button>
        </div>
      </div>
    </Screen>
  );
}
