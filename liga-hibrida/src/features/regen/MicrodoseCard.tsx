// Wrist and adductor microdose guides with this week's counters (SPEC §6.6, §8.6).
import { Card, Eyebrow, Pill } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import {
  ADDUCTOR_MICRODOSE,
  WEEKLY_MOBILITY_MINIMUM,
  WRIST_MICRODOSE,
} from '@/domain/content/regen';
import type { RegenCounts } from './regenCounts';

export function MicrodoseCard({ counts }: { counts?: RegenCounts }) {
  return (
    <Card
      eyebrow="Microdosis"
      title="Muñeca y aductor"
      right={
        counts && (
          <Pill tone="neutral">
            muñeca {counts.wrist}/3 · aductor {counts.adductor}/2
          </Pill>
        )
      }
    >
      <div className="flex flex-col gap-3">
        <Collapsible
          title={`${WRIST_MICRODOSE.title} · ${WRIST_MICRODOSE.minutes[0]}–${WRIST_MICRODOSE.minutes[1]} min`}
          eyebrow={WRIST_MICRODOSE.perWeek}
        >
          <ul className="flex flex-col gap-2">
            {WRIST_MICRODOSE.blocks.map((b) => (
              <li key={b.block}>
                <span className="font-bold text-ink">{b.block}</span>
                <span className="block">{b.content}</span>
                <span className="block text-xs text-ink3">
                  Dosis: {b.dose} · Progresión: {b.progression}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-status-ko mt-3">
            <span className="font-bold">Nivel 1 · Salud:</span> {WRIST_MICRODOSE.alert}
          </p>
        </Collapsible>

        <Collapsible title={ADDUCTOR_MICRODOSE.title} eyebrow={ADDUCTOR_MICRODOSE.perWeek}>
          <ul className="list-disc pl-4 flex flex-col gap-1">
            {ADDUCTOR_MICRODOSE.exercises.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-2">{ADDUCTOR_MICRODOSE.beforeLower}</p>
          <p className="mt-1">{ADDUCTOR_MICRODOSE.afterLower}</p>
          <p className="text-xs text-status-ko mt-3">
            <span className="font-bold">Nivel 1 · Salud:</span> {ADDUCTOR_MICRODOSE.alert}
          </p>
        </Collapsible>

        <div>
          <Eyebrow className="block mb-1">Movilidad mínima semanal</Eyebrow>
          <p className="text-sm text-ink2">{WEEKLY_MOBILITY_MINIMUM.join(' · ')}</p>
        </div>
      </div>
    </Card>
  );
}
