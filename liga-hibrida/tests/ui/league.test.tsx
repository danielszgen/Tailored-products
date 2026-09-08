import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, ensureMedals, importAll, saveProfile, saveTest } from '@/data';
import { BlockReportScreen, LeagueScreen, LeagueTestScreen } from '@/features/league';
import { RoutesScreen } from '@/features/routes';
import type { LeagueTest } from '@/domain/types';
import { buildOchoSemanas, ochoSemanasProfile } from '../fixtures/ochoSemanas';
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
    expect(cells[3].textContent).toContain('Test');

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
    // Stats show "—" until there is data; week 1 offers the baseline test.
    expect(screen.getByTestId('stat-fuerza')).toHaveTextContent('—');
    expect(
      screen.getByRole('button', { name: 'Registrar baseline (Semana 0)' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Evolucionar a Forma II/ })).toBeDisabled();
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

describe('LIGA with the 8-week fixture (SPEC §9 Etapa III acceptance)', () => {
  beforeEach(async () => {
    freezeDate('2026-11-02T09:00:00'); // Monday of week 9
    localStorage.clear();
    await resetDb();
    await importAll(buildOchoSemanas());
  });
  afterEach(() => unfreezeDate());

  it('shows CANTERA earned in week 5, RESORTE at 67 %, level "Entrenador de Liga" and the stats', async () => {
    renderAt(<LeagueScreen />, '/liga');
    const cantera = await screen.findByTestId('medal-cantera');
    expect(
      within(cantera).getByRole('img', { name: 'Medalla CANTERA conseguida' }),
    ).toBeInTheDocument();
    expect(await within(cantera).findByText('¡Nueva medalla!')).toBeInTheDocument();
    expect(cantera).toHaveTextContent('Conseguida el 5 oct');
    expect(JSON.parse(localStorage.getItem('liga-hibrida:medals-seen') ?? '[]')).toEqual([
      'cantera',
    ]);
    const resorte = screen.getByTestId('medal-resorte');
    expect(resorte).toHaveTextContent('67 %');
    expect(resorte).toHaveTextContent('+10,0 % sobre +15 %');

    expect(screen.getByRole('heading', { name: 'Entrenador de Liga' })).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
    expect(screen.getByTestId('stat-masa')).toHaveTextContent('15');
    expect(screen.getByTestId('stat-fuerza')).toHaveTextContent('19');
    expect(screen.getByTestId('stat-motor')).toHaveTextContent('70');
    expect(screen.getByTestId('stat-control')).toHaveTextContent('67');
    expect(screen.getByTestId('stat-aventura')).toHaveTextContent('88');

    // The medal rows are persisted with the earned date.
    await waitFor(async () => {
      const row = await db.medals.get('cantera');
      expect(row?.earnedOn).toBe('2026-10-05');
    });
    // Board: week 5 shows the medal, tests 4 and 8 are ticked.
    const board = screen.getByRole('list', { name: 'Semanas del bloque' });
    const cells = within(board).getAllByRole('listitem');
    expect(
      within(cells[4]).getByRole('img', { name: 'Medalla CANTERA conseguida' }),
    ).toBeInTheDocument();
    expect(cells[3].textContent).toContain('Test ✓');
    expect(cells[11].textContent).toContain('Test');
    expect(cells[11].textContent).not.toContain('✓');

    // Tests card lists the deltas of week 8 vs week 4.
    const deltas = screen.getByRole('list', { name: 'Deltas Combate de Liga · Semana 8' });
    expect(deltas).toHaveTextContent('Dominada RIR 2 +12,5');
    expect(deltas).toHaveTextContent('Fondo RIR 2 +15');
    expect(deltas).toHaveTextContent('Cintura +0,5 cm');
    // Movement index shows the bench press best mark.
    expect(screen.getByText(/Mejor: 77,5 kg × 8 @ RIR 2 · 20 oct/)).toBeInTheDocument();
  });

  it('evolution is offered only when the 4 conditions are met (3/4 here) and manual SMART marks work', async () => {
    const user = userEvent.setup();
    renderAt(<LeagueScreen />, '/liga');
    const button = await screen.findByRole('button', { name: /Evolucionar a Forma II/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('3/4');
    const conditions = screen.getByRole('list', { name: 'Condiciones de evolución' });
    expect(conditions).toHaveTextContent('Muñecas toleran apoyos');

    const smart3 = screen.getByTestId('smart-3');
    expect(smart3).toHaveTextContent('En progreso');
    await user.click(within(smart3).getByRole('button', { name: /Marcar hecho a mano/ }));
    await waitFor(() => expect(screen.getByTestId('smart-3')).toHaveTextContent('Hecho a mano'));
    const profile = await db.profile.get('me');
    expect(profile?.smartManual?.['3']?.done).toBe(true);
  });

  it('evolves to Forma II after confirmation when the wrists are clean', async () => {
    const file = buildOchoSemanas();
    file.tables.checkins = file.tables.checkins.map((c) => ({ ...c, wrist: 1 }));
    file.tables.sessions = file.tables.sessions.map((s) => ({ ...s, wristDuring: 1 }));
    await importAll(file);
    const user = userEvent.setup();
    renderAt(<LeagueScreen />, '/liga');
    const button = await screen.findByRole('button', { name: /Evolucionar a Forma II/ });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await user.click(await screen.findByRole('button', { name: 'Confirmar evolución' }));
    await waitFor(async () => {
      const profile = await db.profile.get('me');
      expect(profile?.form).toBe(2);
      expect(profile?.evolutions?.[0]).toEqual({ form: 2, date: '2026-11-02' });
    });
    const notes = await db.adjustments.filter((a) => a.kind === 'nota').toArray();
    expect(notes.some((a) => a.detail.includes('Forma II'))).toBe(true);
  });

  it('generates the 12-week report and copies it', async () => {
    const user = userEvent.setup();
    // user-event installs its own clipboard stub on setup: override it afterwards.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderAt(<BlockReportScreen />, '/liga/informe');
    const pre = await screen.findByTestId('block-report');
    expect(pre.textContent).toContain('# Liga Híbrida · Informe del Bloque 1 — Semana 9/12');
    expect(pre.textContent).toContain('| CANTERA | 100 % | conseguida el 5 oct |');
    await user.click(screen.getByRole('button', { name: 'Copiar informe' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('## Medallas'));
    expect(await screen.findByText('Informe copiado al portapapeles.')).toBeInTheDocument();
  });
});

describe('Combate de Liga wizard (acceptance: week 4 saved, week 8 shows deltas)', () => {
  afterEach(() => unfreezeDate());

  async function fillTorso(user: ReturnType<typeof userEvent.setup>, load: string, reps: string) {
    const loadInput = screen.getByLabelText('Dominada lastre (kg)');
    await user.clear(loadInput);
    await user.type(loadInput, load);
    await user.tab();
    const repsInput = screen.getByLabelText('Dominada reps');
    await user.clear(repsInput);
    await user.type(repsInput, reps);
    await user.tab();
  }

  it('saves the week-4 test and, in week 8, compares field by field', async () => {
    freezeDate('2026-09-30T10:00:00'); // Wednesday of week 4
    await resetDb();
    await saveProfile(ochoSemanasProfile());
    await ensureMedals();
    const user = userEvent.setup();
    const first = renderAt(<LeagueTestScreen />, '/liga/combate');
    expect(await screen.findByText('Combate de Liga · Semana 4 · 30 sep')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'S4' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Siguiente' })); // Torso
    expect(screen.getByText('Anterior: baseline 10 kg × 6')).toBeInTheDocument();
    await fillTorso(user, '12,5', '5');
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('radio', { name: 'Igual' }));
    await user.click(screen.getByRole('button', { name: 'Guardar Combate de Liga' }));
    expect(await screen.findByRole('heading', { name: 'Primer test' })).toBeInTheDocument();
    const stored = (await db.tests.get('t_4')) as LeagueTest;
    expect(stored.weekOfBlock).toBe(4);
    expect(stored.pullupRir2).toEqual({ loadKg: 12.5, reps: 5 });
    expect(stored.transferNote).toBe('igual');
    expect(stored.z2Standard).toEqual({ routeKind: 'run', minutes: 45, rpe: 5 });
    first.unmount();

    // Week 8: the wizard proposes S8, shows the week-4 value as "Anterior" and saves the deltas.
    unfreezeDate();
    freezeDate('2026-10-28T10:00:00');
    await saveTest({ ...stored, handstand: { wallSec: 25 } });
    renderAt(<LeagueTestScreen />, '/liga/combate');
    expect(await screen.findByText('Combate de Liga · Semana 8 · 28 oct')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Anterior: 12,5 kg × 5')).toBeInTheDocument();
    expect(screen.getByText('Anterior: baseline 20 kg × 6')).toBeInTheDocument();
    await fillTorso(user, '15', '5');
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    const wall = screen.getByLabelText('Pared (s)');
    await user.clear(wall);
    await user.type(wall, '35');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Guardar Combate de Liga' }));
    const table = await screen.findByRole('table', { name: 'Comparación' });
    expect(table).toHaveTextContent('Dominada RIR 2 (carga×reps)7562,5+12,5');
    expect(table).toHaveTextContent('Handstand pared35 s25 s+10 s');
    expect((await db.tests.toArray()).map((t) => t.weekOfBlock)).toEqual([4, 8]);
  });
});
