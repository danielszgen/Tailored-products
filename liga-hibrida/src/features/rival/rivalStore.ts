// localStorage of "Pregunta al Rival" (SPEC §10.2): the app token Daniel types in Ajustes, the
// endpoint (defaults to the Vercel function of this deployment), the per-day call counter and the
// "already saw the JSON preview" flag. Every access is guarded: Safari private mode may throw.
import type { ISODate } from '@/domain/types';
import { RIVAL_ENDPOINT } from '@/domain/rival/prompt';

const TOKEN_KEY = 'liga-hibrida:rival-token';
const ENDPOINT_KEY = 'liga-hibrida:rival-endpoint';
const PREVIEW_KEY = 'liga-hibrida:rival-preview-seen';
const CALLS_PREFIX = 'liga-hibrida:rival-calls:';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private mode or quota exceeded: the feature degrades, nothing else breaks.
  }
}

/** Stored app token ('' when none). */
export function getRivalToken(): string {
  return read(TOKEN_KEY) ?? '';
}

export function setRivalToken(token: string): void {
  const trimmed = token.trim();
  write(TOKEN_KEY, trimmed ? trimmed : null);
}

/** Endpoint of the function; lets Daniel point to his Vercel deployment when the PWA lives elsewhere. */
export function getRivalEndpoint(): string {
  return read(ENDPOINT_KEY)?.trim() || RIVAL_ENDPOINT;
}

export function setRivalEndpoint(url: string): void {
  const trimmed = url.trim();
  write(ENDPOINT_KEY, trimmed && trimmed !== RIVAL_ENDPOINT ? trimmed : null);
}

export function rivalCallsToday(date: ISODate): number {
  const value = Number(read(CALLS_PREFIX + date));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Counts one call for `date` (other days are pruned) and returns the new total. */
export function recordRivalCall(date: ISODate): number {
  pruneCalls(date);
  const next = rivalCallsToday(date) + 1;
  write(CALLS_PREFIX + date, String(next));
  return next;
}

function pruneCalls(keep: ISODate): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CALLS_PREFIX) && key !== CALLS_PREFIX + keep) stale.push(key);
    }
    for (const key of stale) localStorage.removeItem(key);
  } catch {
    // Same guard as above.
  }
}

export function hasSeenRivalPreview(): boolean {
  return read(PREVIEW_KEY) === '1';
}

export function markRivalPreviewSeen(): void {
  write(PREVIEW_KEY, '1');
}
