// Combat screen (SPEC §8.3): start → mandatory warm-up → exercises + rest timer → finish → summary.
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Eyebrow, Pill, Screen, Segmented, Splash, StatusPill } from '@/components';
import { GymIcon } from '@/brand/icons';
import { updateProfile } from '@/data';
import { GYM_ORDER, GYM_NAMES, SESSION_CODE_LABEL, versionNote } from '@/domain/content/gyms';
import { hierarchyName } from '@/domain/content/constitution';
import { deloadSummary } from '@/domain/rules/deload';
import type { GymId, Scale5, SessionVersion } from '@/domain/types';
import { scheduleAdductorReminder } from './adductorReminder';
import { ExerciseCard } from './ExerciseCard';
import { FinishSheet } from './FinishSheet';
import { RestTimer } from './RestTimer';
import { SessionSummary } from './SessionSummary';
import { bestSet, targetsFromSuggestion } from './suggestion';
import { useRestTimer } from './useRestTimer';
import { useSession } from './useSession';
import { WarmupChecklist } from './WarmupChecklist';

const SCALE = [1, 2, 3, 4, 5].map((v) => ({ value: v as Scale5, label: String(v) }));
const VERSIONS = [45, 60, 75].map((v) => ({ value: v as SessionVersion, label: `${v}'` }));

function isGymId(v: string | undefined): v is GymId {
  return !!v && (GYM_ORDER as readonly string[]).includes(v);
}

export function GymSessionScreen() {
  const { gymId } = useParams();
  if (!isGymId(gymId)) {
    return (
      <Screen title="Gimnasio" back="/gym">
        <Card title="Gimnasio desconocido">
          <p className="text-sm text-ink2">Elige uno de los cuatro gimnasios.</p>
        </Card>
      </Screen>
    );
  }
  return <Combat gymId={gymId} />;
}

