// REGEN tab — Etapa I subset of SPEC §8.6.
import { Link } from 'react-router-dom';
import { Card, Screen } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { MORNING_CHECK, MORNING_DECISION } from '@/domain/content/items';
import { NUTRITION_DISCLAIMER } from '@/domain/content/nutrition';
import { BackpackCard } from './BackpackCard';
import { DataCard } from './DataCard';
import { MicrodoseCard } from './MicrodoseCard';
import { WeightCard } from './WeightCard';

export function RegenScreen() {
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
      <Card eyebrow="Síntomas" title="Muñeca y aductor · 28 días">
        <p className="text-sm text-ink3">Gráfica y avisos de tendencia (R8) en la Etapa II.</p>
      </Card>
      <MicrodoseCard />
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
      <Card eyebrow="Consejo de la Liga" title="Domingo">
        <p className="text-sm text-ink3">
          Scorecard, wizard de 7 pasos e informe para El Rival: Etapa II.
        </p>
      </Card>
      <DataCard />
      <p className="text-xs text-ink3 px-1">{NUTRITION_DISCLAIMER}</p>
    </Screen>
  );
}
