// LIGA tab — Etapa I: block board, read-only calendar, Formas, medals, SMART, movement index.
import { Screen, Splash } from '@/components';
import { useProfile } from '@/data';
import { BLOCK_WEEKS } from '@/domain/content/block';
import { todayISO, weekOfBlock } from '@/lib/date';
import { BlockBoard } from './BlockBoard';
import { FormsCard } from './FormsCard';
import { MedalsCard } from './MedalsCard';
import { MovementIndex } from './MovementIndex';
import { SmartCard } from './SmartCard';
import { WeekCalendar } from './WeekCalendar';

export function LeagueScreen() {
  const profile = useProfile();
  if (profile === undefined) return <Splash />;
  if (!profile) return null;
  const wob = weekOfBlock(todayISO(), profile.blockStart);
  const current = wob >= 1 && wob <= BLOCK_WEEKS ? wob : null;

  return (
    <Screen title="La Liga" eyebrow="Bloque 1 · 12 semanas">
      <BlockBoard blockStart={profile.blockStart} currentWeek={current} />
      <WeekCalendar
        blockStart={profile.blockStart}
        currentWeek={current}
        template={profile.defaultTemplate ?? 'estandar'}
      />
      <MedalsCard />
      <FormsCard current={profile.form} />
      <SmartCard />
      <MovementIndex />
    </Screen>
  );
}
