// "Pregunta al Rival" (SPEC §10.2): builds the exact context, shows it before the first send,
// asks the Vercel function and keeps every answer as an Adjustment with source 'rival'.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Eyebrow, Pill, Screen, Sheet, Splash } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { listRoutes, listWild, saveAdjustment, useAdjustments } from '@/data';
import { buildRivalContext, serializeRivalContext } from '@/domain/rival/context';
import {
  RIVAL_DAILY_LIMIT,
  RIVAL_MAX_QUESTION_CHARS,
  RIVAL_SYSTEM_PROMPT,
} from '@/domain/rival/prompt';
import { RIVAL_LOG_DAYS, type RivalContext } from '@/domain/rival/schema';
import type { Adjustment } from '@/domain/types';
import { addDaysISO, formatShort } from '@/lib/date';
import { newId } from '@/lib/id';
import { useToday } from '@/features/today/useToday';
import { askRival } from './rivalClient';
import {
  getRivalEndpoint,
  getRivalToken,
  hasSeenRivalPreview,
  markRivalPreviewSeen,
  recordRivalCall,
  rivalCallsToday,
} from './rivalStore';

const SENT_ITEMS = [
  'Tu ficha sin email: nombre, altura, pesos, forma, semana del bloque, modo de comida y notas de dieta.',
  'Los últimos 7 check-ins: sueño, energía, piernas, muñeca, aductor, peso, PV y estado.',
  'Las últimas 6 sesiones resumidas: gimnasio, cargas principales, síntomas y sensación.',
  'Rutas y Zona Salvaje de los últimos 14 días.',
  'El plan de la semana actual y los avisos activos.',
  'Tu pregunta.',
];
const HISTORY_MAX = 10;
const PLACEHOLDER_QUESTION = '(tu pregunta)';
const THINKING = 'El Rival está pensando…';

interface Preview {
  context: RivalContext;
  /** True when the sheet is the first-time gate before sending. */
  send: boolean;
}

interface Answered {
  question: string;
  answer: string;
  model: string;
}

