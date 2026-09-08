// Ajustes card of "Pregunta al Rival" (SPEC §10.2): the consent switch (stored as
// profile.rivalConsentAt), the secret app token and the endpoint (both in localStorage).
import { useState } from 'react';
import { Card, Eyebrow } from '@/components';
import { updateProfile } from '@/data';
import { RIVAL_DAILY_LIMIT, RIVAL_ENDPOINT } from '@/domain/rival/prompt';
import type { Profile } from '@/domain/types';
import { formatShort, todayISO } from '@/lib/date';
import { getRivalEndpoint, getRivalToken, setRivalEndpoint, setRivalToken } from './rivalStore';

export function RivalSettingsCard({ profile }: { profile: Profile }) {
  const [token, setToken] = useState(() => getRivalToken());
  const [endpoint, setEndpoint] = useState(() => getRivalEndpoint());
  const consent = Boolean(profile.rivalConsentAt);

  return (
    <Card eyebrow="El Rival · SPEC §10.2" title="Pregunta al Rival">
      <label className="flex items-center justify-between gap-3 min-h-touch">
        <span className="text-sm text-ink font-bold">Enviar contexto a El Rival</span>
        <input
          type="checkbox"
          role="switch"
          className="w-5 h-5"
          checked={consent}
          aria-checked={consent}
          onChange={(e) =>
            void updateProfile({ rivalConsentAt: e.target.checked ? todayISO() : undefined })
          }
        />
      </label>
      {profile.rivalConsentAt && (
        <Eyebrow className="block mb-2">
          Consentimiento dado el {formatShort(profile.rivalConsentAt)}
        </Eyebrow>
      )}

      <label className="block mt-3">
        <span className="eyebrow block mb-1">Token de la app</span>
        <input
          className="input"
          type="password"
          aria-label="Token de la app"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setRivalToken(e.target.value);
          }}
          placeholder="El mismo que RIVAL_APP_TOKEN en el servidor"
        />
      </label>

      <label className="block mt-3">
        <span className="eyebrow block mb-1">Endpoint</span>
        <input
          className="input"
          type="url"
          inputMode="url"
          aria-label="Endpoint"
          autoCapitalize="off"
          autoCorrect="off"
          value={endpoint}
          onChange={(e) => {
            setEndpoint(e.target.value);
            setRivalEndpoint(e.target.value);
          }}
          placeholder={RIVAL_ENDPOINT}
        />
      </label>
      <p className="text-xs text-ink3 mt-1">
        Por defecto {RIVAL_ENDPOINT} (la función de este mismo despliegue en Vercel). Cámbialo solo
        si la app se sirve desde otro sitio.
      </p>

      <ul className="text-xs text-ink3 mt-3 flex flex-col gap-1">
        <li>
          · Se envía: ficha sin email, últimos 7 check-ins, últimas 6 sesiones resumidas, rutas y
          Zona Salvaje de 14 días, la semana actual, los avisos activos y tu pregunta.
        </li>
        <li>
          · Nada sale del dispositivo hasta que pulsas «Preguntar»; la primera vez verás el JSON
          exacto antes de enviarlo.
        </li>
        <li>
          · La clave de Anthropic vive solo en el servidor. Límite: {RIVAL_DAILY_LIMIT} llamadas al
          día.
        </li>
      </ul>
    </Card>
  );
}
