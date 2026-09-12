import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Eyebrow, Pill } from '@/components';
import { GymIcon, TypeGlyph } from '@/brand/icons';
import { GymLeader, LEADER_NAMES, LEADER_TAGLINES } from '@/brand/art';
import { lastCompletedSession } from '@/data';
import { GYMS, SESSION_CODE_LABEL, getExercise, isMainLift } from '@/domain/content/gyms';
import type { GymId, SessionVersion } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { bestSet } from './suggestion';
import { formatSet } from './volume';

export function GymCard({
  gymId,
  isToday,
  version,
  onEnter,
}: {
  gymId: GymId;
  isToday: boolean;
  version: SessionVersion;
  onEnter: () => void;
}) {
  const gym = GYMS[gymId];
  const last = useLiveQuery(() => lastCompletedSession(gymId), [gymId]);
  const mains = last
    ? last.exercises
        .filter((e) => {
          const spec = getExercise(gymId, e.exerciseId);
          return spec && isMainLift(spec) && e.sets.length > 0;
        })
        .map((e) => {
          const b = bestSet(e);
          return `${getExercise(gymId, e.exerciseId)!.slot} ${b ? formatSet(b) : ''}`;
        })
    : [];

  return (
    <Card
      className={isToday ? 'border-accent' : undefined}
      eyebrow={
        <span className="flex items-center gap-2">
          {SESSION_CODE_LABEL[gymId]}
          {isToday && <Pill tone="accent">Hoy</Pill>}
        </span>
      }
      title={
        <span className="flex items-center gap-2">
          <GymIcon gym={gymId} size={28} />
          {gym.name}
        </span>
      }
      right={<Pill tone="neutral">coste {gym.cost}</Pill>}
    >
      <p className="text-sm text-ink2">{gym.goal}</p>
      <div className="flex items-start gap-3 mt-2">
        <GymLeader gymId={gymId} scale={1} className="shrink-0" />
        <div className="min-w-0">
          <Eyebrow className="block">Líder · {LEADER_NAMES[gymId]}</Eyebrow>
          <p className="text-xs text-ink3">{LEADER_TAGLINES[gymId]}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {gym.primaryTypes.map((t) => (
          <Pill key={t} tone={t}>
            <TypeGlyph type={t} size={12} color="currentColor" /> {t}
          </Pill>
        ))}
      </div>
      <p className="text-xs text-ink3 mt-2">
        {last
          ? `Último combate ${formatShort(last.date)}: ${mains.join(' · ') || 'sin series'}`
          : 'Sin combates todavía'}
      </p>
      <Button full className="mt-3" onClick={onEnter}>
        Entrar · {version}&apos;
      </Button>
    </Card>
  );
}
