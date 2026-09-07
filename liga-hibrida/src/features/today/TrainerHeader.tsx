import { Eyebrow, Meter, StatusPill } from '@/components';
import { FormSilhouette } from '@/brand/icons';
import { BLOCK_WEEKS, waveForWeek, waveLabel } from '@/domain/content/block';
import { FORMS } from '@/domain/content/phases';
import { formatShort } from '@/lib/date';
import type { TodayModel } from './useToday';

/** Compact trainer card: name, Forma, week/wave, PV bar and status (SPEC §8.2). */
export function TrainerHeader({ model }: { model: TodayModel }) {
  const { profile, pvResult, weekOfBlock } = model;
  if (!profile) return null;

  let weekText: string;
  if (weekOfBlock === null || weekOfBlock < 1) {
    weekText = `Semana 0 · la Liga empieza el ${formatShort(profile.blockStart)}`;
  } else if (weekOfBlock > BLOCK_WEEKS) {
    weekText = 'Bloque terminado · Consejo de la Liga';
  } else {
    weekText = `Semana ${weekOfBlock}/${BLOCK_WEEKS} · ${waveLabel(waveForWeek(weekOfBlock))}`;
  }

  return (
    <section className="card p-4 flex gap-3 items-center">
      <div className="text-ink shrink-0" aria-hidden>
        <FormSilhouette form={profile.form} size={48} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="display text-lg truncate">{profile.name}</h2>
          {pvResult ? (
            <StatusPill status={pvResult.status} />
          ) : (
            <Eyebrow className="shrink-0">Sin check-in</Eyebrow>
          )}
        </div>
        <Eyebrow className="block">{FORMS[profile.form].fullName}</Eyebrow>
        <Eyebrow className="block mb-2">{weekText}</Eyebrow>
        <Meter
          label="PV"
          value={pvResult?.pv ?? 0}
          tone={pvResult?.status ?? 'accent'}
          showValue={!!pvResult}
          height={8}
        />
      </div>
    </section>
  );
}
