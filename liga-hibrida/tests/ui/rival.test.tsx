import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/data';
import { RIVAL_DAILY_LIMIT, RIVAL_ENDPOINT, RIVAL_TOKEN_HEADER } from '@/domain/rival/prompt';
import { RivalScreen, RivalSettingsCard } from '@/features/rival';
import {
  getRivalToken,
  markRivalPreviewSeen,
  recordRivalCall,
  rivalCallsToday,
} from '@/features/rival/rivalStore';
import { formatShort } from '@/lib/date';
import { freezeDate, renderAt, resetDb, seedProfile, unfreezeDate } from './helpers';

const TODAY = '2026-09-08';
const TOKEN = 'secreto-de-daniel';
const QUESTION = '¿Subo el press banca esta semana?';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const fetchMock = vi.fn();

describe('"Pregunta al Rival" (SPEC §10.2)', () => {
  beforeEach(async () => {
    freezeDate(`${TODAY}T09:00:00`);
    await resetDb();
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      jsonResponse(200, { answer: 'Sube 2,5 kg.', model: 'claude-opus-5' }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    unfreezeDate();
  });

  it('without consent explains what would be sent, offers Ajustes and never calls fetch', async () => {
    await seedProfile();
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    renderAt(<RivalScreen />, '/regen/rival');

    expect(await screen.findByRole('button', { name: 'Activar en Ajustes' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Qué se envía' })).toHaveTextContent('Tu pregunta.');
    expect(screen.queryByRole('button', { name: 'Preguntar' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('the first "Preguntar" shows the exact JSON and only sends it after "Enviar este contexto"', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    await user.type(await screen.findByRole('textbox', { name: 'Pregunta' }), QUESTION);
    expect(screen.getByText(`${QUESTION.length}/600`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Preguntar' }));

    const previewText = (await screen.findByTestId('rival-context')).textContent ?? '';
    const preview = JSON.parse(previewText) as { question: string };
    expect(previewText).toContain('"question"');
    expect(preview.question).toBe(QUESTION);
    expect(previewText).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(previewText).not.toContain(TOKEN);
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Enviar este contexto' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RIVAL_ENDPOINT);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)[RIVAL_TOKEN_HEADER]).toBe(TOKEN);
    const body = JSON.parse(String(init.body)) as { context: unknown };
    expect(Object.keys(body)).toEqual(['context']);
    expect(body.context).toEqual(JSON.parse(previewText));

    expect(await screen.findByTestId('rival-answer')).toHaveTextContent('Sube 2,5 kg.');
    await waitFor(async () => {
      const rows = (await db.adjustments.toArray()).filter((a) => a.source === 'rival');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ kind: 'nota', date: TODAY });
      expect(rows[0].detail).toBe(`P: ${QUESTION}\nR: Sube 2,5 kg.`);
    });
    expect(rivalCallsToday(TODAY)).toBe(1);
    expect(screen.getByText(`1/${RIVAL_DAILY_LIMIT} hoy`)).toBeInTheDocument();
    expect(localStorage.getItem('liga-hibrida:rival-preview-seen')).toBe('1');
  });

  it('once the preview has been seen, "Preguntar" sends directly without the sheet', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    markRivalPreviewSeen();
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    await user.type(await screen.findByRole('textbox', { name: 'Pregunta' }), 'Hola');
    await user.click(screen.getByRole('button', { name: 'Preguntar' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByTestId('rival-answer')).toHaveTextContent('Sube 2,5 kg.');
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.context.question).toBe('Hola');
  });

  it('"Ver qué se envía" opens the preview without sending', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    await user.click(await screen.findByRole('button', { name: 'Ver qué se envía' }));
    const pre = await screen.findByTestId('rival-context');
    expect(JSON.parse(pre.textContent ?? '')).toMatchObject({
      app: 'liga-hibrida',
      today: TODAY,
      profile: { name: 'Daniel', weekOfBlock: 1 },
    });
    expect(screen.queryByRole('button', { name: 'Enviar este contexto' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('at 30 calls today the button is disabled with the limit message', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    markRivalPreviewSeen();
    for (let i = 0; i < RIVAL_DAILY_LIMIT; i++) recordRivalCall(TODAY);
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    expect(
      await screen.findByText('Límite diario alcanzado (30 llamadas). Vuelve mañana.'),
    ).toBeInTheDocument();
    expect(screen.getByText(`${RIVAL_DAILY_LIMIT}/${RIVAL_DAILY_LIMIT} hoy`)).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Pregunta' }), 'Hola');
    expect(screen.getByRole('button', { name: 'Preguntar' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server error text on a 401', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    markRivalPreviewSeen();
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Token de la app no válido.' }));
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    await user.type(await screen.findByRole('textbox', { name: 'Pregunta' }), 'Hola');
    await user.click(screen.getByRole('button', { name: 'Preguntar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Token de la app no válido.');
    expect(screen.queryByTestId('rival-answer')).not.toBeInTheDocument();
    expect(rivalCallsToday(TODAY)).toBe(0);
    expect(await db.adjustments.count()).toBe(0);
  });

  it('a network failure says there is no connection', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    localStorage.setItem('liga-hibrida:rival-token', TOKEN);
    markRivalPreviewSeen();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderAt(<RivalScreen />, '/regen/rival');

    await user.type(await screen.findByRole('textbox', { name: 'Pregunta' }), 'Hola');
    await user.click(screen.getByRole('button', { name: 'Preguntar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con El Rival.');
  });

  it('without a stored token points to Ajustes', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    renderAt(<RivalScreen />, '/regen/rival');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falta el token de la app (Ajustes)',
    );
    expect(screen.queryByRole('button', { name: 'Preguntar' })).not.toBeInTheDocument();
  });
});

describe('Ajustes · RivalSettingsCard', () => {
  beforeEach(async () => {
    freezeDate(`${TODAY}T09:00:00`);
    await resetDb();
    localStorage.clear();
  });
  afterEach(() => unfreezeDate());

  it('the switch stores the consent date in the profile and the token goes to localStorage', async () => {
    await seedProfile();
    const profile = (await db.profile.get('me'))!;
    const user = userEvent.setup();
    renderAt(<RivalSettingsCard profile={profile} />, '/regen/ajustes');

    const consent = screen.getByRole('switch', { name: 'Enviar contexto a El Rival' });
    expect(consent).not.toBeChecked();
    await user.click(consent);
    await waitFor(async () => {
      expect((await db.profile.get('me'))?.rivalConsentAt).toBe(TODAY);
    });

    await user.type(screen.getByLabelText('Token de la app'), TOKEN);
    expect(getRivalToken()).toBe(TOKEN);
    expect(screen.getByLabelText('Endpoint')).toHaveValue(RIVAL_ENDPOINT);
  });

  it('the switch clears the consent when unchecked', async () => {
    await seedProfile({ rivalConsentAt: '2026-09-07' });
    const profile = (await db.profile.get('me'))!;
    const user = userEvent.setup();
    renderAt(<RivalSettingsCard profile={profile} />, '/regen/ajustes');

    expect(screen.getByText(/Consentimiento dado el/)).toHaveTextContent(
      `Consentimiento dado el ${formatShort('2026-09-07')}`,
    );
    await user.click(screen.getByRole('switch', { name: 'Enviar contexto a El Rival' }));
    await waitFor(async () => {
      expect((await db.profile.get('me'))?.rivalConsentAt).toBeUndefined();
    });
  });
});
