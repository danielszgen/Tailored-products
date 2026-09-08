import type { LeagueTest } from '@/domain/types';

/** "Baseline · Semana 0" or "Combate de Liga · Semana N". */
export function testTitle(t: Pick<LeagueTest, 'weekOfBlock'>): string {
  return t.weekOfBlock === 0 ? 'Baseline · Semana 0' : `Combate de Liga · Semana ${t.weekOfBlock}`;
}
