// AM / PM cards of the day with the R1 adjustment when CARGADO / KO (SPEC §8.2).
import { Card, Eyebrow, Pill } from '@/components';
import { GymIcon, TypeGlyph } from '@/brand/icons';
import { GYMS, GYM_NAMES, SESSION_CODE_LABEL } from '@/domain/content/gyms';
import { plannedItemKindLabel, plannedItemLabel } from '@/domain/content/week';
import type { PlannedItem } from '@/domain/types';
import type { TodayModel } from './useToday';

function ItemCard({
  slot,
  window,
  item,
  model,
}: {
  slot: 'AM' | 'PM';
  window: [string, string];
  item: PlannedItem | undefined;
  model: TodayModel;
}) {
  const status = model.pvResult?.status;
  const eyebrow = `${slot} · ${window[0]}–${window[1]}`;

  if (!item) {
    return (
      <Card eyebrow={eyebrow} title="Libre">
        <p className="text-sm text-ink3">Nada planificado en esta ventana.</p>
      </Card>
    );
  }

  if (item.kind === 'gym') {
    const gym = GYMS[item.gymId];
    const adjustment = status && status !== 'ok' ? model.adjustmentFor(item.gymId) : null;
    const version = adjustment?.status === 'cargado' ? 45 : item.version;
    return (
      <Card
        eyebrow={eyebrow}
        title={
          <span className="flex items-center gap-2">
            <GymIcon gym={item.gymId} size={28} />
            {GYM_NAMES[item.gymId]}
          </span>
        }
        right={<Pill tone="neutral">{SESSION_CODE_LABEL[item.gymId]}</Pill>}
      >
        <p className="text-sm text-ink2">{gym.goal}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Pill tone="neutral">{version}&apos;</Pill>
          <Pill tone="neutral">coste {gym.cost}</Pill>
          {gym.primaryTypes.map((t) => (
            <Pill key={t} tone={t}>
              <TypeGlyph type={t} size={12} color="currentColor" /> {t}
            </Pill>
          ))}
        </div>
        {adjustment && (
          <div className="mt-3 rounded-list bg-surface2 p-3">
            <Eyebrow className="block mb-1">
              Versión ajustada por estado {adjustment.status.toUpperCase()}
            </Eyebrow>
            <ul className="text-sm text-ink2 flex flex-col gap-1">
              {adjustment.status === 'cargado' && (
                <li>· −1 serie en accesorios, RIR +1 · versión 45&apos;</li>
              )}
              {adjustment.reducedToTechnique && (
                <li>· Sesión reducida a técnica suave y movilidad</li>
              )}
              {adjustment.omitExerciseIds.length > 0 && (
                <li>· Se omiten: handstand y fondos lastrados</li>
              )}
              {adjustment.substituteLowerWithMobility && (
                <li>· Pierna sustituida por movilidad + Copenhagen isométrico de baja dosis</li>
              )}
            </ul>
          </div>
        )}
      </Card>
    );
  }

  const pmRecovery =
    slot === 'PM' && status && status !== 'ok' && model.adjustmentFor('cantera')?.pmToRecovery;

  return (
    <Card
      eyebrow={eyebrow}
      title={plannedItemLabel(item)}
      right={<Pill tone="neutral">{plannedItemKindLabel(item)}</Pill>}
    >
      {pmRecovery ? (
        <p className="text-sm text-ink2">
          PM → recuperación u opcional (estado {status?.toUpperCase()}).
        </p>
      ) : (
        <p className="text-sm text-ink3">{itemHint(item)}</p>
      )}
    </Card>
  );
}

function itemHint(item: PlannedItem): string {
  switch (item.kind) {
    case 'route':
      return 'Registro de rutas en la Etapa II. Hoy: ritmo conversacional.';
    case 'wild':
      return 'Zona Salvaje: MTB, trail, surf o escalada exterior. Registro en la Etapa II.';
    case 'regen':
      return 'Centro Regen: suave, sin deuda.';
    case 'sport':
      return 'Deporte técnico: RPE bajo, vigilar muñeca.';
    case 'note':
      return 'Consulta al entrenador.';
    case 'off':
      return 'Descanso.';
    default:
      return '';
  }
}

export function PlanCards({ model }: { model: TodayModel }) {
  const { profile, day, inBlock, weekOfBlock, week } = model;
  if (!profile) return null;

  if (!inBlock) {
    return (
      <Card
        eyebrow="Plan"
        title={
          weekOfBlock !== null && weekOfBlock < 1
            ? 'Todavía no empieza la Liga'
            : 'Bloque terminado'
        }
      >
        <p className="text-sm text-ink2">
          {weekOfBlock !== null && weekOfBlock < 1
            ? 'El Bloque 1 arranca el lunes de inicio que elegiste. Puedes ver la semana base en LIGA.'
            : 'Las 12 semanas han terminado. El Consejo de la Liga y el siguiente bloque llegan en la Etapa II.'}
        </p>
      </Card>
    );
  }

  if (week === undefined || !day) {
    return (
      <Card eyebrow="Plan" title="Cargando la semana…">
        <p className="text-sm text-ink3">Preparando el plan de hoy.</p>
      </Card>
    );
  }

  return (
    <>
      <ItemCard slot="AM" window={profile.amWindow} item={day.am} model={model} />
      <ItemCard slot="PM" window={profile.pmWindow} item={day.pm} model={model} />
    </>
  );
}
