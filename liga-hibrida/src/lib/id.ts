/** Unique id for logs. Uses the platform UUID when available. */
export function newId(prefix?: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}
