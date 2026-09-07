// RUTAS tab (SPEC §8.4): weekly counter, route and Zona Salvaje logging with R4/R5, references.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Pill, Screen, Splash } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { ensureWeek, useRoutes, useWild } from '@/data';
import { BLOCK_WEEKS } from '@/domain/content/block';
import {
  COMPATIBILITY_TABLE,
  INTERFERENCE_RULES,
  LIGHT_LABELS,
  LIVE_WEEK_SCENARIOS,
  ROUTE_CLASSIFICATION,
  SUBSTITUTION_MATRIX,
  SUBSTITUTION_PRINCIPLE,
} from '@/domain/content/routes';
import { proposeSubstitutions, type SubstitutionProposal } from '@/domain/rules/substitution';
import type { WeekPlan, WildLog } from '@/domain/types';
import { addDaysISO, weekOfBlock, weekStartOf } from '@/lib/date';
import { useToday } from '@/features/today/useToday';
import { LogList } from './LogList';
import { ProposalsSheet } from './ProposalsSheet';
import { RouteForm } from './RouteForm';
import { WeeklyCard } from './WeeklyCard';
import { WildForm } from './WildForm';

const LIGHT_TONE = { verde: 'ok', ambar: 'cargado', rojo: 'ko' } as const;

type Sheet = 'route' | 'wild' | null;

export function RoutesScreen() {
  const model = useToday();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [proposals, setProposals] = useState<{
    plan: WeekPlan;
    items: SubstitutionProposal[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { profile, today, weekStart, wave } = model;
  const weekRoutes = useRoutes({ from: weekStart, to: addDaysISO(weekStart, 6) });
  const weekWild = useWild({ from: weekStart, to: addDaysISO(weekStart, 6) });
  const recentRoutes = useRoutes({ from: addDaysISO(today, -13), to: today });
  const recentWild = useWild({ from: addDaysISO(today, -13), to: today });

  useEffect(() => {
    const nueva = params.get('nueva');
    if (nueva === 'ruta' || nueva === 'salvaje') {
      setSheet(nueva === 'ruta' ? 'route' : 'wild');
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  if (profile === undefined) return <Splash />;
  if (!profile) return null;

  async function onWildSaved(wild: WildLog) {
    setSheet(null);
    const wob = weekOfBlock(wild.date, profile!.blockStart);
    if (wob < 1 || wob > BLOCK_WEEKS) {
      setMessage('Aventura guardada (fuera del bloque: sin sustituciones).');
      return;
    }
    const plan = await ensureWeek({
      weekStart: weekStartOf(wild.date),
      weekOfBlock: wob,
      template: profile!.defaultTemplate ?? 'estandar',
    });
    const items = proposeSubstitutions({ wild, plan, today });
    if (items.length === 0) setMessage('Aventura guardada. Sin sustituciones propuestas.');
    else setProposals({ plan, items });
  }

  return (
    <Screen title="Rutas" eyebrow="Z2 y Zona Salvaje">
      <WeeklyCard
        wave={wave}
        routes={weekRoutes ?? []}
        wild={weekWild ?? []}
        plan={model.week ?? null}
        nextPlan={model.tomorrowPlan}
        today={today}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" onClick={() => setSheet('route')}>
          Registrar ruta
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setSheet('wild')}>
          Zona Salvaje
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-status-ok px-1">
          {message}
        </p>
      )}

      <LogList routes={recentRoutes ?? []} wild={recentWild ?? []} />

      <Card eyebrow="Clasificación de una ruta" title="RPE">
        <p className="text-sm text-ink2">
          {ROUTE_CLASSIFICATION.z2} · {ROUTE_CLASSIFICATION.medio} · {ROUTE_CLASSIFICATION.duro}.
        </p>
        <p className="text-xs text-ink3 mt-1">
          Si sube de RPE 8, la app avisa: «{ROUTE_CLASSIFICATION.warning}».
        </p>
      </Card>

      <Collapsible title="Reglas de interferencia" eyebrow="Las 7">
        <ol className="flex flex-col gap-2">
          {INTERFERENCE_RULES.map((r) => (
            <li key={r.id}>
              <span className="font-bold text-ink">
                {r.id}. {r.name}:
              </span>{' '}
              {r.text}
            </li>
          ))}
        </ol>
      </Collapsible>

      <Collapsible title="Semáforo de compatibilidad" eyebrow="Mismo día">
        <ul className="flex flex-col gap-2">
          {COMPATIBILITY_TABLE.map((c) => (
            <li key={c.combo} className="flex items-start justify-between gap-2 text-sm">
              <span className="text-ink">{c.combo}</span>
              <Pill tone={LIGHT_TONE[c.light]} className="shrink-0" title={c.reading}>
                {LIGHT_LABELS[c.light]}
              </Pill>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink3 mt-2">
          {COMPATIBILITY_TABLE.filter((c) => c.reading !== LIGHT_LABELS[c.light])
            .map((c) => `${c.combo}: ${c.reading}`)
            .join(' · ')}
        </p>
      </Collapsible>

      <Collapsible title="Matriz de sustituciones" eyebrow={SUBSTITUTION_PRINCIPLE}>
        <ul className="flex flex-col gap-2">
          {SUBSTITUTION_MATRIX.map((s) => (
            <li key={s.appears}>
              <span className="font-bold text-ink">{s.appears}</span>
              <span className="block">Puede sustituir: {s.canReplace}</span>
              <span className="block">No debe sustituir: {s.mustNotReplace}</span>
              <span className="block text-xs text-ink3">Ajuste: {s.adjustment}</span>
            </li>
          ))}
        </ul>
      </Collapsible>

      <Collapsible title="Escenarios de semana viva">
        <ul className="list-disc pl-4 flex flex-col gap-1">
          {LIVE_WEEK_SCENARIOS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Collapsible>

      {sheet === 'route' && (
        <RouteForm
          open
          today={today}
          onClose={() => setSheet(null)}
          onSaved={(route) => {
            setSheet(null);
            setMessage(
              route.countsAs === 'duro'
                ? `Ruta guardada (${route.countsAs}): ${ROUTE_CLASSIFICATION.warning}.`
                : `Ruta guardada: ${route.minutes}' ${route.countsAs}.`,
            );
          }}
        />
      )}
      {sheet === 'wild' && (
        <WildForm open today={today} onClose={() => setSheet(null)} onSaved={onWildSaved} />
      )}
      {proposals && (
        <ProposalsSheet
          open
          plan={proposals.plan}
          proposals={proposals.items}
          onClose={() => setProposals(null)}
          onApplied={(count) => {
            setProposals(null);
            setMessage(
              count > 0
                ? `Semana actualizada: ${count} cambio${count === 1 ? '' : 's'} aplicado${count === 1 ? '' : 's'}.`
                : 'Aventura guardada sin cambios en la semana.',
            );
          }}
        />
      )}
    </Screen>
  );
}
