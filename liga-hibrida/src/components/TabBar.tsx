import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface Tab {
  to: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
  end?: boolean;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

// Original geometric glyphs (SPEC §4.3 / §0.5).
const TABS: Tab[] = [
  {
    to: '/',
    label: 'HOY',
    end: true,
    icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
        <circle cx="12" cy="12" r="4" fill={a ? 'currentColor' : 'none'} />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
      </svg>
    ),
  },
  {
    to: '/gym',
    label: 'GYM',
    icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
        <path d="M3 12h3M18 12h3" />
        <rect x="6" y="8" width="3" height="8" rx="1" fill={a ? 'currentColor' : 'none'} />
        <rect x="15" y="8" width="3" height="8" rx="1" fill={a ? 'currentColor' : 'none'} />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    to: '/rutas',
    label: 'RUTAS',
    icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
        <path d="M3 16c3 0 3-6 6-6s3 6 6 6 3-6 6-6" />
        <path d="M17 7l4 3-4 3" fill={a ? 'currentColor' : 'none'} />
      </svg>
    ),
  },
  {
    to: '/liga',
    label: 'LIGA',
    icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
        <path d="M12 3l7 4v6l-7 4-7-4V7z" fill={a ? 'currentColor' : 'none'} />
        <path d="M9 21h6M12 17v4" />
      </svg>
    ),
  },
  {
    to: '/regen',
    label: 'REGEN',
    icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden {...stroke}>
        <path
          d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"
          fill={a ? 'currentColor' : 'none'}
        />
      </svg>
    ),
  },
];

/** Bottom navigation: 5 tabs, ≥ 44 px targets, safe-area aware (SPEC §8). */
export function TabBar() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line safe-bottom"
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 min-h-[64px] pt-1',
                  isActive ? 'text-accent' : 'text-ink3',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {tab.icon(isActive)}
                  <span className="font-pixel text-[9px] tracking-[1px]">{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