function Combat({ gymId }: { gymId: GymId }) {
  const [params] = useSearchParams();
  const queryVersion = Number(params.get('version'));
  const defaultVersion: SessionVersion =
    queryVersion === 45 || queryVersion === 75 ? queryVersion : 60;
  const model = useSession(gymId);
  const timer = useRestTimer();
  const [energyStart, setEnergyStart] = useState<Scale5>(3);
  const [version, setVersion] = useState<SessionVersion>(defaultVersion);
  const [finishOpen, setFinishOpen] = useState(false);
  const { gym, session, finished, adjustment, exercises, previous, suggestions, today, wave } =
    model;

  if (session === undefined || today.profile === undefined) return <Splash />;

  const header = (
    <span className="flex items-center gap-2">
      <GymIcon gym={gymId} size={28} />
      {GYM_NAMES[gymId]}
    </span>
  );
  const planItem =
    today.day?.am?.kind === 'gym' && today.day.am.gymId === gymId
      ? today.day.am
      : today.day?.pm?.kind === 'gym' && today.day.pm.gymId === gymId
        ? today.day.pm
        : null;
  const deloadLines = deloadSummary(wave);

  if (finished) {
    return (
      <Screen title={header} eyebrow={SESSION_CODE_LABEL[gymId]} back="/gym">
        <SessionSummary session={finished} previous={previous} />
      </Screen>
    );
  }

  if (!session) {
    const status = today.pvResult?.status;
    return (
      <Screen title={header} eyebrow={`${SESSION_CODE_LABEL[gymId]} · ${gym.goal}`} back="/gym">
        <Card eyebrow="Antes de empezar" title="Estado y versión">
          <div className="flex items-center gap-2 mb-3">
            {today.pvResult ? (
              <>
                <StatusPill status={today.pvResult.status} />
                <span className="font-pixel text-sm tracking-[1px]">PV {today.pvResult.pv}</span>
              </>
            ) : (
              <Pill tone="cargado">Sin check-in hoy — se asume OK</Pill>
            )}
          </div>
          {adjustment && adjustment.status !== 'ok' && (
            <ul className="text-sm text-ink2 mb-3 flex flex-col gap-1">
              {adjustment.advisories.map((a) => (
                <li key={a.message}>
                  ·{' '}
                  <span className="font-bold">
                    Nivel {a.level} · {hierarchyName(a.level)}:
                  </span>{' '}
                  {a.message}
                </li>
              ))}
            </ul>
          )}
          {planItem?.note && (
            <p className="text-sm text-status-cargado mb-3">Nota del plan: {planItem.note}</p>
          )}
          <Segmented
            label="Energía al empezar"
            value={energyStart}
            onChange={setEnergyStart}
            options={SCALE}
            size="lg"
            className="mb-3"
          />
          <Segmented
            label="Versión"
            value={version}
            onChange={setVersion}
            options={VERSIONS}
            className="mb-2"
          />
          <p className="text-xs text-ink3 mb-4">{versionNote(gym, version)}</p>
          {status === 'cargado' && version !== 45 && (
            <p className="text-xs text-status-cargado mb-3">
              Estado CARGADO: la versión sugerida es 45&apos;.
            </p>
          )}
          <Button full size="lg" onClick={() => model.start({ version, energyStart })}>
            Empezar combate
          </Button>
        </Card>
        {deloadLines.length > 0 && (
          <Card eyebrow="R3" title={wave === 'deload' ? 'Semana de descarga' : 'Final de Liga'}>
            <ul className="text-sm text-ink2 flex flex-col gap-1">
              {deloadLines.map((l) => (
                <li key={l}>· {l}</li>
              ))}
            </ul>
          </Card>
        )}
        {gymId === 'cantera' && <TransitionCard model={model} />}
        <Card eyebrow="Combustible" title="Pre y post">
          <p className="text-sm text-ink2 mb-2">{gym.fuelPre}</p>
          <p className="text-sm text-ink2">{gym.fuelPost}</p>
        </Card>
      </Screen>
    );
  }

  const locked = !session.warmupDone;
  const firstIncomplete = exercises.find((e) => {
    const log = session.exercises.find((l) => l.exerciseId === e.id);
    const targetSets = (e.perSide ? 2 : 1) * targetsFromSuggestion(e, suggestions[e.id]).sets;
    return !log?.skipped && (log?.sets.length ?? 0) < targetSets;
  });

  return (
    <Screen
      title={header}
      eyebrow={`${SESSION_CODE_LABEL[gymId]} · ${session.version}' · ${session.statusAtStart.toUpperCase()}`}
      back="/gym"
    >
      <WarmupBlock model={model} />

      {planItem?.note && (
        <p className="text-xs text-status-cargado">Nota del plan: {planItem.note}</p>
      )}
      {wave === 'deload' && (
        <p className="text-xs text-ink3">Semana de descarga: series y RIR reducidos (R3).</p>
      )}
      {adjustment && adjustment.omitExerciseIds.length > 0 && (
        <p className="text-xs text-status-ko">Omitido hoy por estado: fondos lastrados.</p>
      )}
      {adjustment?.substituteLowerWithMobility && (
        <Card eyebrow="Nivel 1 · Salud / técnica" title="Sesión sustituida">
          <p className="text-sm text-ink2">
            KO por aductor: hoy toca movilidad + Copenhagen isométrico de baja dosis en lugar de la
            sesión de pierna. Registra solo lo que hagas.
          </p>
        </Card>
      )}

      {exercises.map((spec) => {
        const log = session.exercises.find((l) => l.exerciseId === spec.id);
        const suggestion = suggestions[spec.id];
        const targets = targetsFromSuggestion(spec, suggestion);
        const prevLogs = previous[spec.id] ?? [];
        return (
          <ExerciseCard
            key={spec.id}
            spec={spec}
            gymId={gymId}
            targets={targets}
            adjusted={!!adjustment && adjustment.status === 'cargado'}
            suggestion={suggestion}
            previousSets={prevLogs[0]?.log.sets}
            log={log}
            locked={locked}
            isCurrent={firstIncomplete?.id === spec.id}
            onLogSet={async (set) => {
              await model.logSet(spec.id, set);
              timer.start(spec.restSec);
            }}
            onUndo={() => model.removeLastSet(spec.id)}
            onSkip={(skipped) => model.skipExercise(spec.id, skipped)}
          />
        );
      })}

      <Card eyebrow="Registro mínimo" title="Terminar">
        <p className="text-sm text-ink2 mb-3">
          Al cerrar: energía fin, muñeca durante, aductor durante, sensación y deporte previo.
        </p>
        <Button
          full
          size="lg"
          variant="secondary"
          onClick={() => setFinishOpen(true)}
          disabled={locked}
        >
          Terminar combate
        </Button>
        {bestSet(session.exercises[0]) === undefined && !locked && (
          <Eyebrow className="block mt-2">
            Puedes terminar sin series si hoy es solo técnica
          </Eyebrow>
        )}
      </Card>

      {/* Keep the last card reachable while the sticky rest timer is visible. */}
      <div aria-hidden style={{ height: timer.running ? 112 : 0 }} />

      <RestTimer
        running={timer.running}
        remaining={timer.remaining}
        range={timer.range}
        onAdd={timer.add}
        onSkip={timer.skip}
      />
      <FinishSheet
        open={finishOpen}
        gymId={gymId}
        onClose={() => setFinishOpen(false)}
        onFinish={async (input) => {
          timer.skip();
          await model.finish(input);
          // "¿Aductor 30–60 min después?" in 45 min (Lower only); HOY keeps the in-app fallback.
          scheduleAdductorReminder(gymId);
          setFinishOpen(false);
        }}
      />
    </Screen>
  );
}

function WarmupBlock({ model }: { model: ReturnType<typeof useSession> }) {
  const { gym, session, adjustment } = model;
  if (!session) return null;
  return (
    <WarmupChecklist
      gym={gym}
      omitTags={adjustment?.omitWarmupTags ?? []}
      done={!!session.warmupDone}
      onComplete={() => model.completeWarmup()}
    />
  );
}

/** Barbell-squat transition (§6.5 / R8): offered when tolerated; Daniel decides. */
function TransitionCard({ model }: { model: ReturnType<typeof useSession> }) {
  const { today } = model;
  const variant = today.profile?.squatVariant ?? 'tolerated';
  const offer = today.transition;
  if (variant === 'barbell') {
    return (
      <Card eyebrow="Transición a sentadilla con barra" title="High-bar squat activo">
        <p className="text-sm text-ink2 mb-3">
          A1 es high-bar squat 3–4×5–8 RIR 3→2. Si el síntoma vuelve, regresa a la variante
          tolerada.
        </p>
        <Button
          full
          variant="secondary"
          onClick={() => void updateProfile({ squatVariant: 'tolerated' })}
        >
          Volver a la variante tolerada
        </Button>
      </Card>
    );
  }
  if (!offer.offer) return null;
  return (
    <Card eyebrow="Transición a sentadilla con barra" title="La app te la ofrece">
      <p className="text-sm text-ink2 mb-3">{offer.reason}</p>
      <div className="flex flex-col gap-2">
        <Button full onClick={() => void updateProfile({ squatVariant: 'barbell' })}>
          Probar high-bar squat en A1
        </Button>
        <Eyebrow>Decides tú; la app solo lo propone cuando el aductor lo tolera.</Eyebrow>
      </div>
    </Card>
  );
}
