// LIGA tab (SPEC §8.5): block board, stats, medals, Combates de Liga, calendar, SMART, level,
// evolution, Índice de Movimientos and the 12-week report.
import { useNavigate } from 'react-router-dom';
import { Button, Screen, Splash } from '@/components';
import { BLOCK_WEEKS } from '@/domain/content/block';
import { todayISO, weekOfBlock } from '@/lib/date';
import { BlockBoard } from './BlockBoard';
import { FormsCard } from './FormsCard';
import { MedalsCard } from './MedalsCard';
import { MovementIndex } from './MovementIndex';
import { SmartCard } from './SmartCard';
import { LevelCard, StatsCard } from './StatsCard';
import { TestsCard } from './TestsCard';
import { useLeague } from './useLeague';
import { WeekCalendar } from './WeekCalendar';

export function LeagueScreen() {
  const navigate = useNavigate();
  const today = todayISO();
  const { loading, input, summary } = useLeague(today);
  if (loading) return <Splash />;
  if (!input) return null;
  const { profile } = input;
  const wob = weekOfBlock(today, profile.blockStart);
  const current = wob >= 1 && wob <= BLOCK_WEEKS ? wob : null;

  return (
    <Screen
      title="La Liga"
      eyebrow="Bloque 1 · 12 semanas"
      right={
        <Button variant="secondary" onClick={() => navigate('/liga/informe')}>
          Informe
        </Button>
      }
    >
      <BlockBoard
        blockStart={profile.blockStart}
        currentWeek={current}
        tests={input.tests}
        medals={summary?.medals ?? []}
      />
      <StatsCard stats={summary?.stats ?? null} />
      <MedalsCard medals={summary?.medals ?? null} />
      <TestsCard tests={input.tests} weekOfBlock={current} />
      <WeekCalendar
        blockStart={profile.blockStart}
        currentWeek={current}
        template={profile.defaultTemplate ?? 'estandar'}
      />
      <SmartCard smart={summary?.smart ?? null} profile={profile} today={today} />
      <LevelCard level={summary?.level ?? null} />
      <FormsCard profile={profile} evolution={summary?.evolution ?? null} today={today} />
      <MovementIndex sessions={input.sessions} />
      <Button full size="lg" variant="secondary" onClick={() => navigate('/liga/informe')}>
        Informe de 12 semanas para El Rival
      </Button>
    </Screen>
  );
}
