// R7 · next kcal adjustment with the literal text of the fortnightly table (SPEC §8.6).
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Eyebrow, Pill } from '@/components';
import {
  getAdjustment,
  saveAdjustment,
  useAdjustments,
  useCheckins,
  useSessions,
  useWeightSeries,
} from '@/data';
import { MASTER_RULE } from '@/domain/content/nutrition';
import {
  kcalAdjustmentId,
  kcalProposal,
  nextEvaluationDate,
  nutritionPhaseFor,
  toAdjustment,
} from '@/domain/rules/weight';
import type { Profile } from '@/domain/types';
import { addDaysISO, formatShort, weekOfBlock } from '@/lib/date';
import { mean } from '@/lib/math';

const KIND_TONE = {
  increase: 'ok',
  hold: 'neutral',
  decrease: 'cargado',
  review: 'ko',
  insufficient: 'neutral',
} as const;

export function KcalCard({ profile, today }: { profile: Profile; today: string }) {
  const points = useWeightSeries();
  const recentCheckins = useCheckins({ from: addDaysISO(today, -6), to: today });
  const recentSessions = useSessions({ limit: 3, completedOnly: true });
  const adjustments = useAdjustments();
  const [busy, setBusy] = useState(false);

  const meanPv = mean((recentCheckins ?? []).map((c) => c.pv));
  const koDays = (recentCheckins ?? []).filter((c) => c.status === 'ko').length;
  const exhausted = (meanPv !== undefined && meanPv < 60) || koDays >= 2;
  const heavy = (recentSessions ?? []).filter((s) => s.feel === 'pesado').length;
  const performanceDrop = heavy >= 2;

  const proposal = kcalProposal({
    points: points ?? [],
    blockStart: profile.blockStart,
    today,
    exhausted,
    performanceDrop,
  });
  const stored = useLiveQuery(
    () => (proposal ? getAdjustment(kcalAdjustmentId(proposal.evaluationDate)) : undefined),
    [proposal?.evaluationDate],
  );
  const wob = weekOfBlock(today, profile.blockStart);
  const next = nextEvaluationDate(profile.blockStart, today);
  const history = (adjustments ?? []).filter((a) => a.kind === 'kcal').slice(0, 3);

  async function accept() {
    if (!proposal) return;
    setBusy(true);
    try {
      await saveAdjustment(toAdjustment(proposal, today));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      eyebrow="Próximo ajuste calórico · R7"
      title={proposal ? proposal.decision : 'Semanas 1–2: solo medir'}
      right={proposal && <Pill tone={KIND_TONE[proposal.kind]}>{proposal.situation}</Pill>}
    >
      {proposal ? (
        <>
          <p className="text-sm text-ink" data-testid="kcal-text">
            {proposal.text}
          </p>
          <p className="text-xs text-ink3 mt-1">
            Evaluación del {formatShort(proposal.evaluationDate)} · fase {proposal.phase}
            {exhausted && ' · recuperación baja esta semana'}
            {performanceDrop && ' · rendimiento cae (sesiones pesadas)'}
          </p>
          {proposal.kind !== 'insufficient' && (
            <div className="mt-3">
              {stored ? (
                <p className="text-sm text-status-ok">Anotado el {formatShort(stored.date)} ✓</p>
              ) : (
                <Button full onClick={accept} disabled={busy}>
                  Anotar el ajuste
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-ink2">
          {wob < 1 ? 'La Liga no ha empezado.' : `Fase ${nutritionPhaseFor(Math.max(1, wob))}.`}{' '}
          <span className="text-ink3">{MASTER_RULE}</span>
        </p>
      )}
      <Eyebrow className="block mt-3">Siguiente evaluación: {formatShort(next)}</Eyebrow>
      {history.length > 0 && (
        <ul className="mt-2 text-xs text-ink3 flex flex-col gap-0.5">
          {history.map((a) => (
            <li key={a.id}>
              {formatShort(a.date)} · {a.detail}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
