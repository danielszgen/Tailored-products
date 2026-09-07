import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, saveCheckin } from '@/data';
import { GymSessionScreen } from '@/features/gym';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('GYM · combat in Cantera (SPEC §8.3)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-07T08:00:00');
    await resetDb();
    await seedProfile();
    await saveCheckin({
      date: '2026-09-07',
      sleepHours: 8,
      energy: 5,
      legs: 5,
      wrist: 0,
      adductor: 0,
      pv: 100,
      status: 'ok',
    });
  });
  afterEach(() => unfreezeDate());

  it('locks the main work until the warm-up is done, logs a set and closes the session', async () => {
    const user = userEvent.setup();
    renderAt(<GymSessionScreen />, '/gym/cantera?version=60', '/gym/:gymId');

    await user.click(await screen.findByRole('button', { name: 'Empezar combate' }));

    // Locked: no set form yet, lock notice visible.
    expect((await screen.findAllByText(/Completa el calentamiento/)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Guardar serie' })).toBeNull();

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(5);
    for (const box of boxes) await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Calentamiento completo' }));

    const saveButtons = await screen.findAllByRole('button', { name: 'Guardar serie' });
    expect(saveButtons.length).toBeGreaterThan(0);

    // First exercise (hack squat): load 60, reps 8, RIR 3.
    const loadInput = screen.getAllByLabelText('Carga')[0];
    await user.clear(loadInput);
    await user.type(loadInput, '60');
    await user.tab();
    const plusReps = screen.getAllByRole('button', { name: 'Sumar 1 a Reps' })[0];
    await user.click(plusReps);
    await user.click(plusReps);
    const rirGroups = screen.getAllByRole('radiogroup', { name: 'RIR' });
    await user.click(
      rirGroups[0].querySelector('[role="radio"][aria-checked="false"]') as HTMLElement,
    );
    await user.click(screen.getAllByRole('button', { name: 'Guardar serie' })[0]);

    await waitFor(async () => {
      const sessions = await db.sessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].exercises[0].sets).toHaveLength(1);
      expect(sessions[0].exercises[0].sets[0].loadKg).toBe(60);
      expect(sessions[0].exercises[0].sets[0].reps).toBe(8);
    });
    expect(screen.getByRole('timer')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Terminar combate' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(dialog.querySelector('button.w-full') as HTMLElement);

    await waitFor(async () => {
      const sessions = await db.sessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].completed).toBe(true);
      expect(sessions[0].warmupDone).toBe(true);
      expect(sessions[0].energyEnd).toBeDefined();
    });
    expect(await screen.findByText(/Resumen del combate/)).toBeInTheDocument();
  });
});
