// Consejo de la Liga (SPEC §8.6, R11): scorecard + 7-step wizard → next WeekPlan + report (§10.1).
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Eyebrow, Meter, Pill, Screen, Segmented, Splash } from '@/components';
import {
  exportAll,
  exportFileName,
  getWeek,
  listRegen,
  listRoutes,
  listWild,
  saveAdjustment,
  saveWeek,
  serializeExport,
  useSessions,
  useWeek,
  useWeightSeries,
} from '@/data';
import { BLOCK_WEEKS, waveLabel } from '@/domain/content/block';
import { GYM_NAMES, GYM_ORDER } from '@/domain/content/gyms';
import { LIGHT_LABELS, WILD_KIND_LABELS } from '@/domain/content/routes';
import { buildWeekPlan, plannedItemLabel, WEEK_TEMPLATE_NAMES } from '@/domain/content/week';
import {
  buildScorecard,
  COUNCIL_STEPS,
  councilReport,
  nextWeekPlan,
  suggestedQuestions,
  type CouncilDecisions,
  type WeekRecords,
} from '@/domain/rules/council';
import { deloadSummary } from '@/domain/rules/deload';
import { kcalProposal, toAdjustment } from '@/domain/rules/weight';
import type { GymId, SessionVersion, WeekTemplate, WildKind } from '@/domain/types';
import { addDaysISO, DAY_SHORT_ES, formatShort } from '@/lib/date';
import { movingAverage7 } from '@/lib/math';
import { useToday } from '@/features/today/useToday';
import { councilAdjustmentId } from './councilId';
import { canShareFiles, downloadText, shareText } from './download';
import { countRegen, WEEKLY_TARGETS } from './regenCounts';

const LIGHT_TONE = { verde: 'ok', ambar: 'cargado', rojo: 'ko', none: 'neutral' } as const;
const VERSIONS = [45, 60, 75].map((v) => ({ value: v as SessionVersion, label: `${v}'` }));
const TEMPLATES = (Object.keys(WEEK_TEMPLATE_NAMES) as WeekTemplate[]).map((id) => ({
  value: id,
  label: WEEK_TEMPLATE_NAMES[id],
}));
const WILD = (Object.keys(WILD_KIND_LABELS) as WildKind[]).map((k) => ({
  value: k,
  label: WILD_KIND_LABELS[k],
}));

