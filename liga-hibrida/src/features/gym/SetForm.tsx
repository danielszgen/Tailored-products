// One-hand set logging: load ± step, reps (or seconds), RIR, side (SPEC §8.3).
import { useState } from 'react';
import { Button, Segmented, Stepper } from '@/components';
import type { ExerciseSpec, GymId, SetLog } from '@/domain/types';
import type { LoadSuggestion } from './suggestion';
import { rirTargetEnd } from './suggestion';

export interface SetFormProps {
  spec: ExerciseSpec;
  gymId: GymId;
  suggestion: LoadSuggestion;
  lastSet?: SetLog;
  rirTarget: number | [number, number];
  disabled?: boolean;
  onSave: (set: Omit<SetLog, 'setIndex'>) => void;
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

export function SetForm({
  spec,
  gymId,
  suggestion,
  lastSet,
  rirTarget,
  disabled,
  onSave,
}: SetFormProps) {
  const lower = gymId === 'cantera' || gymId === 'resorte';
  const step = spec.loadStepKg || 1;
  const [loadKg, setLoadKg] = useState<number>(lastSet?.loadKg ?? suggestion.loadKg ?? 0);
  const [reps, setReps] = useState<number>(lastSet?.reps ?? suggestion.reps ?? spec.repMin);
  const [seconds, setSeconds] = useState<number>(
    lastSet?.seconds ?? suggestion.seconds ?? spec.secondsMin ?? 20,
  );
  const [rir, setRir] = useState<number>(lastSet?.rir ?? rirTargetEnd(rirTarget));
  const [side, setSide] = useState<'L' | 'R'>(lastSet?.side === 'L' ? 'R' : 'L');

  const save = () => {
    onSave({
      loadKg,
      reps: spec.isometric ? 0 : reps,
      rir,
      seconds: spec.isometric ? seconds : undefined,
      side: spec.perSide ? side : undefined,
    });
    if (spec.perSide) setSide((s) => (s === 'L' ? 'R' : 'L'));
  };

  return (
    <div className="flex flex-col gap-3">
      <Stepper
        label={spec.weightedBodyweight ? 'Lastre' : 'Carga'}
        value={loadKg}
        onChange={setLoadKg}
        step={step}
        bigStep={lower ? 5 : 2.5}
        min={0}
        max={400}
        unit="kg"
        size="lg"
      />
      {spec.isometric ? (
        <Stepper
          label="Segundos"
          value={seconds}
          onChange={setSeconds}
          step={5}
          min={0}
          max={300}
          unit="s"
          inputMode="numeric"
        />
      ) : (
        <Stepper
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          max={50}
          inputMode="numeric"
        />
      )}
      <Segmented label="RIR" value={rir} onChange={setRir} options={RIR_OPTIONS} />
      {spec.perSide && (
        <Segmented
          label="Lado"
          value={side}
          onChange={setSide}
          options={[
            { value: 'L', label: 'Izq' },
            { value: 'R', label: 'Der' },
          ]}
        />
      )}
      <Button full size="lg" onClick={save} disabled={disabled}>
        Guardar serie
      </Button>
    </div>
  );
}
