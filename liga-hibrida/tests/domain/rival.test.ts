import { describe, expect, it } from 'vitest';
import { buildRivalContext, serializeRivalContext } from '@/domain/rival/context';
import {
  RIVAL_DAILY_LIMIT,
  RIVAL_DEFAULT_MODEL,
  RIVAL_MAX_WORDS,
  RIVAL_SYSTEM_PROMPT,
} from '@/domain/rival/prompt';
import {
  RIVAL_CHECKIN_DAYS,
  RIVAL_FORBIDDEN_KEYS,
  RIVAL_SESSION_COUNT,
  RivalContextSchema,
  RivalRequestSchema,
} from '@/domain/rival/schema';
import { buildOchoSemanas, OCHO_SEMANAS_TODAY, ochoSemanasProfile } from '../fixtures/ochoSemanas';

const file = buildOchoSemanas();

function input(question = '¿Subo el press banca esta semana?') {
  const { tables } = file;
  return {
    profile: { ...ochoSemanasProfile(), squatVariant: 'barbell' as const },
    today: OCHO_SEMANAS_TODAY,
    question,
    checkins: tables.checkins,
    sessions: tables.sessions,
    routes: tables.routes,
    wild: tables.wild,
    week: tables.weeks[7],
    advisories: [{ level: 2 as const, message: 'Piernas cargadas.', source: '04 §6.7 · R4' }],
  };
}

/** Every key at any depth of a JSON value. */
function deepKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => deepKeys(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      deepKeys(v, out);
    }
  }
  return out;
}

describe('"Pregunta al Rival" context (SPEC §10.2)', () => {
  it('sends only the context of §10.2: profile without email, 7 check-ins, 6 sessions, 14-day logs, week, advisories, question', () => {
    const ctx = buildRivalContext(input());
    expect(Object.keys(ctx)).toEqual([
      'app',
      'version',
      'today',
      'question',
      'profile',
      'checkins',
      'sessions',
      'routes',
      'wild',
      'week',
      'advisories',
    ]);
    expect(ctx.profile).toEqual({
      name: 'Daniel',
      heightCm: 190,
      startWeightKg: 79,
      targetWeightKg: [85, 88],
      form: 1,
      blockStart: '2026-09-07',
      weekOfBlock: 9,
      wave: 'Ola 3',
      squatVariant: 'barbell',
      calorieMode: 'porciones',
      kcalBaseline: 3000,
    });
    expect(ctx.checkins).toHaveLength(RIVAL_CHECKIN_DAYS);
    expect(ctx.checkins[0].date).toBe('2026-10-26');
    expect(ctx.checkins[6].date).toBe('2026-11-01');
    expect(ctx.sessions).toHaveLength(RIVAL_SESSION_COUNT);
    expect(ctx.sessions[5]).toMatchObject({
      date: '2026-10-30',
      gym: 'Vértigo',
      statusAtStart: 'ok',
      energy: '4→3',
    });
    expect(ctx.sessions[5].mainLifts).toContain('B1 22,5 kg × 5/5 @ RIR 4');
    expect(ctx.routes.every((r) => r.date >= '2026-10-20')).toBe(true);
    expect(ctx.routes).toHaveLength(3);
    expect(ctx.wild).toHaveLength(1);
    expect(ctx.week?.days).toHaveLength(7);
    expect(ctx.week?.days[0]).toEqual({
      day: 'L',
      am: "Cantera · 60'",
      pm: 'Natación suave',
      fuel: 'ALTA',
    });
    expect(ctx.advisories).toEqual([
      { level: 2, message: 'Piernas cargadas.', source: '04 §6.7 · R4' },
    ]);
    expect(ctx.question).toBe('¿Subo el press banca esta semana?');

    const keys = deepKeys(ctx);
    for (const forbidden of RIVAL_FORBIDDEN_KEYS) expect(keys.has(forbidden)).toBe(false);
    expect(JSON.stringify(ctx)).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(serializeRivalContext(ctx)).toBe(JSON.stringify(ctx, null, 2));
  });

  it('rejects extra keys and empty questions (strict schema shared with the function)', () => {
    const ctx = buildRivalContext(input());
    expect(RivalRequestSchema.safeParse({ context: ctx }).success).toBe(true);
    expect(RivalContextSchema.safeParse({ ...ctx, email: 'x@y.z' }).success).toBe(false);
    expect(
      RivalContextSchema.safeParse({ ...ctx, profile: { ...ctx.profile, email: 'x@y.z' } }).success,
    ).toBe(false);
    expect(() => buildRivalContext(input('   '))).toThrow();
    expect(RivalRequestSchema.safeParse({ context: ctx, token: 'abc' }).success).toBe(false);
  });

  it('works without a stored week and with no logs', () => {
    const ctx = buildRivalContext({
      ...input('Hola'),
      checkins: [],
      sessions: [],
      routes: [],
      wild: [],
      week: null,
      advisories: [],
    });
    expect(ctx.week).toBeNull();
    expect(ctx.checkins).toEqual([]);
    expect(ctx.sessions).toEqual([]);
  });

  it('system prompt carries the Constitution, R1–R11, the no-diagnosis rule and the 120-word limit', () => {
    for (const needle of [
      'salud y técnica',
      'R1 ',
      'R7 ',
      'R11 ',
      'No diagnosticas',
      'valoración profesional',
      `máximo ${RIVAL_MAX_WORDS} palabras`,
      'español',
    ]) {
      expect(RIVAL_SYSTEM_PROMPT).toContain(needle);
    }
    expect(RIVAL_DAILY_LIMIT).toBe(30);
    expect(RIVAL_DEFAULT_MODEL).toBe('claude-opus-5');
  });
});
