import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, saveCheckin } from '@/data';
import { RegenScreen } from '@/features/regen';
import { makeCheckin } from '../fixtures/checkins';
import { weightsLinear } from '../fixtures/records';
import { BLOCK_START, freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('REGEN · kcal proposal (R7) and regen log', () => {
  beforeEach(async () => {
    freezeDate('2026-09-23T09:00:00'); // week 3
    await resetDb();
    await seedProfile();
    for (const w of weightsLinear(BLOCK_START, 14, 79, 0.05)) {
      await saveCheckin(makeCheckin({ date: w.date, weightKg: w.value }));
    }
  });
  afterEach(() => unfreezeDate());

  it('week 3 with +0,05 %/sem proposes "+150 a +200 kcal/día" and stores it when accepted', async () => {
    const user = userEvent.setup();
    renderAt(<RegenScreen />, '/regen');
    await waitFor(() =>
      expect(screen.getByTestId('kcal-text')).toHaveTextContent('+150 a +200 kcal/día'),
    );
    expect(screen.getByText('Sube < 0,10 %/sem')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Anotar el ajuste' }));
    await waitFor(async () => {
      const row = await db.adjustments.get('kcal_2026-09-21');
      expect(row?.kind).toBe('kcal');
      expect(row?.detail).toContain('+150 a +200 kcal/día');
    });
    expect(await screen.findByText(/Anotado el/)).toBeInTheDocument();
  });

  it('logs a regen session and updates the weekly counters', async () => {
    const user = userEvent.setup();
    renderAt(<RegenScreen />, '/regen');
    await user.click(await screen.findByRole('button', { name: 'Guardar sesión regen' }));
    await waitFor(async () => {
      const rows = await db.regen.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ kind: 'muneca', minutes: 10, date: '2026-09-23' });
    });
    expect(await screen.findByText(/Muñeca 10'/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: "Muñeca 8–12'" })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    expect(screen.getByText('muñeca 1/3 · aductor 0/2')).toBeInTheDocument();
  });
});
