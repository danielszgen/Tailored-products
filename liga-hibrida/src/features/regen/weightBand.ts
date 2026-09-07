import { roundTo } from '@/lib/math';

/** Target band bounds after `weeks` weeks: +0,10 % and +0,25 % per week, compounded (SPEC §8.6). */
export function targetBand(startWeightKg: number, weeks: number): [number, number] {
  return [
    roundTo(startWeightKg * Math.pow(1.001, weeks), 2),
    roundTo(startWeightKg * Math.pow(1.0025, weeks), 2),
  ];
}
