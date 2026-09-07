import { describe, expect, it } from 'vitest';
import {
  adjustSessionForStatus,
  computePv,
  isRising,
  painScore,
  scale5Score,
  sleepScore,
  type PvInput,
} from '@/domain/rules/pv';
import type { Scale5 } from '@/domain/types';
import { adductorHistory, makeCheckin, wristHistory } from '../fixtures/checkins';

const green: PvInput = { sleepHours: 8, energy: 5, legs: 5, wrist: 0, adductor: 0 };

describe('R1 · PV and status (SPEC §7 R1) — truth table', () => {
  it.each([
    [
      '(a) all green → OK 100',
      { ...green },
      [],
      { pv: 100, greens: 4, status: 'ok', koSource: null },
    ],
    [
      '(b) KO by wrist 5, rest green → 87.5 rounds to 88',
      { ...green, wrist: 5 },
      [],
      { pv: 88, greens: 3, status: 'ko', koSource: 'wrist' },
    ],
    [
      '(c) CARGADO by exactly 2 greens (legs 3, wrist 3): 25+25+12.5+17.5 = 80',
      { ...green, legs: 3, wrist: 3 },
      [],
      { pv: 80, greens: 2, status: 'cargado', koSource: null },
    ],
    [
      '(d) CARGADO by pv < 60 with 3 greens: sleep 5 (0) + energy 4 (18.75) + legs 4 (18.75) + pain 2 (20) = 57.5 → 58',
      { sleepHours: 5, energy: 4, legs: 4, wrist: 2, adductor: 0 },
      [],
      { pv: 58, greens: 3, status: 'cargado', koSource: null },
    ],
    [
      '(g) greens ≤ 1 → KO by greens: sleep 6 (8) + energy 2 (6.25) + legs 2 (6.25) + wrist 3 (17.5) = 38',
      { sleepHours: 6, energy: 2, legs: 2, wrist: 3, adductor: 0 },
      [],
      { pv: 38, greens: 0, status: 'ko', koSource: 'greens' },
    ],
    [
      '(h) rising wrist 3,4,5 → KO by wrist (threshold and trend)',
      { ...green, wrist: 5 },
      wristHistory([3, 4]),
      { pv: 88, greens: 3, status: 'ko', koSource: 'wrist' },
    ],
    [
      '(i) rising with low values 0,1,2 → KO (literal rule)',
      { ...green, wrist: 2 },
      wristHistory([0, 1]),
      { pv: 95, greens: 4, status: 'ko', koSource: 'wrist' },
    ],
    [
      '(j1) history [4,4] today 5 → KO by threshold only',
      { ...green, wrist: 5 },
      wristHistory([4, 4]),
      { pv: 88, greens: 3, status: 'ko', koSource: 'wrist' },
    ],
    [
      '(j2) history [2,3] today 3 → not rising, OK by greens (pain 3 is not green: 3 greens, pv 92.5 → 93)',
      { ...green, wrist: 3 },
      wristHistory([2, 3]),
      { pv: 93, greens: 3, status: 'ok', koSource: null },
    ],
    [
      '(l1) wrist 6 and adductor 5 → koSource wrist',
      { ...green, wrist: 6, adductor: 5 },
      [],
      { pv: 85, greens: 3, status: 'ko', koSource: 'wrist' },
    ],
    [
      '(l2) wrist 5 and adductor 6 → koSource adductor',
      { ...green, wrist: 5, adductor: 6 },
      [],
      { pv: 85, greens: 3, status: 'ko', koSource: 'adductor' },
    ],
    [
      '(m) adductor 5 alone → KO by adductor',
      { ...green, adductor: 5 },
      [],
      { pv: 88, greens: 3, status: 'ko', koSource: 'adductor' },
    ],
    [
      'sleep 7 (15) with the rest green → 3 greens, pv 90, OK',
      { ...green, sleepHours: 7 },
      [],
      { pv: 90, greens: 3, status: 'ok', koSource: null },
    ],
    [
      'pain 10 zeroes the pain score: 25+25+25+0 = 75, KO by wrist',
      { ...green, wrist: 10 },
      [],
      { pv: 75, greens: 3, status: 'ko', koSource: 'wrist' },
    ],
  ])('%s', (_name, input, history, expected) => {
    const result = computePv(input as PvInput, history);
    expect(result.pv).toBe(expected.pv);
    expect(result.greens).toBe(expected.greens);
    expect(result.status).toBe(expected.status);
    expect(result.koSource).toBe(expected.koSource);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('(e) sleep score boundaries', () => {
    expect(sleepScore(7.5)).toBe(25);
    expect(sleepScore(8.5)).toBe(25);
    expect(sleepScore(7)).toBe(15);
    expect(sleepScore(6.5)).toBe(15);
    expect(sleepScore(6)).toBe(8);
    expect(sleepScore(5.5)).toBe(0);
    expect(sleepScore(0)).toBe(0);
  });

  it('(f) pain score: 10 → 0, 9 → 2.5, uses the worse of wrist/adductor', () => {
    expect(painScore(10, 0)).toBe(0);
    expect(painScore(0, 10)).toBe(0);
    expect(painScore(9, 0)).toBe(2.5);
    expect(painScore(2, 4)).toBe(15);
    expect(painScore(0, 0)).toBe(25);
  });

  it('(n) energy / legs scores', () => {
    expect(scale5Score(1)).toBe(0);
    expect(scale5Score(3)).toBe(12.5);
    expect(scale5Score(5)).toBe(25);
  });

  it('(k) rising needs two previous samples and only the last two matter', () => {
    expect(isRising([], 5)).toBe(false);
    expect(isRising([4], 5)).toBe(false);
    expect(isRising([3, 4], 5)).toBe(true);
    expect(isRising([9, 1, 2], 3)).toBe(true);
    expect(isRising([0, 3, 2], 4)).toBe(false);
    expect(isRising([3, 3], 4)).toBe(false);
    expect(isRising([3, 4], 4)).toBe(false);
  });

  it('rising adductor also triggers KO with koSource adductor and a Spanish reason', () => {
    const result = computePv({ ...green, adductor: 3 }, adductorHistory([1, 2]));
    expect(result.status).toBe('ko');
    expect(result.koSource).toBe('adductor');
    expect(result.risingAdductor).toBe(true);
    expect(result.reasons.join(' ')).toContain('3 check-ins');
  });

  it('reasons mention the 3-check-in trend for a rising wrist', () => {
    const result = computePv({ ...green, wrist: 5 }, wristHistory([3, 4]));
    expect(result.risingWrist).toBe(true);
    expect(result.reasons.some((r) => r.includes('3 check-ins'))).toBe(true);
  });

  it('never leaves the 0–100 range and always yields a valid status (input grid)', () => {
    const statuses = new Set(['ok', 'cargado', 'ko']);
    for (let sleep = 0; sleep <= 12; sleep += 0.5) {
      for (let energy = 1; energy <= 5; energy++) {
        for (let legs = 1; legs <= 5; legs++) {
          for (let wrist = 0; wrist <= 10; wrist += 2) {
            for (let adductor = 0; adductor <= 10; adductor += 2) {
              const r = computePv({
                sleepHours: sleep,
                energy: energy as Scale5,
                legs: legs as Scale5,
                wrist,
                adductor,
              });
              expect(r.pv).toBeGreaterThanOrEqual(0);
              expect(r.pv).toBeLessThanOrEqual(100);
              expect(Number.isInteger(r.pv)).toBe(true);
              expect(statuses.has(r.status)).toBe(true);
              if (r.status === 'ko') expect(r.koSource).not.toBeNull();
              else expect(r.koSource).toBeNull();
            }
          }
        }
      }
    }
  });

  it('fixture helper stores the computed pv/status on the check-in', () => {
    const c = makeCheckin({ wrist: 5 });
    expect(c.status).toBe('ko');
    expect(c.pv).toBe(88);
    expect(makeCheckin().status).toBe('ok');
  });
});

describe('R1 · effect on the session of the day', () => {
  it('OK → no changes', () => {
    const a = adjustSessionForStatus({ status: 'ok', koSource: null, gymId: 'cantera' });
    expect(a.accessorySetDelta).toBe(0);
    expect(a.rirDelta).toBe(0);
    expect(a.pmToRecovery).toBe(false);
    expect(a.reducedToTechnique).toBe(false);
    expect(a.omitExerciseIds).toEqual([]);
    expect(a.substituteLowerWithMobility).toBe(false);
    expect(a.advisories).toEqual([]);
  });

  it('CARGADO → −1 set on accessories, RIR +1, PM to recovery', () => {
    const a = adjustSessionForStatus({ status: 'cargado', koSource: null, gymId: 'yunque' });
    expect(a.accessorySetDelta).toBe(-1);
    expect(a.rirDelta).toBe(1);
    expect(a.pmToRecovery).toBe(true);
    expect(a.reducedToTechnique).toBe(false);
    expect(a.advisories).toHaveLength(1);
    expect(a.advisories[0].level).toBe(2);
  });

  it('KO by wrist in Vértigo omits handstand and dips', () => {
    const a = adjustSessionForStatus({ status: 'ko', koSource: 'wrist', gymId: 'vertigo' });
    expect(a.reducedToTechnique).toBe(true);
    expect(a.omitExerciseIds).toEqual(['weighted_dip']);
    expect(a.omitWarmupTags).toContain('handstand');
    expect(a.substituteLowerWithMobility).toBe(false);
  });

  it('KO by wrist in Cantera reduces to technique without omissions', () => {
    const a = adjustSessionForStatus({ status: 'ko', koSource: 'wrist', gymId: 'cantera' });
    expect(a.reducedToTechnique).toBe(true);
    expect(a.omitExerciseIds).toEqual([]);
    expect(a.substituteLowerWithMobility).toBe(false);
  });

  it('KO by adductor in Lower gyms substitutes with mobility; assessment message at 3 records', () => {
    const two = adjustSessionForStatus({
      status: 'ko',
      koSource: 'adductor',
      gymId: 'cantera',
      adductorKoStreak: 2,
    });
    expect(two.substituteLowerWithMobility).toBe(true);
    expect(two.advisories.some((x) => x.message.includes('fisioterapeuta'))).toBe(false);

    const three = adjustSessionForStatus({
      status: 'ko',
      koSource: 'adductor',
      gymId: 'resorte',
      adductorKoStreak: 3,
    });
    expect(three.substituteLowerWithMobility).toBe(true);
    const assessment = three.advisories.find((x) => x.message.includes('fisioterapeuta'));
    expect(assessment?.level).toBe(1);
  });

  it('KO by adductor in an Upper gym does not substitute', () => {
    const a = adjustSessionForStatus({ status: 'ko', koSource: 'adductor', gymId: 'yunque' });
    expect(a.substituteLowerWithMobility).toBe(false);
    expect(a.reducedToTechnique).toBe(true);
  });

  it('every advisory carries a hierarchy level 1–5, a message and a source', () => {
    const cases = [
      adjustSessionForStatus({ status: 'cargado', koSource: null, gymId: 'cantera' }),
      adjustSessionForStatus({ status: 'ko', koSource: 'wrist', gymId: 'vertigo' }),
      adjustSessionForStatus({
        status: 'ko',
        koSource: 'adductor',
        gymId: 'cantera',
        adductorKoStreak: 3,
      }),
      adjustSessionForStatus({ status: 'ko', koSource: 'greens', gymId: 'resorte' }),
    ];
    for (const c of cases) {
      expect(c.advisories.length).toBeGreaterThan(0);
      for (const adv of c.advisories) {
        expect(adv.level).toBeGreaterThanOrEqual(1);
        expect(adv.level).toBeLessThanOrEqual(5);
        expect(adv.message.length).toBeGreaterThan(10);
        expect(adv.source.length).toBeGreaterThan(0);
      }
    }
  });
});
