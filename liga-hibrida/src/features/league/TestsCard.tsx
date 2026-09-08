// Combates de Liga (SPEC §6.10, §8.5): stored tests with deltas vs the previous one and the CTA
// to the wizard on test weeks (0 = baseline in weeks 1–2, then 4/8/12).
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Pill } from '@/components';
import { compareTests, nextTestWeek, testWeekFor } from '@/domain/rules/league';
import type { LeagueTest } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { testTitle } from './testTitle';

export function TestsCard({
  tests,
  weekOfBlock,
}: {
  tests: LeagueTest[] | null;
  weekOfBlock: number | null;
}) {
  const navigate = useNavigate();
  const list = [...(tests ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  const wob = weekOfBlock ?? 0;
  const thisWeek = testWeekFor(wob, list);
  const existing = thisWeek === null ? undefined : list.find((t) => t.weekOfBlock === thisWeek);
  const next = nextTestWeek(wob);

  return (
    <Card
      eyebrow="Combates de Liga"
      title="Tests de las semanas 4, 8 y 12"
      right={thisWeek !== null ? <Pill tone="gold">Semana de test</Pill> : undefined}
    >
      {!tests ? (
        <p className="text-sm text-ink3">Calculando…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-ink2 mb-3">
          Sin tests todavía. Los 6 apartados: composición, torso, piernas, motor, control y
          transferencia.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 mb-3" aria-label="Tests registrados">
          {list.map((t, i) => {
            const rows = compareTests(t, list[i - 1]).filter(
              (r) => r.current !== '—' && r.delta !== '—' && r.delta !== '=',
            );
            return (
              <li key={t.id} className="list-item p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{testTitle(t)}</span>
                  <Eyebrow>{formatShort(t.date)}</Eyebrow>
                </div>
                {rows.length > 0 ? (
                  <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={`Deltas ${testTitle(t)}`}>
                    {rows.slice(0, 6).map((r) => (
                      <li key={r.label}>
                        <Pill tone={r.better === false ? 'cargado' : r.better ? 'ok' : 'neutral'}>
                          {r.label.replace(' (carga×reps)', '')} {r.delta}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink3 mt-1">
                    {i === 0 ? 'Primer test: sin comparación.' : 'Sin cambios medibles.'}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Button
        full
        variant={thisWeek !== null ? 'primary' : 'secondary'}
        onClick={() => navigate('/liga/combate')}
      >
        {thisWeek !== null
          ? existing
            ? `Editar ${testTitle(existing)}`
            : thisWeek === 0
              ? 'Registrar baseline (Semana 0)'
              : `Registrar Combate de Liga · semana ${thisWeek}`
          : next
            ? `Próximo Combate de Liga: semana ${next}`
            : 'Registrar un test fuera de fecha'}
      </Button>
    </Card>
  );
}
