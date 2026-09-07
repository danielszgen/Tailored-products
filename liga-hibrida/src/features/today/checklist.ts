// Daily Combustible checklist ticks — per-device localStorage (SPEC §8.2).
// DECISION: kept out of Dexie in Etapa I; see docs/PREGUNTAS.md.
import type { ChecklistId } from '@/domain/content/nutrition';
import type { ISODate } from '@/domain/types';

const KEY = (date: ISODate) => `liga-hibrida:checklist:${date}`;

export type ChecklistState = Partial<Record<ChecklistId, boolean>>;

export function readChecklist(date: ISODate): ChecklistState {
  try {
    const raw = localStorage.getItem(KEY(date));
    return raw ? (JSON.parse(raw) as ChecklistState) : {};
  } catch {
    return {};
  }
}

export function writeChecklist(date: ISODate, state: ChecklistState): void {
  try {
    localStorage.setItem(KEY(date), JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
