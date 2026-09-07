// R5 proposals after a Zona Salvaje: accept / reject each item, then apply to the WeekPlan.
import { useState } from 'react';
import { Button, Eyebrow, Pill, Sheet } from '@/components';
import { saveWeek } from '@/data';
import { applyProposals, type SubstitutionProposal } from '@/domain/rules/substitution';
import type { WeekPlan } from '@/domain/types';
import { formatShort } from '@/lib/date';

const KIND_LABEL = {
  remove: 'Eliminar',
  convert: 'Sustituir',
  note: 'Nota',
  warn: 'Aviso',
} as const;

export function ProposalsSheet({
  open,
  plan,
  proposals,
  onClose,
  onApplied,
}: {
  open: boolean;
  plan: WeekPlan | null;
  proposals: SubstitutionProposal[];
  onClose: () => void;
  onApplied: (count: number) => void;
}) {
  const [rejected, setRejected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const actionable = proposals.filter((p) => p.kind !== 'warn');
  const warnings = proposals.filter((p) => p.kind === 'warn');
  const accepted = actionable.filter((p) => !rejected[p.id]);

  async function apply() {
    setBusy(true);
    try {
      if (plan && accepted.length > 0) await saveWeek(applyProposals(plan, accepted));
      onApplied(accepted.length);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Sustituciones propuestas"
      footer={
        <Button full size="lg" onClick={apply} disabled={busy}>
          {accepted.length > 0
            ? `Aplicar ${accepted.length} cambio${accepted.length === 1 ? '' : 's'}`
            : 'Cerrar sin cambios'}
        </Button>
      }
    >
      <p className="text-sm text-ink2 mb-3">
        Nunca añadir: intercambiar. Acepta o rechaza cada cambio; el Lower nunca se toca.
      </p>
      {actionable.length === 0 && (
        <p className="text-sm text-ink3 mb-3">Sin cambios en el plan de esta semana.</p>
      )}
      <ul className="flex flex-col gap-2" aria-label="Propuestas">
        {actionable.map((p) => {
          const on = !rejected[p.id];
          return (
            <li key={p.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={p.title}
                onClick={() => setRejected((r) => ({ ...r, [p.id]: !r[p.id] }))}
                className={`w-full min-h-[52px] flex items-start gap-3 rounded-list border px-3 py-2 text-left ${
                  on ? 'bg-status-ok/15 border-status-ok' : 'bg-surface border-line'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-pill border flex items-center justify-center text-xs ${
                    on ? 'bg-status-ok border-status-ok text-[#141B2B]' : 'border-line'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <Pill tone="neutral">{KIND_LABEL[p.kind]}</Pill>
                    <span className="text-xs text-ink3">{formatShort(p.date)}</span>
                  </span>
                  <span className="block text-sm text-ink font-bold mt-1">{p.title}</span>
                  <span className="block text-xs text-ink2">{p.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {warnings.length > 0 && (
        <div className="mt-4">
          <Eyebrow className="block mb-1">Avisos</Eyebrow>
          <ul className="text-sm text-ink2 flex flex-col gap-1">
            {warnings.map((w) => (
              <li key={w.id}>· {w.advisory?.message ?? w.title}</li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
