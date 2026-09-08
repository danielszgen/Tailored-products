// Formas I–IV with the R10 evolution check and the "Evolucionar" confirmation (SPEC §6.3, §8.5).
import { useState } from 'react';
import { Button, Card, Pill, Sheet } from '@/components';
import { FormSilhouette } from '@/brand/icons';
import { saveAdjustment, updateProfile } from '@/data';
import { EVOLUTION_RULE, FORM_ORDER, FORMS } from '@/domain/content/phases';
import type { EvolutionCheck } from '@/domain/rules/league';
import type { ISODate, Profile } from '@/domain/types';
import { newId } from '@/lib/id';

export function FormsCard({
  profile,
  evolution,
  today,
}: {
  profile: Profile;
  evolution: EvolutionCheck | null;
  today: ISODate;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = profile.form;
  const target = evolution?.to ?? null;
  const ready = !!evolution?.ready && target !== null;

  async function evolve() {
    if (!target) return;
    setBusy(true);
    try {
      await updateProfile({
        form: target,
        evolutions: [...(profile.evolutions ?? []), { form: target, date: today }],
      });
      await saveAdjustment({
        id: newId('evo'),
        date: today,
        kind: 'nota',
        detail: `Evolución confirmada: ${FORMS[current].fullName} → ${FORMS[target].fullName}.`,
        source: 'daniel',
      });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

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

      {evolution && evolution.automatic && (
        <ul className="mt-3 flex flex-col gap-1" aria-label="Condiciones de evolución">
          {evolution.conditions.map((c) => (
            <li key={c.id} className="text-sm flex gap-2">
              <span aria-hidden className={c.met ? 'text-status-ok' : 'text-ink3'}>
                {c.met ? '✓' : '○'}
              </span>
              <span className="min-w-0">
                <span className={`font-bold ${c.met ? 'text-ink' : 'text-ink2'}`}>{c.text}</span>
                <span className="block text-xs text-ink3">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {evolution && !evolution.automatic && (
        <p className="text-sm text-ink2 mt-3">{evolution.note}</p>
      )}
      <p className="text-xs text-ink3 mt-3">{EVOLUTION_RULE}</p>
      <Button
        full
        variant={ready ? 'primary' : 'secondary'}
        className="mt-3"
        disabled={!ready}
        onClick={() => setOpen(true)}
      >
        {target ? `Evolucionar a ${FORMS[target].fullName}` : 'Forma IV alcanzada'}
        {evolution?.automatic && !ready && (
          <Pill tone="neutral">
            {evolution.conditions.filter((c) => c.met).length}/{evolution.conditions.length}
          </Pill>
        )}
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="¿Evolucionar?"
        footer={
          <Button full onClick={() => void evolve()} disabled={busy}>
            Confirmar evolución
          </Button>
        }
      >
        <p className="text-sm text-ink2">
          Las 4 condiciones de la {FORMS[current].fullName} se cumplen. Al confirmar, la ficha pasa
          a la {target ? FORMS[target].fullName : ''} y queda anotado en los ajustes.
        </p>
      </Sheet>
    </Card>
  );
}
