// Dexie database — SPEC §5 "Dexie": one table per interface, indexed by date/gymId.
import Dexie, { type EntityTable } from 'dexie';
import type {
  Adjustment,
  Checkin,
  LeagueTest,
  Medal,
  Profile,
  RegenLog,
  RouteLog,
  SessionLog,
  WeekPlan,
  WildLog,
} from '@/domain/types';

/** Single-user app: the profile row always has id 'me'. */
export const PROFILE_ID = 'me' as const;
export type StoredProfile = Profile & { id: typeof PROFILE_ID };

export const DB_NAME = 'liga-hibrida';
export const SCHEMA_VERSION = 1;

export class LigaDB extends Dexie {
  checkins!: EntityTable<Checkin, 'date'>;
  sessions!: EntityTable<SessionLog, 'id'>;
  routes!: EntityTable<RouteLog, 'id'>;
  wild!: EntityTable<WildLog, 'id'>;
  regen!: EntityTable<RegenLog, 'id'>;
  weeks!: EntityTable<WeekPlan, 'weekStart'>;
  tests!: EntityTable<LeagueTest, 'id'>;
  medals!: EntityTable<Medal, 'id'>;
  adjustments!: EntityTable<Adjustment, 'id'>;
  profile!: EntityTable<StoredProfile, 'id'>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      checkins: 'date',
      sessions: 'id, date, gymId, weekOfBlock',
      routes: 'id, date, kind',
      wild: 'id, date, kind',
      regen: 'id, date, kind',
      weeks: 'weekStart, weekOfBlock',
      tests: 'id, date, weekOfBlock',
      medals: 'id',
      adjustments: 'id, date, kind',
      profile: 'id',
    });
  }
}

export const TABLE_NAMES = [
  'checkins',
  'sessions',
  'routes',
  'wild',
  'regen',
  'weeks',
  'tests',
  'medals',
  'adjustments',
  'profile',
] as const;
export type TableName = (typeof TABLE_NAMES)[number];

export const db = new LigaDB();
