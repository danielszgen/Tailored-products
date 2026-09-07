// R4 · Interference — SPEC §7 R4 over the tables of §6.7 (document 04): same-day compatibility,
// the 7 rules and the 24 h protection of Lower days. Pure functions over abstract activities.
import type {
  Advisory,
  GymId,
  PlannedItem,
  RouteKind,
  RouteLog,
  WildKind,
  WildLog,
} from '../types';
import type { Light } from '../content/routes';

export type Effort = 'facil' | 'moderada' | 'dura';

export type Activity =
  | { kind: 'lower'; gymId: GymId }
  | { kind: 'upper'; gymId: GymId }
  | { kind: 'route'; routeKind: RouteKind; effort: 'z2' | 'medio' | 'duro'; minutes?: number }
  | { kind: 'wild'; wildKind?: WildKind; intensity?: Effort; minutes?: number }
  | { kind: 'sport'; sport: 'escalada' | 'skate' | 'natacion' | 'otro'; hard?: boolean }
  | { kind: 'regen'; what: 'yoga' | 'movilidad' | 'natacion_suave' | 'paseo' }
  | { kind: 'off' };

export interface InterferenceFinding {
  light: Light;
  /** Number of the interference rule involved (1–7) when one applies. */
  rule?: number;
  combo: string;
  message: string;
  /** Constitution level protected (2 = recuperación). */
  level: 1 | 2;
  source: string;
}

export interface DayEvaluation {
  light: Light;
  findings: InterferenceFinding[];
  advisories: Advisory[];
}

export interface EvaluateDayParams {
  today: Activity[];
  yesterday?: Activity[];
  tomorrow?: Activity[];
}

export const CONFIRM_LABEL = 'Sé lo que hago';
export const TRAIL_LONG_MINUTES = 90;
const SOURCE = '04 §6.7 · R4';

export function activityOf(item: PlannedItem): Activity {
  switch (item.kind) {
    case 'gym':
      return item.gymId === 'cantera' || item.gymId === 'resorte'
        ? { kind: 'lower', gymId: item.gymId }
        : { kind: 'upper', gymId: item.gymId };
    case 'route':
      return { kind: 'route', routeKind: item.routeKind, effort: 'z2', minutes: item.minutes[1] };
    case 'wild':
      return { kind: 'wild', wildKind: item.wildKind };
    case 'sport':
      return { kind: 'sport', sport: item.sport, hard: false };
    case 'regen':
      return { kind: 'regen', what: item.what };
    case 'note':
    case 'off':
      return { kind: 'off' };
  }
}

export function activityOfRoute(route: Pick<RouteLog, 'kind' | 'countsAs' | 'minutes'>): Activity {
  return { kind: 'route', routeKind: route.kind, effort: route.countsAs, minutes: route.minutes };
}

export function activityOfWild(wild: Pick<WildLog, 'kind' | 'intensity' | 'minutes'>): Activity {
  return { kind: 'wild', wildKind: wild.kind, intensity: wild.intensity, minutes: wild.minutes };
}

export function activityOfGym(gymId: GymId): Activity {
  return gymId === 'cantera' || gymId === 'resorte'
    ? { kind: 'lower', gymId }
    : { kind: 'upper', gymId };
}

const isLower = (a: Activity) => a.kind === 'lower';
const isUpper = (a: Activity) => a.kind === 'upper';
const isRoute = (a: Activity, effort?: 'z2' | 'medio' | 'duro', routeKind?: RouteKind) =>
  a.kind === 'route' &&
  (!effort || a.effort === effort) &&
  (!routeKind || a.routeKind === routeKind);
const isWild = (a: Activity, intensity?: Effort, ...kinds: WildKind[]) =>
  a.kind === 'wild' &&
  (!intensity || a.intensity === intensity) &&
  (kinds.length === 0 || (a.wildKind !== undefined && kinds.includes(a.wildKind)));
const isWildHard = (a: Activity) => a.kind === 'wild' && a.intensity === 'dura';
const isTrailLong = (a: Activity) =>
  a.kind === 'wild' &&
  a.wildKind === 'trail' &&
  (a.intensity === 'dura' || (a.minutes !== undefined && a.minutes >= TRAIL_LONG_MINUTES));
const isEasySwim = (a: Activity) =>
  (a.kind === 'regen' && a.what === 'natacion_suave') ||
  (a.kind === 'route' && a.routeKind === 'swim' && a.effort === 'z2') ||
  (a.kind === 'sport' && a.sport === 'natacion' && !a.hard);
