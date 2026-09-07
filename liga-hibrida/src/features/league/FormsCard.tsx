// Formas I–IV with the current one and the evolution rule (SPEC §6.3, §8.5).
import { Button, Card, Pill } from '@/components';
import { FormSilhouette } from '@/brand/icons';
import { EVOLUTION_RULE, FORM_ORDER, FORMS } from '@/domain/content/phases';
import type { Form } from '@/domain/types';

export function FormsCard({ current }: { current: Form }) {
  return (
    <Card eyebrow="Evolución" title="Formas I–IV">
      <ol className="flex flex-col gap-2">
        {FORM_ORDER.map((f) => {
          const spec = FORMS[f];
          const isCurrent = f === current;
          return (
            <li key={f} className={`list-item p-3 flex gap-3 ${isCurrent ? 'border-accent' : ''}`}>
              <span className={isCurrent ? 'text-accent' : 'text-ink3'}>
                <FormSilhouette form={f} size={40} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">{spec.fullName}</span>
                  {isCurrent && <Pill tone="accent">actual</Pill>}
                </div>
                <p className="text-xs text-ink3">{spec.period}</p>
                <p className="text-xs text-ink2 mt-1">{spec.objective}</p>
                <p className="text-xs text-ink3 mt-1">
                  Evoluciona cuando: {spec.evolutionCondition}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink3 mt-3">{EVOLUTION_RULE}</p>
      <Button full variant="secondary" className="mt-3" disabled>
        Evolucionar <Pill tone="neutral">Etapa III</Pill>
      </Button>
    </Card>
  );
}
