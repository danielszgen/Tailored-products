import type { Config } from 'tailwindcss';
import { colors, fonts, radius } from './src/brand/tokens';

// Theme colors are exposed as CSS variables (see src/index.css) so light/dark
// switching is a single attribute flip on <html>. Type/status colors are fixed.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        surface2: 'var(--c-surface2)',
        line: 'var(--c-line)',
        ink: 'var(--c-ink)',
        ink2: 'var(--c-ink2)',
        ink3: 'var(--c-ink3)',
        accent: 'var(--c-accent)',
        'on-accent': 'var(--c-on-accent)',
        gold: 'var(--c-gold)',
        type: colors.types,
        status: colors.status,
      },
      fontFamily: {
        display: fonts.display,
        body: fonts.body,
        pixel: fonts.pixel,
      },
      borderRadius: {
        card: `${radius.card}px`,
        phone: `${radius.phone}px`,
        pill: `${radius.pill}px`,
        list: '10px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;
