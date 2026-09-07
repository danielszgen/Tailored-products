import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, ensureWeek, saveCheckin, saveRegen, saveRoute, saveSession, saveWild } from '@/data';
import { CouncilScreen } from '@/features/regen';
import { makeCheckin } from '../fixtures/checkins';
import {
  makeRegen,
  makeRoute,
  makeSession,
  makeWild,
  sets,
  weightsLinear,
} from '../fixtures/records';
import { BLOCK_START, freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

async function seedWeek1() {
  await ensureWeek({ weekStart: BLOCK_START, weekOfBlock: 1 });
  for (const s of [
    makeSession('cantera', '2026-09-07', { adductorAfter: 1 }),
    makeSession('yunque', '2026-09-08', {
      exercises: [{ exerciseId: 'bench_press', sets: sets(70, [8, 8, 8, 8]) }],
    }),
    makeSession('resorte', '2026-09-10', { adductorAfter: 2 }),
    makeSession('vertigo', '2026-09-11'),
  ]) {
    await saveSession(s);
  }
  await saveRoute(makeRoute('2026-09-08', 45, 5));
  await saveRoute(makeRoute('2026-09-11', 50, 4, { kind: 'bike' }));
  await saveRegen(makeRegen('2026-09-09', 'yoga'));
  await saveRegen(makeRegen('2026-09-13', 'movilidad', 30));
  await saveWild(makeWild('2026-09-12', 'mtb', 120, 'moderada'));
  const weights = weightsLinear('2026-08-31', 14, 79, 0.18);
  for (const w of weights) {
    await saveCheckin(makeCheckin({ date: w.date, sleepHours: 8, weightKg: w.value }));
  }
}

describe('REGEN · Consejo de la Liga (SPEC §9 Etapa II acceptance)', () => {
  afterEach(() => unfreezeDate());

  it('walks the 7 steps, generates week 2 and writes the Markdown report with the scorecard', async () => {
    freezeDate('2026-09-13T19:00:00'); // Sunday of week 1
    await resetDb();
    await seedProfile();
    await seedWeek1();
    const user = userEvent.setup();
    renderAt(<CouncilScreen />, '/regen/consejo');

    expect(await screen.findByText('Adherencia 100 %')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Scorecard' })).toHaveTextContent('Lower · 2/2');

    for (let i = 0; i < 6; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/Semana 2\/12 · Ola 1/)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Semana siguiente' })).toHaveTextContent(
      "Cantera · 60'",
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar el Consejo' }));

    const report = await screen.findByTestId('report');
    expect(report).toHaveTextContent('Consejo de la Liga — Semana 1/12 · Ola 1');
    expect(report).toHaveTextContent('| Lower | 2/2 | 2/2 | 🟢 |');
    expect(report).toHaveTextContent('A1 70 kg × 8/8/8/8 @ RIR 2');
    expect(report).toHaveTextContent('Semana 2/12 · Ola 1 · plantilla Estándar');

    await waitFor(async () => {
      const next = await db.weeks.get('2026-09-14');
      expect(next).toMatchObject({ weekOfBlock: 2, wave: 1, template: 'estandar' });
      expect(next?.days[0].am).toEqual({ kind: 'gym', gymId: 'cantera', version: 60 });
      const council = await db.adjustments.get('council_2026-09-07');
      expect(council?.kind).toBe('plan');
      expect(council?.detail).toContain('## Scorecard');
    });
  });

  it('after week 3 the council generates the deload week 4 with reduced Z2', async () => {
    freezeDate('2026-09-27T19:00:00'); // Sunday of week 3
    await resetDb();
    await seedProfile();
    await ensureWeek({ weekStart: '2026-09-21', weekOfBlock: 3 });
    const user = userEvent.setup();
    renderAt(<CouncilScreen />, '/regen/consejo');

    await screen.findByText('Adherencia 0 %');
    for (let i = 0; i < 6; i++) await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/Semana 4\/12 · Descarga/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar el Consejo' }));

    await waitFor(async () => {
      const next = await db.weeks.get('2026-09-28');
      expect(next?.wave).toBe('deload');
      expect(next?.days[1].pm).toEqual({ kind: 'route', routeKind: 'run', minutes: [30, 40] });
      expect(next?.days[5].am).toMatchObject({
        kind: 'wild',
        note: 'Descarga: aventura solo fácil.',
      });
    });
    expect(await screen.findByTestId('report')).toHaveTextContent('Pésate 5–7 días/sem');
  });
});
