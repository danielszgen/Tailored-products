// Shared helpers for UI tests: fresh DB, seeded profile, frozen date, providers.
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { db, saveProfile } from '@/data';
import type { Profile } from '@/domain/types';

export const BLOCK_START = '2026-09-07';

export async function resetDb(): Promise<void> {
  await db.delete();
  await db.open();
}

export function freezeDate(iso: string): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
}

export function unfreezeDate(): void {
  vi.useRealTimers();
}

export async function seedProfile(overrides: Partial<Profile> = {}): Promise<void> {
  await saveProfile({
    name: 'Daniel',
    heightCm: 190,
    startWeightKg: 79,
    targetWeightKg: [85, 88],
    amWindow: ['07:00', '09:00'],
    pmWindow: ['19:00', '21:00'],
    blockStart: BLOCK_START,
    form: 1,
    baselines: {},
    defaultTemplate: 'estandar',
    ...overrides,
  });
}

export function renderAt(ui: ReactNode, path = '/', routePath = '*') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
