// Combate de Liga wizard (SPEC §6.10, §8.5): the 6 areas, previous values next to each field and
// the comparison with the previous test after saving.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Eyebrow,
  Meter,
  Pill,
  Screen,
  Segmented,
  Splash,
  Stepper,
} from '@/components';
import { saveTest } from '@/data';
import { LEAGUE_TEST_AREAS } from '@/domain/content/tests';
import { ROUTE_KIND_LABELS } from '@/domain/content/routes';
import { compareTests, testWeekFor, weightAt, weightPoints } from '@/domain/rules/league';
import type { LeagueTest, LeagueTestWeek, RouteKind } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { formatKg } from '@/lib/format';
import { testTitle } from './testTitle';
import { useLeague } from './useLeague';

const WEEKS: LeagueTestWeek[] = [0, 4, 8, 12];
const WEEK_OPTIONS = WEEKS.map((w) => ({ value: w, label: w === 0 ? 'S0' : `S${w}` }));
const ROUTE_OPTIONS = (Object.keys(ROUTE_KIND_LABELS) as RouteKind[]).map((k) => ({
  value: k,
  label: ROUTE_KIND_LABELS[k],
}));
type Verdict = 'mejor' | 'igual' | 'peor';
const VERDICT_OPTIONS: { value: Verdict; label: string }[] = [
  { value: 'mejor', label: 'Mejor' },
  { value: 'igual', label: 'Igual' },
  { value: 'peor', label: 'Peor' },
];

interface Draft {
  weightAvg7: number;
  waistCm: number;
  note: string;
  pullupLoad: number;
  pullupReps: number;
  dipLoad: number;
  dipReps: number;
  splitLoadL: number;
  splitRepsL: number;
  splitLoadR: number;
  splitRepsR: number;
  bilateralNote: string;
  routeKind: RouteKind;
  routeMinutes: number;
  routeRpe: number;
  hrAvg: number;
  wallSec: number;
  freeSec: number;
  videoNote: string;
  ankleCm: number;
  wristExtDeg: number;
  hip: Verdict | undefined;
  shoulder: Verdict | undefined;
  transfer: Verdict | undefined;
  transferText: string;
}

function verdictOf(note: string | undefined): Verdict | undefined {
  const t = note?.trim().toLowerCase() ?? '';
  return (['mejor', 'igual', 'peor'] as Verdict[]).find((v) => t.startsWith(v));
}

function textAfterVerdict(note: string | undefined): string {
  if (!note) return '';
  const idx = note.indexOf('·');
  return idx >= 0 ? note.slice(idx + 1).trim() : verdictOf(note) ? '' : note;
}

function draftFrom(existing: LeagueTest | undefined, weightAvg7: number | undefined): Draft {
  const sideBest = (side: 'L' | 'R') =>
    existing?.splitSquat
      ?.filter((s) => s.side === side)
      .sort((a, b) => b.loadKg * b.reps - a.loadKg * a.reps)[0];
  const l = sideBest('L');
  const r = sideBest('R');
  return {
    weightAvg7: existing?.weightAvg7 ?? weightAvg7 ?? 0,
    waistCm: existing?.waistCm ?? 0,
    note: existing?.note ?? '',
    pullupLoad: existing?.pullupRir2?.loadKg ?? 0,
    pullupReps: existing?.pullupRir2?.reps ?? 0,
    dipLoad: existing?.dipRir2?.loadKg ?? 20,
    dipReps: existing?.dipRir2?.reps ?? 0,
    splitLoadL: l?.loadKg ?? 0,
    splitRepsL: l?.reps ?? 0,
    splitLoadR: r?.loadKg ?? 0,
    splitRepsR: r?.reps ?? 0,
    bilateralNote: existing?.bilateralNote ?? '',
    routeKind: existing?.z2Standard?.routeKind ?? 'run',
    routeMinutes: existing?.z2Standard?.minutes ?? 45,
    routeRpe: existing?.z2Standard?.rpe ?? 5,
    hrAvg: existing?.z2Standard?.hrAvg ?? 0,
    wallSec: existing?.handstand?.wallSec ?? 0,
    freeSec: existing?.handstand?.freeSec ?? 0,
    videoNote: existing?.handstand?.videoNote ?? '',
    ankleCm: existing?.mobility?.ankleCm ?? 0,
    wristExtDeg: existing?.mobility?.wristExtDeg ?? 0,
    hip: verdictOf(existing?.mobility?.hipNote),
    shoulder: verdictOf(existing?.mobility?.shoulderNote),
    transfer: verdictOf(existing?.transferNote),
    transferText: textAfterVerdict(existing?.transferNote),
  };
}