const isYoga = (a: Activity) => a.kind === 'regen' && (a.what === 'yoga' || a.what === 'movilidad');
const isClimbTech = (a: Activity) => a.kind === 'sport' && a.sport === 'escalada' && !a.hard;
const isClimbHard = (a: Activity) =>
  (a.kind === 'sport' && a.sport === 'escalada' && !!a.hard) ||
  (a.kind === 'wild' &&
    (a.wildKind === 'climb_outdoor' || a.wildKind === 'boulder') &&
    a.intensity === 'dura');
const isSkateSoft = (a: Activity) =>
  (a.kind === 'sport' && a.sport === 'skate' && !a.hard) ||
  (a.kind === 'wild' && a.wildKind === 'skate' && a.intensity === 'facil');
const isSkate = (a: Activity) =>
  (a.kind === 'sport' && a.sport === 'skate') || (a.kind === 'wild' && a.wildKind === 'skate');
const LEG_WILD: WildKind[] = ['mtb', 'trail', 'skate'];

function finding(
  light: Light,
  combo: string,
  message: string,
  rule?: number,
  level: 1 | 2 = 2,
): InterferenceFinding {
  return { light, combo, message, rule, level, source: SOURCE };
}

/** Same-day compatibility of two activities (the table of §6.7 plus rules 1, 2, 5 and 6). */
export function evaluatePair(a: Activity, b: Activity): InterferenceFinding | null {
  const pair = (fa: (x: Activity) => boolean, fb: (x: Activity) => boolean) =>
    (fa(a) && fb(b)) || (fa(b) && fb(a));
  const other = (f: (x: Activity) => boolean): Activity => (f(a) ? b : a);

  // --- ROJO -----------------------------------------------------------------
  if (pair(isLower, (x) => isRoute(x, 'duro'))) {
    return finding(
      'rojo',
      'Lower AM + running intenso PM',
      'ROJO: nunca duro + duro de piernas.',
      2,
    );
  }
  if (pair(isLower, (x) => isWild(x, 'dura', 'mtb'))) {
    return finding('rojo', 'Lower + MTB fuerte', 'ROJO: nunca duro + duro de piernas.', 2);
  }
  if (pair(isLower, isTrailLong)) {
    return finding(
      'rojo',
      'Trail largo + gimnasio de pierna',
      'ROJO: nunca duro + duro de piernas.',
      2,
    );
  }
  if (pair(isLower, (x) => isWild(x, 'dura', ...LEG_WILD))) {
    return finding(
      'rojo',
      'Lower + aventura dura de piernas',
      'ROJO: nunca duro + duro de piernas.',
      2,
    );
  }
  if (isWildHard(a) && isWildHard(b)) {
    return finding('rojo', 'Dos aventuras duras el mismo día', 'ROJO: nunca duro + duro.', 2);
  }

  // --- ÁMBAR ----------------------------------------------------------------
  if (pair(isLower, (x) => isRoute(x, 'medio'))) {
    return finding(
      'ambar',
      'Lower + ruta media (RPE 7)',
      'ÁMBAR: en dobles, duro + fácil; la ruta no es fácil.',
      2,
    );
  }
  if (pair(isLower, isWildHard)) {
    return finding(
      'ambar',
      'Lower + aventura dura',
      'ÁMBAR: si exige mucho, cuenta como carga media torso+piernas.',
      2,
    );
  }
  if (pair(isLower, (x) => isWild(x, 'moderada'))) {
    return finding(
      'ambar',
      'Lower + aventura moderada',
      'ÁMBAR: piernas primero; llega fresco al Lower.',
      1,
    );
  }
  if (pair(isLower, isSkate)) {
    return finding('ambar', 'Lower + skate', 'ÁMBAR: si hay saltos, no es recuperación.', 1);
  }
  if (pair(isUpper, isClimbHard)) {
    return finding(
      'ambar',
      'Escalada dura + upper pesado mismo día',
      'ÁMBAR: reducir volumen en uno.',
      6,
    );
  }
  if (pair(isSkateSoft, (x) => isRoute(x, 'z2'))) {
    return finding('ambar', 'Skate suave + Z2', 'ÁMBAR: ok si técnico y piernas frescas.');
  }
  if (isRoute(a, 'duro', 'run') || isRoute(b, 'duro', 'run')) {
    return finding(
      'ambar',
      'Running duro',
      'ÁMBAR: running conservador, en las 12 semanas casi todo Z2. La ruta se ha vuelto combate.',
      5,
    );
  }

  // --- VERDE ----------------------------------------------------------------
  if (pair(isLower, isEasySwim)) {
    return finding('verde', 'Lower AM + natación suave PM', 'VERDE');
  }
  if (pair(isUpper, (x) => isRoute(x, 'z2', 'run'))) {
    return finding('verde', 'Upper AM + running Z2 PM', 'VERDE');
  }
  if (pair(isYoga, isClimbTech)) {
    return finding('verde', 'Yoga AM + escalada técnica PM', 'VERDE (vigilar muñeca)');
  }
  if (pair(isUpper, isEasySwim)) {
    return finding('verde', 'Upper + natación Z2', 'VERDE si hombros bien');
  }
  if (pair(isUpper, isClimbTech)) {
    return finding(
      'verde',
      'Upper + escalada técnica',
      'VERDE (vigilar muñeca; escalada cuenta como upper)',
      6,
    );
  }
  void other;
  return null;
}

