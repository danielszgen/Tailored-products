// Daily creatina tick — per-device localStorage (SPEC §8.6 "único hábito con tick diario").
// DECISION: kept out of Dexie in Etapa I; see docs/PREGUNTAS.md.
import type { ISODate } from '@/domain/types';

const KEY = (date: ISODate) => `liga-hibrida:creatine:${date}`;

export function isCreatineTaken(date: ISODate): boolean {
  try {
    return localStorage.getItem(KEY(date)) === '1';
  } catch {
    return false;
  }
}

export function setCreatineTaken(date: ISODate, taken: boolean): void {
  try {
    if (taken) localStorage.setItem(KEY(date), '1');
    else localStorage.removeItem(KEY(date));
  } catch {
    /* storage unavailable */
  }
}
