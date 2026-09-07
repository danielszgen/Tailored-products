// Pure fixtures for check-ins (no DB).
import { computePv, type SymptomSample } from '@/domain/rules/pv';
import type { Checkin, ISODate } from '@/domain/types';

export interface CheckinOverrides extends Partial<Omit<Checkin, 'pv' | 'status'>> {
  history?: SymptomSample[];
}

/** Builds a Checkin with pv/status computed by R1 from the given values. */
export function makeCheckin(overrides: CheckinOverrides = {}): Checkin {
  const { history = [], ...rest } = overrides;
  const base = {
    date: '2026-09-07' as ISODate,
    sleepHours: 8,
    energy: 5 as const,
    legs: 5 as const,
    wrist: 0,
    adductor: 0,
  };
  const input = { ...base, ...rest };
  const result = computePv(
    {
      sleepHours: input.sleepHours,
      energy: input.energy,
      legs: input.legs,
      wrist: input.wrist,
      adductor: input.adductor,
    },
    history,
  );
  return { ...input, pv: result.pv, status: result.status };
}

/** Symptom history from wrist values (adductor 0) or adductor values (wrist 0). */
export function wristHistory(values: number[]): SymptomSample[] {
  return values.map((wrist) => ({ wrist, adductor: 0 }));
}

export function adductorHistory(values: number[]): SymptomSample[] {
  return values.map((adductor) => ({ wrist: 0, adductor }));
}