function worst(lights: Light[]): Light {
  if (lights.includes('rojo')) return 'rojo';
  if (lights.includes('ambar')) return 'ambar';
  return 'verde';
}

const RANK: Record<Light, number> = { rojo: 0, ambar: 1, verde: 2 };

/**
 * Evaluates a day: every pair of same-day activities, plus the 24 h protection of a Lower
 * tomorrow / yesterday's hard load, plus "MTB duro sábado + trail largo domingo".
 */
export function evaluateDay(params: EvaluateDayParams): DayEvaluation {
  const today = params.today.filter((a) => a.kind !== 'off');
  const yesterday = (params.yesterday ?? []).filter((a) => a.kind !== 'off');
  const tomorrow = (params.tomorrow ?? []).filter((a) => a.kind !== 'off');
  const findings: InterferenceFinding[] = [];

  for (let i = 0; i < today.length; i++) {
    for (let j = i + 1; j < today.length; j++) {
      const f = evaluatePair(today[i], today[j]);
      if (f) findings.push(f);
    }
  }
  if (today.length === 1) {
    const f = evaluatePair(today[0], { kind: 'off' });
    if (f) findings.push(f);
  }

  const hardToday = today.some((a) => isRoute(a, 'duro') || isWildHard(a));
  const mediumToday = today.some((a) => isRoute(a, 'medio') || isWild(a, 'moderada'));
  if (tomorrow.some(isLower)) {
    if (hardToday) {
      findings.push(
        finding(
          'rojo',
          'Hoy duro + Lower mañana',
          'ROJO: 24 h de protección, sin intervalos ni desnivel fuerte en las 24 h previas a Lower.',
          3,
        ),
      );
    } else if (mediumToday) {
      findings.push(
        finding(
          'ambar',
          'Hoy medio + Lower mañana',
          'ÁMBAR: piernas primero; llega fresco al Lower de mañana.',
          1,
        ),
      );
    }
  }

  if (today.some(isLower)) {
    const hardYesterday = yesterday.some((a) => isRoute(a, 'duro') || isWildHard(a));
    const mediumYesterday = yesterday.some((a) => isWild(a, 'moderada') || isRoute(a, 'medio'));
    if (hardYesterday) {
      findings.push(
        finding(
          'rojo',
          'Ayer duro + Lower hoy',
          'ROJO: 24 h de protección; ayer hubo carga dura. Cardio previo solo calentamiento.',
          3,
        ),
      );
    } else if (mediumYesterday) {
      findings.push(
        finding('ambar', 'Ayer medio + Lower hoy', 'ÁMBAR: piernas primero; llega fresco.', 1),
      );
    }
  }

  if (yesterday.some((a) => isWild(a, 'dura', 'mtb')) && today.some(isTrailLong)) {
    findings.push(
      finding(
        'rojo',
        'MTB duro sábado + trail largo domingo',
        'ROJO: elegir uno; el otro pasa a paseo/yoga.',
        2,
      ),
    );
  } else if (yesterday.some(isWildHard) && today.some(isWildHard)) {
    findings.push(
      finding('rojo', 'Aventura dura dos días seguidos', 'ROJO: nunca duro + duro.', 2),
    );
  }

  findings.sort((a, b) => RANK[a.light] - RANK[b.light]);
  const light = worst(findings.map((f) => f.light));
  const advisories: Advisory[] = findings
    .filter((f) => f.light !== 'verde')
    .map((f) => ({
      level: f.level,
      message: `${f.combo}: ${f.message}`,
      source: f.source,
      id: `r4_${f.combo}`,
    }));
  return { light, findings, advisories };
}

/** ROJO cannot be placed in the planner without the explicit "Sé lo que hago" confirmation. */
export function needsConfirmation(evaluation: DayEvaluation): boolean {
  return evaluation.light === 'rojo';
}
