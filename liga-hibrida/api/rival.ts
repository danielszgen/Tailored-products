// "Pregunta al Rival" (SPEC §10.2): Vercel serverless function that calls the Anthropic API with the
// server-side ANTHROPIC_API_KEY. The key never reaches the client. The app authenticates with the
// secret token Daniel types in Ajustes (RIVAL_APP_TOKEN) and the daily limit is RIVAL_DAILY_LIMIT.
// Relative imports only: the shared domain files carry no path aliases, so Vercel can bundle them.
import { createHash, timingSafeEqual } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import {
  RIVAL_DAILY_LIMIT,
  RIVAL_DEFAULT_MODEL,
  RIVAL_SYSTEM_PROMPT,
  RIVAL_TOKEN_HEADER,
} from '../src/domain/rival/prompt';
import {
  RivalRequestSchema,
  type RivalAnswer,
  type RivalContext,
} from '../src/domain/rival/schema';

/** Vercel function settings: El Rival may think for a while (the Hobby plan allows up to 60 s). */
export const config = { maxDuration: 60 };

// Minimal structural types of the classic Vercel Node signature (no @vercel/node dependency).
export interface RivalRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
export interface RivalResponseLike {
  status(code: number): RivalResponseLike;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

/** The slice of a Messages response the function reads (tests inject a fake client). */
export interface RivalMessageLike {
  stop_reason: string | null;
  content: ReadonlyArray<{ type: string; text?: string }>;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}
export interface RivalClientLike {
  beta: {
    messages: {
      create(params: Anthropic.Beta.MessageCreateParamsNonStreaming): Promise<RivalMessageLike>;
    };
  };
}
export interface RivalDeps {
  createClient?: (apiKey: string) => RivalClientLike;
  now?: () => Date;
}

const EFFORTS = ['low', 'medium', 'high'] as const;
type Effort = (typeof EFFORTS)[number];
const DEFAULT_EFFORT: Effort = 'medium';
/** Room for adaptive thinking plus a day-by-day plan; the answer itself is ≤ 120 words. */
const MAX_TOKENS = 8192;
/** Under `config.maxDuration` so the SDK, not Vercel, reports a timeout. */
const CLIENT_TIMEOUT_MS = 55_000;

const REFUSAL_ANSWER =
  'El Rival no puede responder a esa pregunta. Reformúlala o consúltala con el entrenador humano.';

// --- Daily counter (best effort: serverless instances do not share memory) -----------------------

const dailyCalls = new Map<string, number>();

/** UTC day that keys the per-instance counter. */
export function dailyCounterKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function resetDailyCounter(): void {
  dailyCalls.clear();
}

/** Calls counted so far for `key` on this instance. */
export function dailyCallsUsed(key: string = dailyCounterKey()): number {
  return dailyCalls.get(key) ?? 0;
}

/** Takes one slot of the day; false when the limit is reached. Older days are dropped. */
function takeDailySlot(key: string): boolean {
  for (const other of [...dailyCalls.keys()]) if (other !== key) dailyCalls.delete(other);
  const used = dailyCalls.get(key) ?? 0;
  if (used >= RIVAL_DAILY_LIMIT) return false;
  dailyCalls.set(key, used + 1);
  return true;
}

// --- Helpers -----------------------------------------------------------------------------------

export function parseEffort(value: string | undefined): Effort {
  const normalized = value?.trim().toLowerCase() ?? '';
  return (EFFORTS as readonly string[]).includes(normalized)
    ? (normalized as Effort)
    : DEFAULT_EFFORT;
}

function headerValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

/** Constant-time comparison of the app token (hashes first so lengths may differ). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Vercel parses JSON bodies into objects; raw strings (other content types) are parsed here. */
function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

function buildParams(
  context: RivalContext,
  model: string,
  effort: Effort,
): Anthropic.Beta.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: MAX_TOKENS,
    system: RIVAL_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Contexto (JSON):\n${JSON.stringify(context)}\n\nPregunta: ${context.question}`,
      },
    ],
    thinking: { type: 'adaptive' },
    output_config: { effort },
    // Server-side fallback by refusal category: a policy decline re-runs on the default chain.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  };
}

function defaultClient(apiKey: string): RivalClientLike {
  return new Anthropic({ apiKey, timeout: CLIENT_TIMEOUT_MS, maxRetries: 1 });
}

/** Joins the text blocks; null when the model returned no text at all. */
function toAnswer(response: RivalMessageLike): RivalAnswer | null {
  const usage = response.usage
    ? { input: response.usage.input_tokens, output: response.usage.output_tokens }
    : undefined;
  if (response.stop_reason === 'refusal') {
    return { answer: REFUSAL_ANSWER, model: response.model, usage };
  }
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim();
  if (!text) return null;
  const answer = response.stop_reason === 'max_tokens' ? `${text} […]` : text;
  return { answer, model: response.model, usage };
}

/** Most specific first. Messages never echo the API key, the token or the request. */
function mapError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      status: 500,
      body: { error: 'La clave del servidor no es válida (ANTHROPIC_API_KEY).' },
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      body: { error: 'El Rival está saturado (límite de la API). Inténtalo en un minuto.' },
    };
  }
  if (error instanceof Anthropic.APIError) {
    return {
      status: 502,
      body: { error: `El Rival no responde (API ${error.status ?? 'sin conexión'}).` },
    };
  }
  return { status: 500, body: { error: 'Error inesperado en el servidor.' } };
}

// --- Handler -----------------------------------------------------------------------------------

export default async function handler(
  req: RivalRequestLike,
  res: RivalResponseLike,
  deps: RivalDeps = {},
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const appToken = process.env.RIVAL_APP_TOKEN?.trim() ?? '';
  const sent = headerValue(req.headers[RIVAL_TOKEN_HEADER]);
  if (!appToken || !sent || !safeEqual(sent, appToken)) {
    res.status(401).json({ error: 'Token de la app no válido.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? '';
  if (!apiKey) {
    res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en el servidor.' });
    return;
  }

  const parsed = RivalRequestSchema.safeParse(parseBody(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: 'Contexto no válido.', issues: parsed.error.issues });
    return;
  }

  const now = deps.now ?? (() => new Date());
  if (!takeDailySlot(dailyCounterKey(now()))) {
    res.status(429).json({ error: `Límite diario alcanzado (${RIVAL_DAILY_LIMIT} llamadas).` });
    return;
  }

  const model = process.env.RIVAL_MODEL?.trim() || RIVAL_DEFAULT_MODEL;
  const effort = parseEffort(process.env.RIVAL_EFFORT);
  const createClient = deps.createClient ?? defaultClient;

  try {
    const response = await createClient(apiKey).beta.messages.create(
      buildParams(parsed.data.context, model, effort),
    );
    const answer = toAnswer(response);
    if (!answer) {
      res.status(502).json({ error: 'El Rival no ha devuelto texto. Inténtalo de nuevo.' });
      return;
    }
    res.status(200).json(answer);
  } catch (error) {
    const mapped = mapError(error);
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[rival] ${mapped.status} ${detail}`);
    res.status(mapped.status).json(mapped.body);
  }
}
