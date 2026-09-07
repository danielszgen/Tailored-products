// R9 · cut proposals for the week (fatiga/viaje template or 3+ CARGADO/KO days).
import { useState } from 'react';
import { Button, Card, Eyebrow } from '@/components';
import { saveWeek } from '@/data';
import { CUT_STEP_TITLES, cutTriggerText } from '@/domain/rules/minimum';
import { applyProposals } from '@/domain/rules/substitution';
import type { TodayModel } from './useToday';

export function CutCard({ model }: { model: TodayModel }) {
  const { cut, week } = model;
  const [rejected, setRejected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  if (!cut || !cut.triggered || cut.step === null || !week) return null;

  const accepted = cut.proposals.filter((p) => !rejected[p.id]);

  async function apply() {
    if (!week) return;
    setBusy(true);
    try {
      await saveWeek(applyProposals(week, accepted));
      setRejected({});
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card eyebrow="Recorte · R9" title={CUT_STEP_TITLES[cut.step]}>
      <p className="text-sm text-ink2 mb-3">{cutTriggerText(cut.trigger!, cut.loadedDays)}</p>
      <ul className="flex flex-col gap-2 mb-3">
        {cut.proposals.map((p) => {
          const on = !rejected[p.id];
          return (
            <li key={p.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setRejected((r) => ({ ...r, [p.id]: !r[p.id] }))}
                className={`w-full min-h-touch flex items-start gap-3 rounded-list border px-3 py-2 text-left ${
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
                <span className="text-sm text-ink">{p.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button full onClick={apply} disabled={busy || accepted.length === 0}>
        Aplicar recorte ({accepted.length})
      </Button>
      <Eyebrow className="block mt-2">
        {cut.message} Nunca se añaden sesiones para compensar.
      </Eyebrow>
    </Card>
  );
}
