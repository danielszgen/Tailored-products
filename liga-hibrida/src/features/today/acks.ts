// Acknowledgement of sticky advisories (R8 "no se puede descartar sin leerlo") — per-device.
// DECISION: kept in localStorage like the daily checklist; see docs/PREGUNTAS.md.
const KEY = 'liga-hibrida:acks';

function read(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function isAcknowledged(id: string): boolean {
  return id in read();
}

export function acknowledge(id: string, date: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: date }));
  } catch {
    /* storage unavailable */
  }
}
