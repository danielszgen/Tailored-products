import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/data';
import { SettingsScreen } from '@/features/settings';
import { NOTIFICATIONS_IOS_NOTE, NOTIFICATIONS_STORAGE_KEY } from '@/lib/notifications';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

describe('Ajustes (SPEC §8.6)', () => {
  beforeEach(async () => {
    freezeDate('2026-09-07T08:00:00');
    await resetDb();
    await seedProfile();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => unfreezeDate());

  it('switches the theme to dark', async () => {
    const user = userEvent.setup();
    renderAt(<SettingsScreen />, '/regen/ajustes');
    await user.click(await screen.findByRole('radio', { name: 'Oscuro' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await user.click(screen.getByRole('radio', { name: 'Claro' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('"Borrar todo" requires typing BORRAR and clears the profile', async () => {
    const user = userEvent.setup();
    renderAt(<SettingsScreen />, '/regen/ajustes');
    await user.click(await screen.findByRole('button', { name: 'Borrar todo' }));
    const confirm = await screen.findByRole('button', { name: 'Borrar definitivamente' });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Confirmación' }), 'BORRAR');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(async () => {
      expect(await db.profile.get('me')).toBeUndefined();
    });
  });

  it('local notifications stay off and read "no disponible" without the Notification API', async () => {
    const user = userEvent.setup();
    renderAt(<SettingsScreen />, '/regen/ajustes');
    const toggle = await screen.findByRole('switch', { name: 'Notificaciones locales' });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('no disponible')).toBeInTheDocument();
    expect(screen.getByText(NOTIFICATIONS_IOS_NOTE)).toBeInTheDocument();

    await user.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(screen.getByText('no disponible')).toBeInTheDocument();
    expect(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)).toBeNull();
  });
});
