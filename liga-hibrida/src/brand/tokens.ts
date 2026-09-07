// Brand tokens — SPEC §4.2. Keep values in sync with the CSS variables in src/index.css.
export const colors = {
  light: {
    bg: '#F3F5F9',
    surface: '#FFFFFF',
    surface2: '#E9EDF4',
    line: '#D3DAE6',
    ink: '#141B2B',
    ink2: '#4A5468',
    ink3: '#7C879B',
    accent: '#E23D4A',
    gold: '#E9A82A',
  },
  dark: {
    bg: '#0E1420',
    surface: '#161E2E',
    surface2: '#1E2839',
    line: '#2B3648',
    ink: '#EEF2F8',
    ink2: '#B4BDCC',
    ink3: '#7E8899',
    accent: '#FF5462',
    gold: '#F5B942',
  },
  types: {
    masa: '#8E5CF0',
    fuerza: '#E23D4A',
    motor: '#2F8DFF',
    control: '#22B573',
    aventura: '#E9A82A',
    regen: '#3BB8D6',
  },
  status: { ok: '#22B573', cargado: '#E9A82A', ko: '#E23D4A' },
} as const;

export const fonts = {
  display: '"Titan One", "Nunito", sans-serif', // titles, gym names, big numbers
  body: '"Nunito", system-ui, sans-serif', // text
  pixel: '"Silkscreen", monospace', // labels, eyebrows, PV, counters (9–11 px, letter-spacing 1px)
} as const;

export const radius = { card: 14, phone: 22, pill: 6 } as const;

export type ThemeName = keyof Pick<typeof colors, 'light' | 'dark'>;
