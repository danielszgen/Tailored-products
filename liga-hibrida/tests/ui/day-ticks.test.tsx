// The two daily ticks, through the screens that own them. Both moved from a synchronous
// localStorage read to a live Dexie query in schema v2, so what these prove is that a tap still
// lands in the database — which is the only reason the export can carry it to another device.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/data';
import { RegenScreen } from '@/features/regen';
import { TodayScreen } from '@/features/today';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

const TODAY = '2026-09-09';

describe('the daily ticks reach the database', () => {
  beforeEach(async () => {
    freezeDate(`${TODAY}T09:00:00`);
    await resetDb();
    await seedProfile();
  });
  afterEach(() => unfreezeDate());

  it('REGEN · the creatina tick is stored and read back', async () => {
    const user = userEvent.setup();
    renderAt(<RegenScreen />, '/regen');

    const tick = await screen.findByRole('checkbox', { name: 'Creatina hoy' });
    expect(tick).toHaveAttribute('aria-checked', 'false');

    await user.click(tick);
    await waitFor(async () => {
      expect((await db.days.get(TODAY))?.creatine).toBe(true);
    });
    await waitFor(() => expect(tick).toHaveAttribute('aria-checked', 'true'));

    // Unticking is stored too, so a day is never left ambiguous.
    await user.click(tick);
    await waitFor(async () => {
      expect((await db.days.get(TODAY))?.creatine).toBe(false);
    });
  });

  it('HOY · a Combustible tick is stored and counted', async () => {
    const user = userEvent.setup();
    renderAt(<TodayScreen />);

    const list = await screen.findByRole('list', { name: 'Checklist diario' });
    const [first] = within(list).getAllByRole('checkbox');
    await user.click(first);

    await waitFor(async () => {
      const day = await db.days.get(TODAY);
      expect(Object.values(day?.checklist ?? {}).filter(Boolean)).toHaveLength(1);
    });
    await waitFor(() => expect(first).toHaveAttribute('aria-checked', 'true'));
  });
});