function joinNote(verdict: Verdict | undefined, text: string): string | undefined {
  const t = text.trim();
  if (!verdict) return t || undefined;
  return t ? `${verdict} · ${t}` : verdict;
}

function toTest(d: Draft, id: string, date: string, weekOfBlock: LeagueTestWeek): LeagueTest {
  const split = [
    d.splitRepsL > 0 ? { loadKg: d.splitLoadL, reps: d.splitRepsL, side: 'L' as const } : null,
    d.splitRepsR > 0 ? { loadKg: d.splitLoadR, reps: d.splitRepsR, side: 'R' as const } : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
  const mobility = {
    ankleCm: d.ankleCm > 0 ? d.ankleCm : undefined,
    wristExtDeg: d.wristExtDeg > 0 ? d.wristExtDeg : undefined,
    hipNote: d.hip,
    shoulderNote: d.shoulder,
  };
  const hasMobility = Object.values(mobility).some((v) => v !== undefined);
  return {
    id,
    date,
    weekOfBlock,
    weightAvg7: d.weightAvg7 > 0 ? d.weightAvg7 : undefined,
    waistCm: d.waistCm > 0 ? d.waistCm : undefined,
    note: d.note.trim() || undefined,
    pullupRir2: d.pullupReps > 0 ? { loadKg: d.pullupLoad, reps: d.pullupReps } : undefined,
    dipRir2: d.dipReps > 0 ? { loadKg: d.dipLoad, reps: d.dipReps } : undefined,
    splitSquat: split.length > 0 ? split : undefined,
    bilateralNote: d.bilateralNote.trim() || undefined,
    z2Standard:
      d.routeMinutes > 0
        ? {
            routeKind: d.routeKind,
            minutes: d.routeMinutes,
            rpe: d.routeRpe,
            hrAvg: d.hrAvg > 0 ? d.hrAvg : undefined,
          }
        : undefined,
    handstand:
      d.wallSec > 0 || d.freeSec > 0
        ? {
            wallSec: d.wallSec,
            freeSec: d.freeSec > 0 ? d.freeSec : undefined,
            videoNote: d.videoNote.trim() || undefined,
          }
        : undefined,
    mobility: hasMobility ? mobility : undefined,
    transferNote: joinNote(d.transfer, d.transferText),
  };
}

function Previous({ label }: { label?: string }) {
  if (!label) return null;
  return <p className="text-xs text-ink3 mt-1">Anterior: {label}</p>;
}

export function LeagueTestScreen() {
  const navigate = useNavigate();
  const league = useLeague();
  const input = league.input;
  const tests = useMemo(
    () => [...(input?.tests ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [input],
  );
  const wob = league.summary?.weekOfBlock ?? 0;
  const suggested = useMemo(() => {
    const w = testWeekFor(wob, tests);
    if (w !== null) return w;
    const next = WEEKS.find((x) => x >= wob && x > 0);
    return next ?? 12;
  }, [wob, tests]);
  const [week, setWeek] = useState<LeagueTestWeek | null>(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<LeagueTest | null>(null);
  const [busy, setBusy] = useState(false);

  if (league.loading || !input) return <Splash />;

  const currentWeek: LeagueTestWeek = week ?? suggested;
  const existing = tests.find((t) => t.weekOfBlock === currentWeek);
  const previous = [...tests].reverse().find((t) => t.weekOfBlock < currentWeek);
  const avg7 = weightAt(weightPoints(input.checkins), input.today);
  const d = draft ?? draftFrom(existing, avg7);
  const set = (patch: Partial<Draft>) => setDraft({ ...d, ...patch });
  const area = LEAGUE_TEST_AREAS[step];
  const prevLabel = (fn: (t: LeagueTest) => string | undefined) =>
    previous ? fn(previous) : undefined;
  const baselines = input.profile.baselines;

  function changeWeek(w: LeagueTestWeek) {
    setWeek(w);
    setDraft(null);
    setStep(0);
  }

  async function save() {
    setBusy(true);
    try {
      const test = toTest(d, existing?.id ?? `t_${currentWeek}`, input!.today, currentWeek);
      await saveTest(test);
      setSaved(test);
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    const rows = compareTests(saved, previous).filter(
      (r) => r.current !== '—' || r.previous !== '—',
    );
    return (
      <Screen title="Combate de Liga" eyebrow={testTitle(saved)} back="/liga">
        <Card
          eyebrow="Guardado"
          title={previous ? `Comparación con ${testTitle(previous).toLowerCase()}` : 'Primer test'}
        >
          {rows.length === 0 ? (
            <p className="text-sm text-ink2">Sin marcadores registrados.</p>
          ) : (
            <table className="w-full text-sm" aria-label="Comparación">
              <thead>
                <tr className="text-left">
                  <th className="eyebrow font-normal pb-1">Marcador</th>
                  <th className="eyebrow font-normal pb-1">Hoy</th>
                  <th className="eyebrow font-normal pb-1">Anterior</th>
                  <th className="eyebrow font-normal pb-1">Δ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <td className="py-1 pr-2 text-ink">{r.label}</td>
                    <td className="py-1 pr-2 text-ink2">{r.current}</td>
                    <td className="py-1 pr-2 text-ink3">{r.previous}</td>
                    <td
                      className={`py-1 font-bold ${r.better === true ? 'text-status-ok' : r.better === false ? 'text-status-cargado' : 'text-ink3'}`}
                    >
                      {r.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Button full size="lg" onClick={() => navigate('/liga')}>
          Volver a la Liga
        </Button>
      </Screen>
    );
  }

  return (
    <Screen
      title="Combate de Liga"
      eyebrow={`${testTitle({ weekOfBlock: currentWeek })} · ${formatShort(input.today)}`}
      back="/liga"
    >
      <Card
        eyebrow={`Apartado ${step + 1} de ${LEAGUE_TEST_AREAS.length}`}
        title={area.name}
        right={existing ? <Pill tone="neutral">editando</Pill> : undefined}
      >
        <p className="text-sm text-ink3 mb-3">{area.test}</p>
        <Meter value={step + 1} max={LEAGUE_TEST_AREAS.length} showValue={false} height={6} />
        {step === 0 && (
          <div className="mt-3">
            <Segmented
              label="Semana del test"
              value={currentWeek}
              onChange={changeWeek}
              options={WEEK_OPTIONS}
            />
            <p className="text-xs text-ink3 mt-1">
              S0 = baseline (semanas 1–2). Un test de la misma semana se sobrescribe.
            </p>
          </div>
        )}
      </Card>

      {step === 0 && (
        <Card eyebrow="Composición" title="Peso medio 7 d y cintura">
          <Stepper
            label="Peso medio 7 días (kg)"
            value={d.weightAvg7}
            onChange={(v) => set({ weightAvg7: v })}
            step={0.1}
            min={0}
            max={150}
            unit="kg"
            hint={
              avg7 !== undefined
                ? `Calculado de tus pesos: ${formatKg(avg7)} kg`
                : 'Sin pesos recientes'
            }
          />
          <Previous
            label={prevLabel((t) => (t.weightAvg7 ? `${formatKg(t.weightAvg7)} kg` : undefined))}
          />
          <Stepper
            label="Cintura (cm)"
            value={d.waistCm}
            onChange={(v) => set({ waistCm: v })}
            step={0.5}
            min={0}
            max={150}
            unit="cm"
            className="mt-3"
            hint="0 = sin medir"
          />
          <Previous label={prevLabel((t) => (t.waistCm ? `${t.waistCm} cm` : undefined))} />
          <label className="block mt-3">
            <span className="eyebrow block mb-1">Fotos y notas (fuera de la app)</span>
            <input
              className="input"
              value={d.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="3 fotos comparables hechas, misma luz"
            />
          </label>
        </Card>
      )}

      {step === 1 && (
        <Card eyebrow="Torso" title="Dominada y fondo lastrado a RIR 2">
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Dominada lastre (kg)"
              value={d.pullupLoad}
              onChange={(v) => set({ pullupLoad: v })}
              step={2.5}
              min={0}
              max={100}
              unit="kg"
            />
            <Stepper
              label="Dominada reps"
              value={d.pullupReps}
              onChange={(v) => set({ pullupReps: v })}
              step={1}
              min={0}
              max={30}
              inputMode="numeric"
            />
          </div>
          <Previous
            label={
              prevLabel((t) =>
                t.pullupRir2
                  ? `${formatKg(t.pullupRir2.loadKg)} kg × ${t.pullupRir2.reps}`
                  : undefined,
              ) ??
              (baselines.weighted_pullup
                ? `baseline ${formatKg(baselines.weighted_pullup.loadKg)} kg × ${baselines.weighted_pullup.reps}`
                : undefined)
            }
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stepper
              label="Fondo lastre (kg)"
              value={d.dipLoad}
              onChange={(v) => set({ dipLoad: v })}
              step={2.5}
              min={0}
              max={100}
              unit="kg"
            />
            <Stepper
              label="Fondo reps"
              value={d.dipReps}
              onChange={(v) => set({ dipReps: v })}
              step={1}
              min={0}
              max={30}
              inputMode="numeric"
            />
          </div>
          <Previous
            label={
              prevLabel((t) =>
                t.dipRir2 ? `${formatKg(t.dipRir2.loadKg)} kg × ${t.dipRir2.reps}` : undefined,
              ) ??
              (baselines.weighted_dip
                ? `baseline ${formatKg(baselines.weighted_dip.loadKg)} kg × ${baselines.weighted_dip.reps}`
                : undefined)
            }
          />
          <p className="text-xs text-ink3 mt-2">Reps 0 = apartado no medido.</p>
        </Card>
      )}

      {step === 2 && (
        <Card eyebrow="Piernas" title="Split squat o step-up por lado">
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Izquierda carga (kg)"
              value={d.splitLoadL}
              onChange={(v) => set({ splitLoadL: v })}
              step={2}
              min={0}
              max={100}
              unit="kg"
            />
            <Stepper
              label="Izquierda reps"
              value={d.splitRepsL}
              onChange={(v) => set({ splitRepsL: v })}
              step={1}
              min={0}
              max={30}
              inputMode="numeric"
            />
            <Stepper
              label="Derecha carga (kg)"
              value={d.splitLoadR}
              onChange={(v) => set({ splitLoadR: v })}
              step={2}
              min={0}
              max={100}
              unit="kg"
            />
            <Stepper
              label="Derecha reps"
              value={d.splitRepsR}
              onChange={(v) => set({ splitRepsR: v })}
              step={1}
              min={0}
              max={30}
              inputMode="numeric"
            />
          </div>
          <Previous
            label={
              prevLabel((t) =>
                t.splitSquat && t.splitSquat.length > 0
                  ? t.splitSquat
                      .map((s) => `${s.side} ${formatKg(s.loadKg)} kg × ${s.reps}`)
                      .join(' · ')
                  : undefined,
              ) ??
              (baselines.bulgarian_split_squat
                ? `baseline ${formatKg(baselines.bulgarian_split_squat.loadKg)} kg × ${baselines.bulgarian_split_squat.reps}`
                : undefined)
            }
          />
          <label className="block mt-3">
            <span className="eyebrow block mb-1">Patrón bilateral técnico</span>
            <input
              className="input"
              value={d.bilateralNote}
              onChange={(e) => set({ bilateralNote: e.target.value })}
              placeholder="Goblet o hack squat: técnica, calambre, profundidad"
            />
          </label>
        </Card>
      )}

      {step === 3 && (
        <Card eyebrow="Motor" title="Ruta fácil estándar">
          <Segmented
            label="Tipo"
            value={d.routeKind}
            onChange={(v) => set({ routeKind: v })}
            options={ROUTE_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stepper
              label="Minutos"
              value={d.routeMinutes}
              onChange={(v) => set({ routeMinutes: v })}
              step={5}
              min={0}
              max={300}
              inputMode="numeric"
            />
            <Stepper
              label="RPE 1–10"
              value={d.routeRpe}
              onChange={(v) => set({ routeRpe: v })}
              step={1}
              min={1}
              max={10}
              inputMode="numeric"
            />
          </div>
          <Stepper
            label="FC media (ppm)"
            value={d.hrAvg}
            onChange={(v) => set({ hrAvg: v })}
            step={1}
            min={0}
            max={230}
            inputMode="numeric"
            className="mt-3"
            hint="0 = sin pulsómetro"
          />
          <Previous
            label={prevLabel((t) =>
              t.z2Standard
                ? `${ROUTE_KIND_LABELS[t.z2Standard.routeKind]} ${t.z2Standard.minutes}' RPE ${t.z2Standard.rpe}${t.z2Standard.hrAvg ? ` · ${t.z2Standard.hrAvg} ppm` : ''}`
                : undefined,
            )}
          />
        </Card>
      )}

      {step === 4 && (
        <Card eyebrow="Control" title="Handstand y rangos">
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Pared (s)"
              value={d.wallSec}
              onChange={(v) => set({ wallSec: v })}
              step={5}
              min={0}
              max={300}
              inputMode="numeric"
            />
            <Stepper
              label="Libre (s)"
              value={d.freeSec}
              onChange={(v) => set({ freeSec: v })}
              step={1}
              min={0}
              max={120}
              inputMode="numeric"
            />
          </div>
          <Previous
            label={prevLabel((t) =>
              t.handstand
                ? `pared ${t.handstand.wallSec} s${t.handstand.freeSec ? ` · libre ${t.handstand.freeSec} s` : ''}`
                : undefined,
            )}
          />
          <label className="block mt-3">
            <span className="eyebrow block mb-1">Nota del vídeo</span>
            <input
              className="input"
              value={d.videoNote}
              onChange={(e) => set({ videoNote: e.target.value })}
              placeholder="Línea, hombros, respiración"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stepper
              label="Tobillo knee-to-wall (cm)"
              value={d.ankleCm}
              onChange={(v) => set({ ankleCm: v })}
              step={0.5}
              min={0}
              max={30}
              unit="cm"
            />
            <Stepper
              label="Extensión muñeca (°)"
              value={d.wristExtDeg}
              onChange={(v) => set({ wristExtDeg: v })}
              step={5}
              min={0}
              max={120}
              inputMode="numeric"
            />
          </div>
          <Previous
            label={prevLabel((t) =>
              t.mobility
                ? [
                    t.mobility.ankleCm !== undefined ? `tobillo ${t.mobility.ankleCm} cm` : null,
                    t.mobility.wristExtDeg !== undefined
                      ? `muñeca ${t.mobility.wristExtDeg}°`
                      : null,
                    t.mobility.hipNote ? `cadera ${t.mobility.hipNote}` : null,
                    t.mobility.shoulderNote ? `hombro ${t.mobility.shoulderNote}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined,
            )}
          />
          <Segmented
            label="Cadera vs test anterior"
            value={d.hip}
            onChange={(v) => set({ hip: v })}
            options={VERDICT_OPTIONS}
            className="mt-3"
          />
          <Segmented
            label="Hombro vs test anterior"
            value={d.shoulder}
            onChange={(v) => set({ shoulder: v })}
            options={VERDICT_OPTIONS}
            className="mt-3"
          />
        </Card>
      )}

      {step === 5 && (
        <Card eyebrow="Transferencia" title="MTB, escalada, surf/skate">
          <Segmented
            label="¿Mejor, igual o peor?"
            value={d.transfer}
            onChange={(v) => set({ transfer: v })}
            options={VERDICT_OPTIONS}
          />
          <label className="block mt-3">
            <span className="eyebrow block mb-1">Nota</span>
            <input
              className="input"
              value={d.transferText}
              onChange={(e) => set({ transferText: e.target.value })}
              placeholder="MTB con más piernas en las subidas…"
            />
          </label>
          <Previous label={prevLabel((t) => t.transferNote)} />
          <Eyebrow className="block mt-3">
            Al guardar verás la comparación con{' '}
            {previous ? testTitle(previous) : 'el siguiente test'}.
          </Eyebrow>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Anterior
        </Button>
        {step < LEAGUE_TEST_AREAS.length - 1 ? (
          <Button full onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button full onClick={() => void save()} disabled={busy}>
            Guardar Combate de Liga
          </Button>
        )}
      </div>
    </Screen>
  );
}
