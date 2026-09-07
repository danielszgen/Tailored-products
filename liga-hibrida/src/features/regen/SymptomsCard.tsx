// Síntomas (SPEC §8.6): 28-day chart, R8 advisories and the barbell-squat transition status.
import { Card, Eyebrow, Pill } from '@/components';
import { hierarchyName } from '@/domain/content/constitution';
import { recentPoints } from '@/domain/rules/symptoms';
import type { TodayModel } from '@/features/today/useToday';
import { SymptomsChart } from './SymptomsChart';

export function SymptomsCard({ model }: { model: TodayModel }) {
  const { symptoms, today, transition, profile } = model;
  const wrist = recentPoints(symptoms.wrist.points, today);
  const adductor = recentPoints(symptoms.adductor.points, today);
  const flags = [
    symptoms.wrist.rising && 'muñeca creciente',
    symptoms.adductor.rising && 'aductor creciente',
    symptoms.wrist.persistent && 'muñeca persistente',
    symptoms.adductor.persistent && 'aductor persistente',
  ].filter((f): f is string => !!f);

  return (
    <Card
      eyebrow="Síntomas · R8"
      title="Muñeca y aductor · 28 días"
      right={
        <span className="flex gap-1">
          <Pill tone={symptoms.wrist.ko ? 'ko' : 'neutral'}>M {symptoms.wrist.latest ?? '—'}</Pill>
          <Pill tone={symptoms.adductor.ko ? 'ko' : 'neutral'}>
            A {symptoms.adductor.latest ?? '—'}
          </Pill>
        </span>
      }
    >
      <SymptomsChart wrist={wrist} adductor={adductor} today={today} />
      {flags.length > 0 && (
        <p className="text-sm text-status-ko mt-2">Tendencia: {flags.join(' · ')}.</p>
      )}
      {symptoms.advisories.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {symptoms.advisories.map((a) => (
            <li key={a.id ?? a.message} className="text-sm text-ink">
              <span className="font-bold">
                Nivel {a.level} · {hierarchyName(a.level)}:
              </span>{' '}
              {a.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink3 mt-2">
          Sin avisos: sin tendencia creciente ni persistencia.
        </p>
      )}
      <div className="mt-3 border-t border-line pt-3">
        <Eyebrow className="block mb-0.5">Transición a sentadilla con barra</Eyebrow>
        <p className="text-sm text-ink2">
          {profile?.squatVariant === 'barbell'
            ? 'Activa: A1 de Cantera es high-bar squat. Si el síntoma vuelve, regresa a la variante tolerada.'
            : transition.reason}
        </p>
      </div>
    </Card>
  );
}
