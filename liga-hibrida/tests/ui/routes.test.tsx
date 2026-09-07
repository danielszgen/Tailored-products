import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, ensureWeek } from '@/data';
import { RoutesScreen } from '@/features/routes';
import { BLOCK_START, freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('RUTAS · Zona Salvaje with R5 substitutions (SPEC §9 Etapa II acceptance)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-10T18:00:00'); // Thursday of week 1
    await resetDb();
    await seedProfile();
    await ensureWeek({ weekStart: BLOCK_START, weekOfBlock: 1 });
  });
  afterEach(() => unfreezeDate());

  it("MTB 120' dura on Saturday proposes removing Friday Z2 and warns about Monday Lower; accepting changes the WeekPlan", async () => {
    const user = userEvent.setup();
    renderAt(<RoutesScreen />, '/rutas');
    await user.click(await screen.findByRole('button', { name: 'Zona Salvaje' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Fecha'), { target: { value: '2026-09-12' } });
    const plus = within(dialog).getByRole('button', { name: 'Sumar 15 a Minutos' });
    await user.click(plus);
    await user.click(plus);
    await user.click(within(dialog).getByRole('radio', { name: 'Dura' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Guardar aventura' })).toBeEnabled(),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Guardar aventura' }));

    const proposals = await screen.findByRole('dialog');
    expect(within(proposals).getByText('Sustituciones propuestas')).toBeInTheDocument();
    const friday = within(proposals).getByRole('checkbox', { name: /Eliminar Ruta bici Z2/ });
    expect(friday).toHaveAttribute('aria-checked', 'true');
    expect(
      within(proposals).getByRole('checkbox', { name: /Domingo → recuperación real/ }),
    ).toBeInTheDocument();
    expect(within(proposals).getByText(/Lower A del lunes/)).toBeInTheDocument();

    await user.click(within(proposals).getByRole('button', { name: 'Aplicar 2 cambios' }));

    await waitFor(async () => {
      const week = await db.weeks.get(BLOCK_START);
      expect(week?.days[4].pm).toEqual({ kind: 'off' });
      expect(week?.days[6].am).toEqual({ kind: 'off' });
      expect(week?.substitutions).toHaveLength(2);
      expect(week?.substitutions[0]).toMatchObject({
        date: '2026-09-11',
        removed: "Ruta bici Z2 40–60' · opcional",
      });
    });
    expect(await screen.findByText(/Semana actualizada: 2 cambios/)).toBeInTheDocument();
    expect(await db.wild.count()).toBe(1);
    expect((await db.wild.toArray())[0]).toMatchObject({
      kind: 'mtb',
      minutes: 120,
      intensity: 'dura',
    });
  });

  it('rejecting a proposal keeps that item', async () => {
    const user = userEvent.setup();
    renderAt(<RoutesScreen />, '/rutas?nueva=salvaje');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Fecha'), { target: { value: '2026-09-12' } });
    await user.click(within(dialog).getByRole('radio', { name: 'Dura' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar aventura' }));

    const proposals = await screen.findByRole('dialog');
    await user.click(
      within(proposals).getByRole('checkbox', { name: /Domingo → recuperación real/ }),
    );
    await user.click(within(proposals).getByRole('button', { name: 'Aplicar 1 cambio' }));
    await waitFor(async () => {
      const week = await db.weeks.get(BLOCK_START);
      expect(week?.days[4].pm).toEqual({ kind: 'off' });
      expect(week?.days[6].am).toEqual({ kind: 'regen', what: 'yoga' });
    });
  });
});

describe('RUTAS · route logging with R4 (SPEC §9 Etapa II acceptance)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-13T18:00:00'); // Sunday: Cantera tomorrow
    await resetDb();
    await seedProfile();
    await ensureWeek({ weekStart: BLOCK_START, weekOfBlock: 1 });
  });
  afterEach(() => unfreezeDate());

  it('a hard run the day before Cantera shows ROJO and needs "Sé lo que hago"', async () => {
    const user = userEvent.setup();
    renderAt(<RoutesScreen />, '/rutas');
    await user.click(await screen.findByRole('button', { name: 'Registrar ruta' }));
    const dialog = await screen.findByRole('dialog');

    const box = () => within(dialog).getByTestId('interference');
    await waitFor(() => expect(within(box()).getByText('VERDE')).toBeInTheDocument());

    await user.click(within(dialog).getByRole('radio', { name: '8' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('la ruta se ha vuelto combate');
    expect(within(box()).getByText('ROJO')).toBeInTheDocument();
    expect(within(box()).getByText(/24 h de protección/)).toBeInTheDocument();
    const save = within(dialog).getByRole('button', { name: 'Guardar ruta' });
    expect(save).toBeDisabled();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Sé lo que hago' }));
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(async () => {
      const routes = await db.routes.toArray();
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({ kind: 'run', minutes: 45, rpe: 8, countsAs: 'duro' });
    });
    expect(await screen.findByText(/Ruta guardada \(duro\)/)).toBeInTheDocument();
    expect(screen.getByText(/45' · RPE 8/)).toBeInTheDocument();
  });
});
