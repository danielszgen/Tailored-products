// Client of api/rival.ts (SPEC §10.2): the only network call of the app. It runs when Daniel presses
// "Preguntar" with consent granted and sends exactly `{ context }`, the RivalContext built by the
// domain, plus the app token header. Errors carry a Spanish message ready for the UI.
import { z } from 'zod';
import { RIVAL_TOKEN_HEADER } from '@/domain/rival/prompt';
import type { RivalAnswer, RivalContext } from '@/domain/rival/schema';

const AnswerSchema = z.object({
  answer: z.string(),
  model: z.string(),
  usage: z.object({ input: z.number(), output: z.number() }).optional(),
});
const ErrorBodySchema = z.object({ error: z.string() });

export const RIVAL_OFFLINE_MESSAGE = 'No hay conexión con El Rival.';

export class RivalError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RivalError';
    this.status = status;
  }
}

export interface AskRivalOptions {
  context: RivalContext;
  token: string;
  endpoint: string;
}

/** What the client reads from a fetch Response (test doubles are plain objects). */
interface ResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  headers?: { get(name: string): string | null };
}

async function readJson(response: ResponseLike): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function askRival({
  context,
  token,
  endpoint,
}: AskRivalOptions): Promise<RivalAnswer> {
  let response: ResponseLike;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [RIVAL_TOKEN_HEADER]: token },
      body: JSON.stringify({ context }),
    });
  } catch {
    throw new RivalError(RIVAL_OFFLINE_MESSAGE);
  }

  const data = await readJson(response);
  if (!response.ok) {
    const body = ErrorBodySchema.safeParse(data);
    throw new RivalError(
      body.success ? body.data.error : `El Rival ha fallado (HTTP ${response.status}).`,
      response.status,
    );
  }

  const answer = AnswerSchema.safeParse(data);
  if (!answer.success) {
    const html = response.headers?.get('content-type')?.includes('text/html') ?? false;
    throw new RivalError(
      html
        ? 'El endpoint no es la función de El Rival: revisa el endpoint en Ajustes.'
        : 'Respuesta de El Rival no reconocida.',
      response.status,
    );
  }
  return answer.data;
}
