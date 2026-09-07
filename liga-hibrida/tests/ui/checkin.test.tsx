import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/data';
import { TodayScreen } from '@/features/today';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('HOY · check-in (SPEC §8.2, R1)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-07T08:00:00');
    await resetDb();
    await seedProfile();
  });
  afterEach(() => unfreezeDate());

  it('shows Cantera on Monday 7 Sep and turns KO with wrist 5', async () => {
    const user = userEvent.setup();
    renderAt(<TodayScreen />);
    expect((await screen.findAllByText(/Cantera/)).length).toBeGreaterThan(0);

    const plusWrist = await screen.findByRole('button', { name: 'Sumar 1 a Muñeca 0–10' });
    for (let i = 0; i < 5; i++) await user.click(plusWrist);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findAllByText('KO')).length).toBeGreaterThan(0);
    await waitFor(async () => {
      const row = await db.checkins.get('2026-09-07');
      expect(row?.status).toBe('ko');
      expect(row?.wrist).toBe(5);
    });
  });

  it('all green → OK with PV 100 and an "Entrar a Cantera" CTA', async () => {
    const user = userEvent.setup();
    renderAt(<TodayScreen />);
    await screen.findByRole('button', { name: 'Guardar' });
    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Energía' })).getByRole('radio', { name: '5' }),
    );
    await user.click(
      within(screen.getByRole('radiogroup', { name: 'Piernas' })).getByRole('radio', { name: '5' }),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findAllByText('OK')).length).toBeGreaterThan(0);
    expect(await screen.findByText('PV 100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar a Cantera/ })).toBeInTheDocument();
    const row = await db.checkins.get('2026-09-07');
    expect(row?.pv).toBe(100);
  });
});
