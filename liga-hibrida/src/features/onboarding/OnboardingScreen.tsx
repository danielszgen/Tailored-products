// "Semana 0" — one-time onboarding (SPEC §8.1). Creates the Profile, week 1 and the 4 medals.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Segmented, Stepper } from '@/components';
import { BrandMark } from '@/brand/icons';
import { ensureMedals, ensureWeek, saveProfile } from '@/data';
import { DEFAULT_BLOCK_START } from '@/domain/content/block';
import { dayIndexOf } from '@/lib/date';
import type { Profile } from '@/domain/types';
import { ImportJson } from '@/features/regen/ImportJson';

interface BaselineDraft {
  loadKg: number;
  reps: number;
}

const BASELINE_FIELDS: readonly { id: string; label: string; step: number }[] = [
  { id: 'bench_press', label: 'Press banca', step: 2.5 },
  { id: 'weighted_pullup', label: 'Dominada lastrada (lastre)', step: 2.5 },
  { id: 'weighted_dip', label: 'Fondos lastrados (lastre)', step: 2.5 },
  { id: 'trap_bar_deadlift', label: 'Trap bar', step: 5 },
  { id: 'bulgarian_split_squat', label: 'Split squat (por mano)', step: 2 },
];

const STEPS = ['Entrenador', 'Liga', 'Marcas', 'Combustible', 'Ficha'] as const;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DECISION: D1 name, D6 targets/baselines, D7 windows, D12 units, D13 block start.
  const [name, setName] = useState('Daniel');
  const [heightCm, setHeightCm] = useState(190);
  const [weightKg, setWeightKg] = useState(0); // 0 = not provided
  const [targetLow, setTargetLow] = useState(85); // DECISION: D6
  const [targetHigh, setTargetHigh] = useState(88); // DECISION: D6
  const [blockStart, setBlockStart] = useState(DEFAULT_BLOCK_START); // DECISION: D13
  const [amWindow, setAmWindow] = useState<[string, string]>(['07:00', '09:00']); // DECISION: D7
  const [pmWindow, setPmWindow] = useState<[string, string]>(['19:00', '21:00']); // DECISION: D7
  const [baselines, setBaselines] = useState<Record<string, BaselineDraft>>({
    weighted_dip: { loadKg: 20, reps: 0 }, // DECISION: D6 (+20 kg reference)
  });
  const [calorieMode, setCalorieMode] = useState<'contar' | 'porciones'>('porciones'); // DECISION: pending (Apéndice A.10)
  const [dietNotes, setDietNotes] = useState('');

  const blockStartIsMonday = blockStart.length === 10 && dayIndexOf(blockStart) === 0;

  const setBaseline = (id: string, patch: Partial<BaselineDraft>) =>
    setBaselines((prev) => ({
      ...prev,
      [id]: { loadKg: prev[id]?.loadKg ?? 0, reps: prev[id]?.reps ?? 0, ...patch },
    }));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const stored: Profile['baselines'] = {};
      for (const f of BASELINE_FIELDS) {
        const b = baselines[f.id];
        if (b && b.reps > 0) stored[f.id] = { loadKg: b.loadKg, reps: b.reps, date: blockStart };
      }
      await saveProfile({
        name: name.trim() || 'Entrenador',
        heightCm,
        startWeightKg: weightKg > 0 ? weightKg : undefined,
        targetWeightKg: [targetLow, targetHigh],
        amWindow,
        pmWindow,
        blockStart,
        form: 1,
        baselines: stored,
        calorieMode,
        dietNotes: dietNotes.trim() || undefined,
        defaultTemplate: 'estandar',
      });
      await ensureWeek({ weekStart: blockStart, weekOfBlock: 1, template: 'estandar' });
      await ensureMedals();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la ficha.');
      setSaving(false);
    }
  }

  const canContinue = step !== 1 || blockStartIsMonday;

  return (
    <div className="min-h-dvh bg-bg text-ink safe-top safe-bottom">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <BrandMark size={40} />
          <div>
            <Eyebrow>
              Semana 0 · paso {step + 1} de {STEPS.length}
            </Eyebrow>
            <h1 className="display text-2xl leading-tight">{STEPS[step]}</h1>
          </div>
        </header>

        <ol className="flex gap-1.5" aria-label="Progreso">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? 'step' : undefined}
              className={`h-1.5 flex-1 rounded-pill ${i <= step ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </ol>

        {step === 0 && (
          <Card>
            <p className="text-sm text-ink2 mb-4">
              Liga Híbrida convierte tu sistema de entrenamiento en un juego de entrenador. Cada día
              te dice qué toca (sesión AM/PM), en qué estado estás (PV y OK / CARGADO / KO) y cómo
              comer (Combustible). Tú eres el Entrenador y el que evoluciona: cuatro Gimnasios, una
              Liga de 12 semanas y un Consejo cada domingo.
            </p>
            <label className="block mb-3">
              <span className="eyebrow block mb-1">Nombre del entrenador</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
            </label>
            <Stepper
              label="Altura"
              value={heightCm}
              onChange={setHeightCm}
              step={1}
              min={140}
              max={220}
              unit="cm"
              inputMode="numeric"
              className="mb-3"
            />
            <Stepper
              label="Peso actual (opcional)"
              value={weightKg}
              onChange={setWeightKg}
              step={0.1}
              min={0}
              max={150}
              unit="kg"
              hint="Déjalo en 0 si prefieres pesarte mañana al despertar."
            />
            <div className="mt-4 border-t border-line pt-3">
              <Eyebrow className="block mb-2">¿Ya tienes una copia de seguridad?</Eyebrow>
              <ImportJson
                label="Restaurar copia JSON"
                variant="ghost"
                onImported={() => navigate('/', { replace: true })}
              />
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Stepper
                label="Objetivo mínimo"
                value={targetLow}
                onChange={setTargetLow}
                step={0.5}
                min={60}
                max={120}
                unit="kg"
              />
              <Stepper
                label="Objetivo máximo"
                value={targetHigh}
                onChange={setTargetHigh}
                step={0.5}
                min={60}
                max={120}
                unit="kg"
              />
            </div>
            <label className="block mb-3">
              <span className="eyebrow block mb-1">Inicio del bloque (lunes)</span>
              <input
                className="input"
                type="date"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
              />
              {!blockStartIsMonday && (
                <span className="block text-xs text-status-ko mt-1">
                  La semana empieza en lunes: elige un lunes.
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="eyebrow block mb-1">Ventana AM · desde</span>
                <input
                  className="input"
                  type="time"
                  value={amWindow[0]}
                  onChange={(e) => setAmWindow([e.target.value, amWindow[1]])}
                />
              </label>
              <label className="block">
                <span className="eyebrow block mb-1">AM · hasta</span>
                <input
                  className="input"
                  type="time"
                  value={amWindow[1]}
                  onChange={(e) => setAmWindow([amWindow[0], e.target.value])}
                />
              </label>
              <label className="block">
                <span className="eyebrow block mb-1">Ventana PM · desde</span>
                <input
                  className="input"
                  type="time"
                  value={pmWindow[0]}
                  onChange={(e) => setPmWindow([e.target.value, pmWindow[1]])}
                />
              </label>
              <label className="block">
                <span className="eyebrow block mb-1">PM · hasta</span>
                <input
                  className="input"
                  type="time"
                  value={pmWindow[1]}
                  onChange={(e) => setPmWindow([pmWindow[0], e.target.value])}
                />
              </label>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <p className="text-sm text-ink2 mb-3">
              Marcas de partida opcionales. Deja las repeticiones en 0 si aún no las tienes: la
              ficha se cierra en las semanas 1–2. Fondos +20 kg es una referencia, no una
              obligación.
            </p>
            <div className="flex flex-col gap-4">
              {BASELINE_FIELDS.map((f) => (
                <div key={f.id} className="grid grid-cols-2 gap-2">
                  <Stepper
                    label={f.label}
                    value={baselines[f.id]?.loadKg ?? 0}
                    onChange={(v) => setBaseline(f.id, { loadKg: v })}
                    step={f.step}
                    min={0}
                    max={400}
                    unit="kg"
                  />
                  <Stepper
                    label="Reps"
                    value={baselines[f.id]?.reps ?? 0}
                    onChange={(v) => setBaseline(f.id, { reps: v })}
                    step={1}
                    min={0}
                    max={30}
                    inputMode="numeric"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <Segmented
              label="¿Cómo quieres seguir la comida?"
              value={calorieMode}
              onChange={setCalorieMode}
              options={[
                { value: 'porciones', label: 'Porciones (visual)' },
                { value: 'contar', label: 'Contar calorías' },
              ]}
              className="mb-4"
            />
            <label className="block">
              <span className="eyebrow block mb-1">Intolerancias y preferencias</span>
              <textarea
                className="input min-h-[96px] py-2"
                value={dietNotes}
                onChange={(e) => setDietNotes(e.target.value)}
                placeholder="Alimentos que no quieres usar, horarios, notas…"
              />
            </label>
          </Card>
        )}

        {step === 4 && (
          <Card eyebrow="Resumen" title={`${name || 'Entrenador'} · Forma I`}>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-ink3">Altura</dt>
              <dd className="text-ink">{heightCm} cm</dd>
              <dt className="text-ink3">Peso</dt>
              <dd className="text-ink">
                {weightKg > 0 ? `${weightKg.toFixed(1).replace('.', ',')} kg` : 'mañana'}
              </dd>
              <dt className="text-ink3">Objetivo</dt>
              <dd className="text-ink">
                {targetLow}–{targetHigh} kg
              </dd>
              <dt className="text-ink3">Bloque 1</dt>
              <dd className="text-ink">desde {blockStart}</dd>
              <dt className="text-ink3">Ventanas</dt>
              <dd className="text-ink">
                AM {amWindow[0]}–{amWindow[1]} · PM {pmWindow[0]}–{pmWindow[1]}
              </dd>
              <dt className="text-ink3">Marcas</dt>
              <dd className="text-ink">
                {BASELINE_FIELDS.filter((f) => (baselines[f.id]?.reps ?? 0) > 0).length} de 5
              </dd>
              <dt className="text-ink3">Comida</dt>
              <dd className="text-ink">{calorieMode === 'contar' ? 'Contar' : 'Porciones'}</dd>
            </dl>
            <p className="text-xs text-ink3 mt-4">
              Tus datos son de salud: se guardan solo en este dispositivo y puedes exportarlos
              cuando quieras.
            </p>
            {error && (
              <p className="text-sm text-status-ko mt-3" role="alert">
                {error}
              </p>
            )}
          </Card>
        )}

        <div className="flex gap-2 mt-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              Atrás
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button full onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Siguiente
            </Button>
          ) : (
            <Button full size="lg" onClick={submit} disabled={saving}>
              {saving ? 'Creando…' : 'Crear ficha'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
