import { describe, expect, it } from 'vitest';
import {
  ALL_EXERCISES,
  exercisesForVersion,
  findExercise,
  formatRest,
  formatRir,
  formatSetsReps,
  getExercise,
  GYM_ORDER,
  GYMS,
  isMainLift,
} from '@/domain/content/gyms';

const EXPECTED_IDS: Record<string, string[]> = {
  cantera: [
    'hack_squat',
    'romanian_deadlift',
    'bulgarian_split_squat',
    'leg_press_or_extension',
    'standing_calf_raise',
    'copenhagen_or_cable_adduction',
  ],
  yunque: [
    'bench_press',
    'weighted_pullup',
    'incline_db_press',
    'chest_supported_row',
    'lateral_raise',
    'curl_triceps_superset',
  ],
  resorte: [
    'trap_bar_deadlift',
    'front_foot_elevated_split_squat',
    'hip_thrust',
    'hamstring_curl',
    'lateral_lunge',
    'tibialis_calf_seated',
  ],
  vertigo: [
    'weighted_dip',
    'chinup_neutral',
    'db_military_or_landmine_press',
    'single_arm_cable_row',
    'reverse_fly_face_pull',
    'lateral_raise_hammer_curl_superset',
    'hanging_knee_raise_dead_bug',
  ],
};