export function CouncilScreen() {
  const model = useToday();
  const navigate = useNavigate();
  const { profile, today, weekStart, weekOfBlock } = model;
  const weekEnd = addDaysISO(weekStart, 6);
  const stored = useWeek(weekStart);
  const sessions = useSessions({
    from: addDaysISO(weekStart, -21),
    to: weekEnd,
    completedOnly: true,
  });
  const weights = useWeightSeries();
  const logs = useLiveQuery(async () => {
    const [routes, wild, regen, next] = await Promise.all([
      listRoutes({ from: weekStart, to: weekEnd }),
      listWild({ from: weekStart, to: weekEnd }),
      listRegen({ from: weekStart, to: weekEnd }),
      getWeek(addDaysISO(weekStart, 7)),
    ]);
    return { routes, wild, regen, next: next ?? null };
  }, [weekStart, weekEnd]);

  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<WeekTemplate | null>(null);
  const [versions, setVersions] = useState<Partial<Record<GymId, SessionVersion>>>({});
  const [wildKind, setWildKind] = useState<WildKind | undefined>(undefined);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [kcalAccepted, setKcalAccepted] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const inBlock = weekOfBlock !== null && weekOfBlock >= 1 && weekOfBlock <= BLOCK_WEEKS;
  const plan = useMemo(() => {
    if (stored) return stored;
    if (!profile || !inBlock || weekOfBlock === null) return null;
    return buildWeekPlan({
      weekStart,
      weekOfBlock,
      template: profile.defaultTemplate ?? 'estandar',
    });
  }, [stored, profile, inBlock, weekOfBlock, weekStart]);

  const records: WeekRecords | null = useMemo(() => {
    if (!plan || !logs || !sessions || !weights) return null;
    return {
      plan,
      sessions,
      routes: logs.routes,
      wild: logs.wild,
      regen: logs.regen,
      checkins: model.checkins28,
      weights,
    };
  }, [plan, logs, sessions, weights, model.checkins28]);

  const scorecard = useMemo(() => (records ? buildScorecard(records) : null), [records]);
  const kcal = useMemo(
    () =>
      profile && weights
        ? kcalProposal({ points: weights, blockStart: profile.blockStart, today })
        : null,
    [profile, weights, today],
  );
  const decisions: CouncilDecisions | null = useMemo(() => {
    if (!plan || !profile) return null;
    return {
      template: template ?? profile.defaultTemplate ?? 'estandar',
      versions,
      wildKind,
      questions: questions ?? (scorecard ? suggestedQuestions(scorecard, model.advisories) : []),
      kcalAccepted,
    };
  }, [
    plan,
    profile,
    template,
    versions,
    wildKind,
    questions,
    scorecard,
    model.advisories,
    kcalAccepted,
  ]);
  const nextPlan = useMemo(
    () => (plan && decisions ? nextWeekPlan(plan, decisions) : null),
    [plan, decisions],
  );

  if (profile === undefined || (inBlock && (!records || !scorecard || !decisions)))
    return <Splash />;
  if (!profile || !plan || !records || !scorecard || !decisions) {
    return (
      <Screen title="Consejo de la Liga" back="/regen">
        <Card title="Fuera del Bloque 1">
          <p className="text-sm text-ink2">El Consejo evalúa semanas del bloque (1–12).</p>
        </Card>
      </Screen>
    );
  }

  const current = COUNCIL_STEPS[step];
  const weightAvg7 = movingAverage7(records.weights.filter((p) => p.date <= weekEnd)).slice(-1)[0]
    ?.value;

  async function close() {
    if (!plan || !decisions || !scorecard || !records || !profile) return;
    setBusy(true);
    try {
      if (nextPlan) await saveWeek(nextPlan);
      if (kcalAccepted && kcal && kcal.kind !== 'insufficient') {
        await saveAdjustment(toAdjustment(kcal, today));
      }
      const md = councilReport({
        profile,
        records,
        scorecard,
        nextPlan,
        advisories: model.advisories,
        kcal,
        questions: decisions.questions,
        weightAvg7,
      });
      await saveAdjustment({
        id: councilAdjustmentId(weekStart),
        date: today,
        kind: 'plan',
        detail: md,
        source: 'app',
      });
      setReport(md);
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    return (
      <Screen
        title="Informe para El Rival"
        eyebrow={`Semana ${plan.weekOfBlock}/${BLOCK_WEEKS}`}
        back="/regen"
      >
        <Card
          eyebrow="Consejo cerrado"
          title={nextPlan ? `Semana ${nextPlan.weekOfBlock} generada` : 'Final de Liga'}
        >
          <p className="text-sm text-ink2 mb-3">
            Pega el informe en Claude con «Actúa como El Rival según los documentos Performance
            Trainee» y recibirás la semana ajustada.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              full
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(report);
                  setCopied('Informe copiado al portapapeles.');
                } catch {
                  setCopied('No se pudo copiar: selecciona el texto de abajo.');
                }
              }}
            >
              Copiar informe
            </Button>
            {canShareFiles() && (
              <Button
                full
                variant="secondary"
                onClick={() =>
                  void shareText(
                    `consejo-semana-${plan.weekOfBlock}.md`,
                    report,
                    'Liga Híbrida',
                    'text/markdown',
                  )
                }
              >
                Compartir
              </Button>
            )}
            <Button
              full
              variant="secondary"
              onClick={() =>
                downloadText(`consejo-semana-${plan.weekOfBlock}.md`, report, 'text/markdown')
              }
            >
              Exportar .md
            </Button>
            <Button full variant="secondary" onClick={() => navigate('/regen/rival')}>
              Pregunta al Rival
            </Button>
            <Button
              full
              variant="secondary"
              onClick={async () => {
                const file = await exportAll();
                downloadText(exportFileName(new Date()), serializeExport(file));
                setCopied('Copia JSON exportada. Guárdala en Archivos o iCloud.');
              }}
            >
              Exportar copia JSON de la semana
            </Button>
            {copied && (
              <p role="status" className="text-sm text-status-ok">
                {copied}
              </p>
            )}
          </div>
        </Card>
        <Card eyebrow="Markdown" title="Informe">
          <pre className="text-xs text-ink2 whitespace-pre-wrap break-words" data-testid="report">
            {report}
          </pre>
        </Card>
        <Button full size="lg" onClick={() => navigate('/')}>
          Volver a HOY
        </Button>
      </Screen>
    );
  }

  const regenCounts = countRegen(records.regen);

  return (
    <Screen
      title="Consejo de la Liga"
      eyebrow={`Semana ${plan.weekOfBlock}/${BLOCK_WEEKS} · ${waveLabel(plan.wave)} · ${formatShort(weekStart)}–${formatShort(weekEnd)}`}
      back="/regen"
    >
      <Card
        eyebrow={`Paso ${step + 1} de ${COUNCIL_STEPS.length}`}
        title={current.title}
        right={<Pill tone="neutral">{current.id}</Pill>}
      >
        <p className="text-sm text-ink3 mb-3">{current.hint}</p>
        <Meter value={step + 1} max={COUNCIL_STEPS.length} showValue={false} height={6} />
      </Card>

      {step === 0 && (
        <Card eyebrow="Scorecard" title={`Adherencia ${scorecard.adherencePct} %`}>
          <ul className="flex flex-col gap-2" aria-label="Scorecard">
            {scorecard.metrics.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">
                  <span className="font-bold">{m.label}</span> · {m.value}{' '}
                  <span className="text-ink3">(objetivo {m.target})</span>
                </span>
                <Pill tone={LIGHT_TONE[m.light]}>
                  {m.light === 'none' ? 'SIN DATOS' : LIGHT_LABELS[m.light]}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {step === 1 && (
        <Card eyebrow="Anclas" title="2 Lower + 2 Upper">
          <p className="text-sm text-ink2 mb-3">
            Combates hechos:{' '}
            {records.sessions.filter((s) => s.date >= weekStart && s.date <= weekEnd).length}.
            Versión de cada gimnasio la semana que viene:
          </p>
          <div className="flex flex-col gap-3">
            {GYM_ORDER.map((g) => (
              <Segmented
                key={g}
                label={GYM_NAMES[g]}
                value={versions[g] ?? templateVersion(nextPlan, g)}
                onChange={(v) => setVersions((cur) => ({ ...cur, [g]: v }))}
                options={VERSIONS}
              />
            ))}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card eyebrow="Motor" title={`${scorecard.z2Minutes}' Z2 esta semana`}>
          <p className="text-sm text-ink2">
            Ruta más larga: {scorecard.longestRouteMin || '—'}&apos;. Objetivo 90–150&apos;/sem
            fáciles (SMART 5).
          </p>
          {nextPlan && (
            <p className="text-sm text-ink2 mt-2">
              Semana que viene ({waveLabel(nextPlan.wave)}):{' '}
              {deloadSummary(nextPlan.wave)[2] ?? 'rutas Z2 según la plantilla.'}
            </p>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card eyebrow="Aventura" title="Zona Salvaje del sábado">
          <p className="text-sm text-ink2 mb-3">
            Aventuras esta semana: {records.wild.length}. Regla 4: el sábado manda; si sale intensa,
            viernes PM se elimina y domingo es recuperación real.
          </p>
          <Segmented
            label="Deporte previsto"
            value={wildKind}
            onChange={setWildKind}
            options={WILD}
            columns={4}
          />
        </Card>
      )}

      {step === 4 && (
        <Card eyebrow="Comida · R7" title={kcal ? kcal.decision : 'Semanas 1–2: solo medir'}>
          <p className="text-sm text-ink2">
            {kcal ? kcal.text : 'Registrar comida y pesarse 5–7 días/sem al levantarse.'}
          </p>
          {kcal && kcal.kind !== 'insufficient' && (
            <label className="mt-3 flex items-center gap-3 min-h-touch">
              <input
                type="checkbox"
                className="w-5 h-5"
                checked={kcalAccepted}
                onChange={(e) => setKcalAccepted(e.target.checked)}
              />
              <span className="text-sm text-ink font-bold">Anotar el ajuste al cerrar</span>
            </label>
          )}
        </Card>
      )}

      {step === 5 && (
        <Card eyebrow="Recuperación" title="Sueño, síntomas y microdosis">
          <ul className="text-sm text-ink2 flex flex-col gap-1">
            <li>· Sueño: {scorecard.metrics.find((m) => m.id === 'sleep')?.value}</li>
            <li>· Dolor: {scorecard.metrics.find((m) => m.id === 'pain')?.value}</li>
            <li>
              · Yoga/movilidad {regenCounts.mobility}/{WEEKLY_TARGETS.mobility} · muñeca{' '}
              {regenCounts.wrist}/{WEEKLY_TARGETS.wrist} · aductor {regenCounts.adductor}/
              {WEEKLY_TARGETS.adductor} · regenerativa {regenCounts.regenerative}/
              {WEEKLY_TARGETS.regenerative}
            </li>
          </ul>
          {model.advisories.length > 0 && (
            <ul className="mt-3 text-sm text-ink flex flex-col gap-1">
              {model.advisories.map((a) => (
                <li key={a.id ?? a.message}>
                  <span className="font-bold">Nivel {a.level}:</span> {a.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {step === 6 && (
        <>
          <Card eyebrow="Plan B" title="Plantilla de la semana que viene">
            <Segmented
              value={decisions.template}
              onChange={setTemplate}
              options={TEMPLATES}
              columns={2}
            />
            {nextPlan ? (
              <div className="mt-3">
                <Eyebrow className="block mb-1">
                  Semana {nextPlan.weekOfBlock}/{BLOCK_WEEKS} · {waveLabel(nextPlan.wave)} ·{' '}
                  {formatShort(nextPlan.weekStart)}
                </Eyebrow>
                <ul
                  className="text-sm text-ink2 flex flex-col gap-0.5"
                  aria-label="Semana siguiente"
                >
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((d) => (
                    <li key={d}>
                      <span className="font-pixel text-[10px] tracking-[1px] text-ink3 mr-2">
                        {DAY_SHORT_ES[d]}
                      </span>
                      {nextPlan.days[d].am ? plannedItemLabel(nextPlan.days[d].am!) : '—'} ·{' '}
                      {nextPlan.days[d].pm ? plannedItemLabel(nextPlan.days[d].pm!) : '—'}
                    </li>
                  ))}
                </ul>
                {logs?.next && (
                  <p className="text-xs text-status-cargado mt-2">
                    Ya existe una semana {logs.next.weekOfBlock} guardada: cerrar el Consejo la
                    sustituye.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink2 mt-3">Fin del Bloque 1: Final de Liga.</p>
            )}
          </Card>
          <Card eyebrow="Para El Rival" title="3 preguntas abiertas">
            <div className="flex flex-col gap-2">
              {decisions.questions.map((q, i) => (
                <input
                  key={i}
                  className="input"
                  aria-label={`Pregunta ${i + 1}`}
                  value={q}
                  onChange={(e) => {
                    const next = [...decisions.questions];
                    next[i] = e.target.value;
                    setQuestions(next);
                  }}
                  placeholder={`Pregunta ${i + 1}`}
                />
              ))}
            </div>
          </Card>
        </>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Anterior
        </Button>
        {step < COUNCIL_STEPS.length - 1 ? (
          <Button full onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button full onClick={close} disabled={busy}>
            Cerrar el Consejo
          </Button>
        )}
      </div>
    </Screen>
  );
}

function templateVersion(plan: ReturnType<typeof nextWeekPlan>, gymId: GymId): SessionVersion {
  if (!plan) return 60;
  for (const d of [0, 1, 2, 3, 4, 5, 6] as const) {
    for (const item of [plan.days[d].am, plan.days[d].pm]) {
      if (item?.kind === 'gym' && item.gymId === gymId) return item.version;
    }
  }
  return 60;
}
