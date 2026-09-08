// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import handler, {
  dailyCallsUsed,
  dailyCounterKey,
  parseEffort,
  resetDailyCounter,
  type RivalClientLike,
  type RivalDeps,
  type RivalMessageLike,
  type RivalRequestLike,
  type RivalResponseLike,
} from '../../api/rival';
import { buildRivalContext } from '@/domain/rival/context';
import {
  RIVAL_DAILY_LIMIT,
  RIVAL_DEFAULT_MODEL,
  RIVAL_SYSTEM_PROMPT,
  RIVAL_TOKEN_HEADER,
} from '@/domain/rival/prompt';
import { buildOchoSemanas, OCHO_SEMANAS_TODAY, ochoSemanasProfile } from '../fixtures/ochoSemanas';

const TOKEN = 'secreto-de-daniel';
const API_KEY = 'sk-ant-test-key';
const NOW = new Date('2026-11-02T10:00:00Z');
const file = buildOchoSemanas();

function context(question = '¿Subo el press banca esta semana?') {
  const { tables } = file;
  return buildRivalContext({
    profile: ochoSemanasProfile(),
    today: OCHO_SEMANAS_TODAY,
    question,
    checkins: tables.checkins,
    sessions: tables.sessions,
    routes: tables.routes,
    wild: tables.wild,
    week: tables.weeks[7],
    advisories: [{ level: 2, message: 'Piernas cargadas.', source: '04 §6.7 · R4' }],
  });
}

const OK_MESSAGE: RivalMessageLike = {
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'Hola' }],
  model: 'claude-opus-5',
  usage: { input_tokens: 10, output_tokens: 5 },
};

interface MockResponse extends RivalResponseLike {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

function mockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 0,
    headers: {},
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    setHeader(name, value) {
      res.headers[name] = value;
    },
    json(body) {
      res.body = body;
    },
  };
  return res;
}

function fakeClient(result: RivalMessageLike | Error = OK_MESSAGE) {
  const create = vi.fn<RivalClientLike['beta']['messages']['create']>();
  if (result instanceof Error) create.mockRejectedValue(result);
  else create.mockResolvedValue(result);
  const createClient = vi.fn((_apiKey: string): RivalClientLike => ({
    beta: { messages: { create } },
  }));
  return { create, createClient };
}

async function call(req: Partial<RivalRequestLike> = {}, deps: RivalDeps = {}) {
  const res = mockRes();
  const request: RivalRequestLike = {
    method: 'POST',
    headers: { [RIVAL_TOKEN_HEADER]: TOKEN },
    body: { context: context() },
    ...req,
  };
  await handler(request, res, { now: () => NOW, ...deps });
  return res;
}

