import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/data';
import { OnboardingScreen } from '@/features/onboarding';
import { freezeDate, renderAt, resetDb, unfreezeDate } from './helpers';

describe('Semana 0 · onboarding (SPEC §8.1)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-06T18:00:00');
    await resetDb();
  });
  afterEach(() => unfreezeDate());

  it('walks the wizard with defaults and creates profile, week 1 and medals', async () => {
    const user = userEvent.setup();
    renderAt(<OnboardingScreen />, '/onboarding');

    for (let i = 0; i < 4; i++) {
      await user.click(await screen.findByRole('button', { name: 'Siguiente' }));
    }
    await user.click(await screen.findByRole('button', { name: 'Crear ficha' }));

    await waitFor(async () => {
      const profile = await db.profile.get('me');
      expect(profile?.heightCm).toBe(190);
      expect(profile?.blockStart).toBe('2026-09-07');
      expect(profile?.targetWeightKg).toEqual([85, 88]);
      expect(profile?.form).toBe(1);
    });
    const week = await db.weeks.get('2026-09-07');
    expect(week?.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 60 });
    expect(await db.medals.count()).toBe(4);
  });
});