export function RivalScreen() {
  const model = useToday();
  const navigate = useNavigate();
  const { profile, today, checkins28, sessions28, advisories } = model;
  const week = model.week ?? null;
  const from14 = addDaysISO(today, -(RIVAL_LOG_DAYS - 1));
  const logs = useLiveQuery(async () => {
    const [routes, wild] = await Promise.all([
      listRoutes({ from: from14, to: today }),
      listWild({ from: from14, to: today }),
    ]);
    return { routes, wild };
  }, [from14, today]);
  const adjustments = useAdjustments();

  const [question, setQuestion] = useState('');
  const [token] = useState(() => getRivalToken());
  const [calls, setCalls] = useState(() => rivalCallsToday(today));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // The exact JSON of §10.2 (with a placeholder question while the box is empty, so the preview works).
  const built = useMemo(() => {
    if (!profile || !logs) return null;
    try {
      const context = buildRivalContext({
        profile,
        today,
        question: question.trim() || PLACEHOLDER_QUESTION,
        checkins: checkins28,
        sessions: sessions28,
        routes: logs.routes,
        wild: logs.wild,
        week,
        advisories,
      });
      return { context, error: null };
    } catch (e) {
      return { context: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [profile, logs, today, question, checkins28, sessions28, week, advisories]);

  if (profile === undefined || logs === undefined || adjustments === undefined) return <Splash />;
  if (!profile) return null;

  const history = adjustments.filter((a) => a.source === 'rival').slice(0, HISTORY_MAX);

  if (!profile.rivalConsentAt) {
    return (
      <Screen title="Pregunta al Rival" eyebrow="Etapa III · SPEC §10.2" back="/regen">
        <Card eyebrow="Consentimiento" title="Antes de preguntar">
          <p className="text-sm text-ink2 mb-3">
            Nada sale de este iPhone sin tu permiso. Si activas El Rival en Ajustes, cada pregunta
            envía a la función del servidor únicamente esto:
          </p>
          <SentList />
          <p className="text-xs text-ink3 mb-3">
            La clave de Anthropic vive solo en el servidor. Verás el JSON exacto antes del primer
            envío. Límite: {RIVAL_DAILY_LIMIT} preguntas al día.
          </p>
          <Button full onClick={() => navigate('/regen/ajustes')}>
            Activar en Ajustes
          </Button>
        </Card>
        <HistoryCard history={history} />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen title="Pregunta al Rival" eyebrow="Etapa III · SPEC §10.2" back="/regen">
        <Card eyebrow="Token" title="Falta el token de la app">
          <p role="alert" className="text-sm text-ink2 mb-3">
            Falta el token de la app (Ajustes). Es el mismo secreto que RIVAL_APP_TOKEN en el
            servidor; sin él la función rechaza la pregunta.
          </p>
          <Button full variant="secondary" onClick={() => navigate('/regen/ajustes')}>
            Ir a Ajustes
          </Button>
        </Card>
        <HistoryCard history={history} />
      </Screen>
    );
  }

  const context = built?.context ?? null;
  const limitReached = calls >= RIVAL_DAILY_LIMIT;
  const canAsk = !busy && !limitReached && question.trim().length > 0 && context !== null;

  async function send(ctx: RivalContext) {
    setBusy(true);
    setError(null);
    setCopied(null);
    try {
      const result = await askRival({ context: ctx, token, endpoint: getRivalEndpoint() });
      setCalls(recordRivalCall(today));
      setAnswered({ question: ctx.question, answer: result.answer, model: result.model });
      setQuestion('');
      await saveAdjustment({
        id: newId('rival'),
        date: today,
        kind: 'nota',
        detail: `P: ${ctx.question}\nR: ${result.answer}`,
        source: 'rival',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido.');
    } finally {
      setBusy(false);
    }
  }

  function ask() {
    if (!context || !canAsk) return;
    // First time ever: the exact JSON must be seen and accepted before anything leaves the device.
    if (!hasSeenRivalPreview()) {
      setPreview({ context, send: true });
      return;
    }
    void send(context);
  }

  function confirmPreview() {
    if (!preview) return;
    markRivalPreviewSeen();
    const ctx = preview.context;
    setPreview(null);
    void send(ctx);
  }

  async function copy() {
    if (!answered) return;
    try {
      await navigator.clipboard.writeText(answered.answer);
      setCopied('Respuesta copiada al portapapeles.');
    } catch {
      setCopied('No se pudo copiar: selecciona el texto.');
    }
  }

  return (
    <Screen title="Pregunta al Rival" eyebrow="Etapa III · SPEC §10.2" back="/regen">
      <Card
        eyebrow="Tu pregunta"
        title="El Rival responde con tu contexto"
        right={
          <Pill tone={limitReached ? 'ko' : 'neutral'}>
            {calls}/{RIVAL_DAILY_LIMIT} hoy
          </Pill>
        }
      >
        <label className="block">
          <span className="eyebrow block mb-1">Pregunta</span>
          <textarea
            className="input min-h-[96px] py-2"
            aria-label="Pregunta"
            value={question}
            maxLength={RIVAL_MAX_QUESTION_CHARS}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="¿Subo el press banca esta semana?"
            disabled={busy}
          />
        </label>
        <p className="text-xs text-ink3 mt-1 text-right">
          {question.length}/{RIVAL_MAX_QUESTION_CHARS}
        </p>
        {built?.error && (
          <p role="alert" className="text-sm text-status-ko mt-2">
            No se ha podido preparar el contexto: {built.error}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-3">
          <Button full onClick={ask} disabled={!canAsk}>
            Preguntar
          </Button>
          <Button
            full
            variant="secondary"
            onClick={() => context && setPreview({ context, send: false })}
            disabled={busy || !context}
          >
            Ver qué se envía
          </Button>
        </div>
        {limitReached && (
          <p className="text-sm text-status-ko mt-2">
            Límite diario alcanzado ({RIVAL_DAILY_LIMIT} llamadas). Vuelve mañana.
          </p>
        )}
        {busy && (
          <p role="status" className="text-sm text-ink2 mt-2">
            {THINKING}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-status-ko mt-2">
            {error}
          </p>
        )}
      </Card>

      {answered && (
        <Card eyebrow="El Rival" title="Respuesta">
          <p className="text-xs text-ink3 mb-2">P: {answered.question}</p>
          <p className="text-sm text-ink whitespace-pre-wrap" data-testid="rival-answer">
            {answered.answer}
          </p>
          <Eyebrow className="block mt-2">{answered.model}</Eyebrow>
          <Button full variant="secondary" className="mt-3" onClick={copy}>
            Copiar respuesta
          </Button>
          {copied && (
            <p role="status" className="text-sm text-status-ok mt-2">
              {copied}
            </p>
          )}
        </Card>
      )}

      <HistoryCard history={history} />

      <Sheet
        open={preview !== null}
        onClose={() => setPreview(null)}
        title="Qué se envía a El Rival"
        footer={
          preview?.send ? (
            <Button full onClick={confirmPreview}>
              Enviar este contexto
            </Button>
          ) : undefined
        }
      >
        <p className="text-sm text-ink2 mb-3">
          Este JSON es exactamente lo que viaja a la función del servidor: sin email, sin token. El
          servidor le añade el system prompt fijo que puedes leer abajo.
        </p>
        {preview && (
          <pre
            className="text-xs text-ink2 whitespace-pre-wrap break-words"
            data-testid="rival-context"
          >
            {serializeRivalContext(preview.context)}
          </pre>
        )}
        <Collapsible title="System prompt fijo" eyebrow="Lo añade el servidor" className="mt-3">
          <pre className="text-xs whitespace-pre-wrap break-words font-sans">
            {RIVAL_SYSTEM_PROMPT}
          </pre>
        </Collapsible>
      </Sheet>
    </Screen>
  );
}

function SentList() {
  return (
    <ul className="text-sm text-ink2 flex flex-col gap-1 mb-3" aria-label="Qué se envía">
      {SENT_ITEMS.map((item) => (
        <li key={item}>· {item}</li>
      ))}
    </ul>
  );
}

function HistoryCard({ history }: { history: Adjustment[] }) {
  return (
    <Collapsible title="Conversaciones anteriores" eyebrow={`Últimas ${HISTORY_MAX}`}>
      {history.length === 0 ? (
        <p>Todavía no has preguntado nada.</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Conversaciones anteriores">
          {history.map((a) => (
            <li key={a.id}>
              <Eyebrow className="block mb-1">{formatShort(a.date)}</Eyebrow>
              <pre className="text-xs whitespace-pre-wrap break-words font-sans">{a.detail}</pre>
            </li>
          ))}
        </ul>
      )}
    </Collapsible>
  );
}