describe('api/rival.ts (SPEC §10.2)', () => {
  beforeEach(() => {
    resetDailyCounter();
    vi.stubEnv('ANTHROPIC_API_KEY', API_KEY);
    vi.stubEnv('RIVAL_APP_TOKEN', TOKEN);
    vi.stubEnv('RIVAL_MODEL', '');
    vi.stubEnv('RIVAL_EFFORT', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('only accepts POST', async () => {
    const { createClient } = fakeClient();
    const res = await call({ method: 'GET' }, { createClient });
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects a wrong, missing or unconfigured app token with 401', async () => {
    const { createClient } = fakeClient();
    expect(
      (await call({ headers: { [RIVAL_TOKEN_HEADER]: 'otro' } }, { createClient })).statusCode,
    ).toBe(401);
    expect((await call({ headers: {} }, { createClient })).statusCode).toBe(401);
    expect(
      (await call({ headers: { [RIVAL_TOKEN_HEADER]: ['x', TOKEN] } }, { createClient }))
        .statusCode,
    ).toBe(401);

    vi.stubEnv('RIVAL_APP_TOKEN', '');
    const res = await call({ headers: { [RIVAL_TOKEN_HEADER]: '' } }, { createClient });
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Token de la app no válido.' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('answers 500 when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { createClient } = fakeClient();
    const res = await call({}, { createClient });
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Falta ANTHROPIC_API_KEY en el servidor.' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('refuses an invalid context (extra keys, missing body, bad JSON) with 400 and issues', async () => {
    const { createClient } = fakeClient();
    const res = await call(
      { body: { context: { ...context(), email: 'daniel@example.com' } } },
      { createClient },
    );
    expect(res.statusCode).toBe(400);
    const body = res.body as { error: string; issues: { code: string }[] };
    expect(body.error).toBe('Contexto no válido.');
    expect(body.issues.length).toBeGreaterThan(0);
    expect(body.issues[0].code).toBe('unrecognized_keys');

    expect((await call({ body: undefined }, { createClient })).statusCode).toBe(400);
    expect((await call({ body: '{not json' }, { createClient })).statusCode).toBe(400);
    expect(
      (await call({ body: { context: context(), token: 'x' } }, { createClient })).statusCode,
    ).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
    expect(dailyCallsUsed(dailyCounterKey(NOW))).toBe(0);
  });

  it('calls the API with the fixed system prompt and returns { answer, model, usage }', async () => {
    const { create, createClient } = fakeClient();
    const ctx = context();
    const res = await call({ body: JSON.stringify({ context: ctx }) }, { createClient });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      answer: 'Hola',
      model: 'claude-opus-5',
      usage: { input: 10, output: 5 },
    });
    expect(createClient).toHaveBeenCalledWith(API_KEY);
    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0][0];
    expect(params.model).toBe(RIVAL_DEFAULT_MODEL);
    expect(params.system).toBe(RIVAL_SYSTEM_PROMPT);
    expect(params.thinking).toEqual({ type: 'adaptive' });
    expect(params.output_config).toEqual({ effort: 'medium' });
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params.fallbacks).toBe('default');
    expect(params.messages).toHaveLength(1);
    const content = String(params.messages[0].content);
    expect(content).toContain(JSON.stringify(ctx));
    expect(content).toContain(`Pregunta: ${ctx.question}`);
    expect(content).not.toContain(API_KEY);
    expect(content).not.toContain(TOKEN);
    expect(dailyCallsUsed(dailyCounterKey(NOW))).toBe(1);
  });

  it('reads RIVAL_MODEL and RIVAL_EFFORT from the environment', async () => {
    vi.stubEnv('RIVAL_MODEL', 'claude-sonnet-5');
    vi.stubEnv('RIVAL_EFFORT', 'HIGH');
    const { create, createClient } = fakeClient();
    await call({}, { createClient });
    expect(create.mock.calls[0][0].model).toBe('claude-sonnet-5');
    expect(create.mock.calls[0][0].output_config).toEqual({ effort: 'high' });
    expect(parseEffort('xhigh')).toBe('medium');
    expect(parseEffort(undefined)).toBe('medium');
    expect(parseEffort(' low ')).toBe('low');
  });

  it('turns a refusal into an answer that says El Rival cannot answer', async () => {
    const { createClient } = fakeClient({
      stop_reason: 'refusal',
      content: [],
      model: 'claude-opus-5',
      usage: { input_tokens: 10, output_tokens: 0 },
    });
    const res = await call({}, { createClient });
    expect(res.statusCode).toBe(200);
    const body = res.body as { answer: string; model: string };
    expect(body.answer).toContain('El Rival no puede responder a esa pregunta');
    expect(body.model).toBe('claude-opus-5');
  });

  it('joins the text blocks, skips thinking blocks and marks truncated answers', async () => {
    const { createClient } = fakeClient({
      stop_reason: 'max_tokens',
      content: [
        { type: 'thinking', text: 'secreto' },
        { type: 'text', text: 'Primera parte.' },
        { type: 'text', text: 'Segunda parte' },
      ],
      model: 'claude-opus-5',
    });
    const res = await call({}, { createClient });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      answer: 'Primera parte.\nSegunda parte […]',
      model: 'claude-opus-5',
    });
  });

  it('answers 502 when the model returned no text', async () => {
    const { createClient } = fakeClient({ stop_reason: 'end_turn', content: [], model: 'm' });
    const res = await call({}, { createClient });
    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: 'El Rival no ha devuelto texto. Inténtalo de nuevo.' });
  });

  it('enforces the daily limit: the 31st call of the day is refused with 429', async () => {
    const { create, createClient } = fakeClient();
    for (let i = 0; i < RIVAL_DAILY_LIMIT; i++) {
      expect((await call({}, { createClient })).statusCode).toBe(200);
    }
    const res = await call({}, { createClient });
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: `Límite diario alcanzado (${RIVAL_DAILY_LIMIT} llamadas).` });
    expect(create).toHaveBeenCalledTimes(RIVAL_DAILY_LIMIT);

    // A new UTC day resets the counter.
    const tomorrow = new Date('2026-11-03T00:00:01Z');
    expect((await call({}, { createClient, now: () => tomorrow })).statusCode).toBe(200);
    expect(dailyCallsUsed(dailyCounterKey(tomorrow))).toBe(1);
    expect(dailyCallsUsed(dailyCounterKey(NOW))).toBe(0);
  });

  it('maps SDK errors without echoing secrets', async () => {
    const headers = new Headers();
    const auth = await call(
      {},
      fakeClient(new Anthropic.AuthenticationError(401, undefined, `bad key ${API_KEY}`, headers)),
    );
    expect(auth.statusCode).toBe(500);
    expect(JSON.stringify(auth.body)).toContain('clave del servidor');
    expect(JSON.stringify(auth.body)).not.toContain(API_KEY);

    const rate = await call(
      {},
      fakeClient(new Anthropic.RateLimitError(429, undefined, 'slow down', headers)),
    );
    expect(rate.statusCode).toBe(429);

    const api = await call(
      {},
      fakeClient(new Anthropic.InternalServerError(500, undefined, 'boom', headers)),
    );
    expect(api.statusCode).toBe(502);
    expect(api.body).toEqual({ error: 'El Rival no responde (API 500).' });

    const other = await call({}, fakeClient(new Error(`leak ${TOKEN}`)));
    expect(other.statusCode).toBe(500);
    expect(JSON.stringify(other.body)).not.toContain(TOKEN);
  });
});
