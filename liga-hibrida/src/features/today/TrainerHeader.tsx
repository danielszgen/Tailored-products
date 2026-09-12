import { Eyebrow, Meter, StatusPill } from '@/components';
import { PvOrb, TrainerAvatar } from '@/brand/art';
import { BLOCK_WEEKS, waveForWeek, waveLabel } from '@/domain/content/block';
import { FORMS } from '@/domain/content/phases';
import { StatsRow } from '@/features/league/StatsCard';
import { useLeague } from '@/features/league/useLeague';
import { formatShort } from '@/lib/date';
import type { TodayModel } from './useToday';

/** Compact trainer card: name, Forma, week/wave, PV bar, status and the 0–100 stats (SPEC §8.2, §6.2). */
export function TrainerHeader({ model }: { model: TodayModel }) {
  const { profile, pvResult, weekOfBlock } = model;
  const league = useLeague(model.today);
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
      <div className="shrink-0">
        <TrainerAvatar form={profile.form} scale={1} />
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
        <div className="flex items-center gap-2">
          {pvResult && <PvOrb status={pvResult.status} scale={1} />}
          <div className="flex-1">
            <Meter
              label="PV"
              value={pvResult?.pv ?? 0}
              tone={pvResult?.status ?? 'accent'}
              showValue={!!pvResult}
              height={8}
            />
          </div>
        </div>
        {league.summary && (
          <div className="mt-2">
            <StatsRow stats={league.summary.stats} compact />
          </div>
        )}
      </div>
    </section>
  );
}
