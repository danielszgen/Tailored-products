// Exercise block: targets, suggestion, last session, logged sets and the set form.
import { Button, Card, Eyebrow, Pill } from '@/components';
import { formatRest, formatRir, formatSetsReps, isMainLift } from '@/domain/content/gyms';
import type { ExerciseLog, ExerciseSpec, GymId, SetLog } from '@/domain/types';
import { SetForm } from './SetForm';
import type { AdjustedTargets, LoadSuggestion } from './suggestion';
import { formatSet } from './volume';

export interface ExerciseCardProps {
  spec: ExerciseSpec;
  gymId: GymId;
  targets: AdjustedTargets;
  adjusted: boolean;
  suggestion: LoadSuggestion;
  previousSets?: SetLog[];
  log?: ExerciseLog;
  locked: boolean;
  isCurrent: boolean;
  onLogSet: (set: Omit<SetLog, 'setIndex'>) => void;
  onUndo: () => void;
  onSkip: (skipped: boolean) => void;
}

export function ExerciseCard({
  spec,
  gymId,
  targets,
  adjusted,
  suggestion,
  previousSets,
  log,
  locked,
  isCurrent,
  onLogSet,
  onUndo,
  onSkip,
}: ExerciseCardProps) {
  const sets = log?.sets ?? [];
  const targetSets = spec.perSide ? targets.sets * 2 : targets.sets;
  const complete = sets.length >= targetSets;
  const skipped = log?.skipped;

  return (
    <Card
      className={isCurrent && !locked ? 'border-accent' : undefined}
      eyebrow={
        <span className="flex items-center gap-2">
          {spec.slot} · {isMainLift(spec) ? 'principal' : 'accesorio'}
          {adjusted && <Pill tone="cargado">ajustado por estado</Pill>}
        </span>
      }
      title={spec.name}
      right={
        <span className="font-pixel text-[11px] tracking-[1px] text-ink3">
          {sets.length}/{targetSets}
        </span>
      }
    >
      <p className="text-sm text-ink2">
        {formatSetsReps({ ...spec, sets: targets.sets })} · RIR {formatRir(targets.rirTarget)} ·
        descanso {formatRest(spec.restSec)}
      </p>
      <p className="text-xs text-ink3 mt-1">{spec.note}</p>
      {spec.alternatives && spec.alternatives.length > 0 && (
        <p className="text-xs text-ink3">Alternativa: {spec.alternatives.join(' · ')}</p>
      )}

      <div className="mt-3 rounded-list bg-surface2 p-3">
        <Eyebrow className="block mb-1">Sugerencia</Eyebrow>
        <p className="text-sm text-ink">{suggestion.text}</p>
        {previousSets && previousSets.length > 0 && (
          <p className="text-xs text-ink3 mt-1">
            Última sesión: {previousSets.map((s) => formatSet(s)).join(' · ')}
          </p>
        )}
      </div>

      {sets.length > 0 && (
        <ol className="mt-3 flex flex-col gap-1" aria-label="Series registradas">
          {sets.map((s) => (
            <li key={s.setIndex} className="text-sm text-ink flex justify-between">
              <span>
                <span className="font-pixel text-[10px] tracking-[1px] text-ink3 mr-2">
                  S{s.setIndex}
                </span>
                {formatSet(s)}
              </span>
            </li>
          ))}
        </ol>
      )}

      {locked ? (
        <p className="text-xs text-ink3 mt-3">
          🔒 Completa el calentamiento para registrar series.
        </p>
      ) : skipped ? (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink3">Ejercicio saltado</span>
          <Button variant="ghost" onClick={() => onSkip(false)}>
            Recuperar
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {complete && <p className="text-sm text-status-ok">Objetivo de series alcanzado ✓</p>}
          <SetForm
            spec={spec}
            gymId={gymId}
            suggestion={suggestion}
            lastSet={sets[sets.length - 1]}
            rirTarget={targets.rirTarget}
            onSave={onLogSet}
          />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onUndo} disabled={sets.length === 0}>
              Deshacer última
            </Button>
            <Button variant="ghost" onClick={() => onSkip(true)}>
              Saltar ejercicio
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
