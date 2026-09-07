import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ensureMedals } from '@/data';
import { LeagueScreen } from '@/features/league';
import { RoutesScreen } from '@/features/routes';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('LIGA and RUTAS (Etapa I read-only views)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-09T10:00:00');
    await resetDb();
    await seedProfile();
    await ensureMedals();
  });
  afterEach(() => unfreezeDate());

  it('shows the 12-week board with week 1 current, the calendar and 4 locked medals', async () => {
    renderAt(<LeagueScreen />, '/liga');
    const board = await screen.findByRole('list', { name: 'Semanas del bloque' });
    const cells = within(board).getAllByRole('listitem');
    expect(cells).toHaveLength(12);
    expect(cells[0]).toHaveAttribute('aria-current', 'true');
    expect(cells[3].textContent).toContain('Descarga');

    expect(await screen.findByText('Calendario semanal')).toBeInTheDocument();
    const calendarRows = screen
      .getAllByRole('listitem')
      .filter((li) => li.classList.contains('list-item'));
    const monday = calendarRows.find((li) => li.textContent?.startsWith('Lunes'))!;
    expect(monday.textContent).toContain('Cantera');
    const saturday = calendarRows.find((li) => li.textContent?.startsWith('Sábado'))!;
    expect(saturday.textContent).toContain('Zona Salvaje');

    const medals = await screen.findAllByRole('img', { name: /Medalla .* bloqueada/ });
    expect(medals).toHaveLength(4);
  });

  it('RUTAS lists the 7 interference rules and 10 compatibility rows', async () => {
    renderAt(<RoutesScreen />, '/rutas');
    expect(await screen.findByText(/Esta semana · Ola 1/)).toBeInTheDocument();
    expect(screen.getByText("objetivo 90–150'")).toBeInTheDocument();
    const rules = screen.getByText('Reglas de interferencia').closest('details')!;
    expect(within(rules).getAllByRole('listitem')).toHaveLength(7);
    const compat = screen.getByText('Semáforo de compatibilidad').closest('details')!;
    expect(within(compat).getAllByRole('listitem')).toHaveLength(10);
  });
});
