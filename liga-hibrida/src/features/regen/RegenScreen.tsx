// REGEN tab (SPEC §8.6): weight + R7, symptoms + R8, regen log, microdose, Mochila, Consejo, data.
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Screen, Splash } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { useRegen } from '@/data';
import { MORNING_CHECK, MORNING_DECISION } from '@/domain/content/items';
import { NUTRITION_DISCLAIMER } from '@/domain/content/nutrition';
import { addDaysISO } from '@/lib/date';
import { useToday } from '@/features/today/useToday';
import { BackpackCard } from './BackpackCard';
import { CouncilCard } from './CouncilCard';
import { DataCard } from './DataCard';
import { KcalCard } from './KcalCard';
import { MicrodoseCard } from './MicrodoseCard';
import { RegenLogCard } from './RegenLogCard';
import { countRegen } from './regenCounts';
import { SymptomsCard } from './SymptomsCard';
import { WeightCard } from './WeightCard';

export function RegenScreen() {
  const model = useToday();
  const navigate = useNavigate();
  const { profile, today, weekStart } = model;
  const weekRegen = useRegen({ from: weekStart, to: addDaysISO(weekStart, 6) });
  if (profile === undefined) return <Splash />;
  if (!profile) return null;

  return (
    <Screen
      title="Centro Regen"
      eyebrow="Recuperación"
      right={
        <Link
          to="/regen/ajustes"
          className="min-h-touch flex items-center text-accent font-bold text-sm"
        >
          Ajustes
        </Link>
      }
    >
      <WeightCard />
      <KcalCard profile={profile} today={today} />
      <SymptomsCard model={model} />
      <RegenLogCard today={today} weekStart={weekStart} />
      <MicrodoseCard counts={countRegen(weekRegen ?? [])} />
      <BackpackCard />
      <Collapsible title="Chequeo matinal de 30 s" eyebrow="Documento 06">
        <ul className="flex flex-col gap-2">
          {MORNING_CHECK.map((row) => (
            <li key={row.signal}>
              <span className="font-bold text-ink">{row.signal}:</span> verde {row.verde} · ámbar{' '}
              {row.ambar} · rojo {row.rojo}
            </li>
          ))}
        </ul>
        <p className="mt-2">{MORNING_DECISION.join(' ')}</p>
      </Collapsible>
      <CouncilCard model={model} />
      <Card eyebrow="Etapa III" title="Pregunta al Rival">
        <p className="text-sm text-ink2 mb-3">
          Una pregunta con tu contexto de la semana. Solo con tu consentimiento en Ajustes y viendo
          antes qué se envía.
        </p>
        <Button full variant="secondary" onClick={() => navigate('/regen/rival')}>
          Pregunta al Rival
        </Button>
      </Card>
      <DataCard />
      <p className="text-xs text-ink3 px-1">{NUTRITION_DISCLAIMER}</p>
    </Screen>
  );
}
