// Spanish number formatting shared by rules (reasons, reports) and the UI.

/** 2.5 → "2,5", 70 → "70", 62.25 → "62,3" (one decimal, comma). */
export function formatKg(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}

/** 0.05 → "+0,05 %", −0.2 → "−0,20 %". */
export function formatPct(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(decimals).replace('.', ',')} %`;
}

/** 8 → "8 h", 7.5 → "7,5 h". */
export function formatHours(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1).replace('.', ',')} h`;
}

/** 95 → "1 h 35'", 45 → "45'". */
export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}'`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest}'`;
}
