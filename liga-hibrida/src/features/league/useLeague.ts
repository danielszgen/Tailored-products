// Live R10 evaluation for the LIGA tab and the combat summary: loads every table of the block,
// runs evaluateLeague() and persists the medal rows (progress + newly earned dates).
import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  listAdjustments,
  listCheckins,
  listMedals,
  listRegen,
  listRoutes,
  listSessions,
  listTests,
  listWeeks,
  listWild,
  useProfile,
} from '@/data';
import {
  evaluateLeague,
  toMedalRows,
  type LeagueInput,
  type LeagueSummary,
} from '@/domain/rules/league';
import { todayISO } from '@/lib/date';

export interface LeagueModel {
  loading: boolean;
  input: LeagueInput | null;
  summary: LeagueSummary | null;
}

export function useLeague(today: string = todayISO()): LeagueModel {
  const profile = useProfile();
  const data = useLiveQuery(async () => {
    const [checkins, sessions, routes, wild, regen, tests, weeks, medals, adjustments] =
      await Promise.all([
        listCheckins(),
        listSessions({ completedOnly: true }),
        listRoutes(),
        listWild(),
        listRegen(),
        listTests(),
        listWeeks(),
        listMedals(),
        listAdjustments(),
      ]);
    return { checkins, sessions, routes, wild, regen, tests, weeks, medals, adjustments };
  }, []);

  const input: LeagueInput | null = useMemo(
    () => (profile && data ? { profile, today, ...data } : null),
    [profile, data, today],
  );
  const summary = useMemo(() => (input ? evaluateLeague(input) : null), [input]);

  // Keep the medals table in sync so exports carry progress and earned dates.
  useEffect(() => {
    if (!summary || !data) return;
    const rows = toMedalRows(summary.medals).filter((row) => {
      const stored = data.medals.find((m) => m.id === row.id);
      return !stored || stored.progress !== row.progress || stored.earnedOn !== row.earnedOn;
    });
    if (rows.length > 0) void db.medals.bulkPut(rows);
  }, [summary, data]);

  return { loading: profile === undefined || data === undefined, input, summary };
}