describe('gyms content (SPEC §6.5)', () => {
  it('has the four gyms in order with 25 exercises and unique ids', () => {
    expect(GYM_ORDER).toEqual(['cantera', 'yunque', 'resorte', 'vertigo']);
    expect(ALL_EXERCISES).toHaveLength(25);
    expect(new Set(ALL_EXERCISES.map((e) => e.id)).size).toBe(25);
    for (const id of GYM_ORDER) {
      expect(GYMS[id].main.map((e) => e.id)).toEqual(EXPECTED_IDS[id]);
    }
  });

  it('slots are ordered and the first two are main lifts, the rest accessories', () => {
    for (const id of GYM_ORDER) {
      const main = GYMS[id].main;
      main.forEach((e, i) => {
        expect(e.slot).toBe(`${id === 'cantera' || id === 'yunque' ? 'A' : 'B'}${i + 1}`);
        expect(isMainLift(e)).toBe(i < 2);
      });
    }
  });

  it('versions reference existing ids and nest 45 ⊂ 60 ⊂ 75 = all', () => {
    for (const id of GYM_ORDER) {
      const gym = GYMS[id];
      const all = gym.main.map((e) => e.id);
      const { min45, min60, min75 } = gym.versions;
      for (const v of [...min45, ...min60, ...min75]) expect(all).toContain(v);
      for (const v of min45) expect(min60).toContain(v);
      for (const v of min60) expect(min75).toContain(v);
      expect([...min75].sort()).toEqual([...all].sort());
      expect(min45).toHaveLength(4);
      expect(exercisesForVersion(gym, 75).map((e) => e.id)).toEqual(all);
      expect(exercisesForVersion(gym, 45).map((e) => e.id)).toEqual(min45);
    }
    // literal version rules
    expect(GYMS.cantera.versions.min60).not.toContain('standing_calf_raise');
    expect(GYMS.yunque.versions.min60).not.toContain('curl_triceps_superset');
    expect(GYMS.resorte.versions.min60).not.toContain('tibialis_calf_seated');
    expect(GYMS.vertigo.versions.min60).not.toContain('lateral_raise_hammer_curl_superset');
    expect(GYMS.vertigo.versions.min60).toContain('hanging_knee_raise_dead_bug');
  });

  it('transcribes key rows exactly', () => {
    const bench = getExercise('yunque', 'bench_press')!;
    expect(bench.sets).toBe(4);
    expect([bench.repMin, bench.repMax]).toEqual([5, 8]);
    expect(bench.rirTarget).toBe(2);
    expect(bench.restSec).toEqual([150, 180]);
    expect(bench.loadStepKg).toBe(2.5);

    const hack = getExercise('cantera', 'hack_squat')!;
    expect(hack.rirTarget).toEqual([3, 2]);
    expect(hack.loadStepKg).toBe(5);
    expect(hack.sets).toBe(4);

    const dip = getExercise('vertigo', 'weighted_dip')!;
    expect(dip.note).toContain('+20 kg');
    expect(dip.weightedBodyweight).toBe(true);
    expect(dip.restSec).toEqual([120, 150]);

    const bulgarian = getExercise('cantera', 'bulgarian_split_squat')!;
    expect(bulgarian.perSide).toBe(true);
    expect(bulgarian.loadStepKg).toBe(2);

    const cph = getExercise('cantera', 'copenhagen_or_cable_adduction')!;
    expect(cph.isometric).toBe(true);
    expect([cph.secondsMin, cph.secondsMax]).toEqual([20, 30]);
    expect(cph.rirTarget).toEqual([2, 3]);

    const trap = getExercise('resorte', 'trap_bar_deadlift')!;
    expect([trap.sets, trap.repMin, trap.repMax]).toEqual([4, 4, 6]);
    expect(trap.rirTarget).toEqual([3, 2]);

    const lunge = getExercise('resorte', 'lateral_lunge')!;
    expect(lunge.rirTarget).toBe(3);
    expect(lunge.perSide).toBe(true);

    const core = getExercise('vertigo', 'hanging_knee_raise_dead_bug')!;
    expect(core.loadStepKg).toBe(0);
    expect([core.repMin, core.repMax]).toEqual([8, 15]);

    expect(findExercise('weighted_pullup')?.gym.id).toBe('yunque');
    expect(findExercise('nope')).toBeUndefined();
  });

  it('warm-ups are mandatory blocks with tags and fuel texts exist', () => {
    for (const id of GYM_ORDER) {
      const gym = GYMS[id];
      expect(gym.warmup.length).toBeGreaterThanOrEqual(3);
      expect(gym.fuelPre.length).toBeGreaterThan(20);
      expect(gym.fuelPost.length).toBeGreaterThan(10);
      expect(gym.warmupTitle).toContain('obligatori');
    }
    expect(GYMS.cantera.warmup).toHaveLength(5);
    expect(GYMS.resorte.warmup).toHaveLength(5);
    expect(GYMS.vertigo.warmup.some((w) => w.tags?.includes('handstand'))).toBe(true);
    expect(GYMS.cantera.warmup.some((w) => w.tags?.includes('adductor'))).toBe(true);
    expect(GYMS.resorte.warmup.some((w) => w.tags?.includes('adductor'))).toBe(true);
    expect(GYMS.resorte.warmup.some((w) => w.tags?.includes('jump'))).toBe(true);
    expect(GYMS.yunque.warmup.some((w) => w.tags?.includes('wrist_support'))).toBe(true);
    expect(GYMS.cantera.transitionNote).toContain('high-bar squat');
  });

  it('formats RIR, rest and sets×reps like the document', () => {
    expect(formatRir(2)).toBe('2');
    expect(formatRir([3, 2])).toBe('3→2');
    expect(formatRir([1, 2])).toBe('1–2');
    expect(formatRest([150, 180])).toBe('2:30–3:00');
    expect(formatRest([90, 90])).toBe('1:30');
    expect(formatRest([45, 60])).toBe('0:45–1:00');
    expect(formatSetsReps(getExercise('yunque', 'bench_press')!)).toBe('4×5–8');
    expect(formatSetsReps(getExercise('cantera', 'bulgarian_split_squat')!)).toBe('3×8/lado');
    expect(formatSetsReps(getExercise('cantera', 'copenhagen_or_cable_adduction')!)).toBe(
      '2×20–30 s/lado',
    );
    expect(formatSetsReps(getExercise('yunque', 'curl_triceps_superset')!)).toBe('2×10–15 cada');
  });
});
