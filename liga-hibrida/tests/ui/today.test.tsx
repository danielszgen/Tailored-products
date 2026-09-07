import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, ensureWeek, saveCheckin } from '@/data';
import { TodayScreen } from '@/features/today';
import { makeCheckin, wristHistory } from '../fixtures/checkins';
import { BLOCK_START, freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('HOY · Combustible (R6), symptoms (R8) and cuts (R9)', () => {
  afterEach(() => unfreezeDate());

  it('Cantera AM + natación PM shows Combustible ALTA with the Cantera pre text (acceptance)', async () => {
    freezeDate('2026-09-07T08:00:00');
    await resetDb();
    await seedProfile();
    renderAt(<TodayScreen />);

    expect(await screen.findByText('Tipo de día: Pierna + natación suave')).toBeInTheDocument();
    expect(screen.getByText('ALTA')).toBeInTheDocument();
    expect(screen.getByText(/30–40 g proteína \+ 80–120 g CH/)).toBeInTheDocument();
    expect(screen.getByText(/Post 0–2 h → 30–40 g prot \+ 80–120 g CH/)).toBeInTheDocument();
    // Interference light on the plan cards: Lower + natación suave → VERDE.
    expect((await screen.findAllByText('VERDE')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Registrar ruta' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Zona Salvaje' })).toBeEnabled();
  });

  it('wrist 3, 4, 5 over three check-ins → level 1 warning and KO on supports (acceptance)', async () => {
    freezeDate('2026-09-09T08:00:00');
    await resetDb();
    await seedProfile();
    await saveCheckin(makeCheckin({ date: '2026-09-07', wrist: 3 }));
    await saveCheckin(makeCheckin({ date: '2026-09-08', wrist: 4, history: wristHistory([3]) }));
    const user = userEvent.setup();
    renderAt(<TodayScreen />);

    const plusWrist = await screen.findByRole('button', { name: 'Sumar 1 a Muñeca 0–10' });
    for (let i = 0; i < 5; i++) await user.click(plusWrist);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findAllByText('KO')).length).toBeGreaterThan(0);
    expect(await screen.findByText(/reduce exposición/)).toBeInTheDocument();
    expect(screen.getByText('Muñeca 5/10 (≥ 5): KO en apoyos.')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await db.checkins.get('2026-09-09'))?.status).toBe('ko');
    });
  });

  it('3+ CARGADO/KO days trigger the R9 cut card; applying it changes the week', async () => {
    freezeDate('2026-09-10T08:00:00');
    await resetDb();
    await seedProfile();
    await ensureWeek({ weekStart: BLOCK_START, weekOfBlock: 1 });
    for (const date of ['2026-09-07', '2026-09-08', '2026-09-09']) {
      await saveCheckin(makeCheckin({ date, sleepHours: 7, energy: 3 }));
    }
    const user = userEvent.setup();
    renderAt(<TodayScreen />);

    expect(await screen.findByText('Eliminar C (opcional)')).toBeInTheDocument();
    expect(screen.getAllByText(/3 días CARGADO\/KO esta semana/).length).toBeGreaterThan(0);
    const boxes = screen.getAllByRole('checkbox', { name: /Eliminar/ });
    expect(boxes).toHaveLength(2);
    expect(within(boxes[1]).getByText(/Zona Salvaje/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aplicar recorte (2)' }));
    await waitFor(async () => {
      const week = await db.weeks.get(BLOCK_START);
      expect(week?.days[4].pm).toEqual({ kind: 'off' });
      expect(week?.days[5].am).toEqual({ kind: 'off' });
      expect(week?.substitutions).toHaveLength(2);
    });
  });
});
