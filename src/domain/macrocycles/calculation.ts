/**
 * Calculation of a macrocycle's planned values per week (pure functions).
 * Rules given by the user on 2026-11-16; see the `macrocycle-calculation`
 * spec. Nothing here is stored; everything is derived on read.
 */

export type WeekLevel = "high" | "medium" | "low";

export type MesocycleType =
  "general_preparation" | "special_preparation" | "competition_preparation";

export const MESOCYCLE_TYPES: readonly MesocycleType[] = [
  "general_preparation",
  "special_preparation",
  "competition_preparation",
];

/** Week-level change of the intensity: ±5 percentage points. */
export const LEVEL_STEP = 0.05;

/** Week-level factor of the weekly reps: ±5 % of the value. */
const WEEKLY_REPS_FACTOR: Record<WeekLevel, number> = {
  high: 1.05,
  medium: 1,
  low: 0.95,
};

const LEVEL_OFFSET: Record<WeekLevel, number> = {
  high: LEVEL_STEP,
  medium: 0,
  low: -LEVEL_STEP,
};

/** Cycle progress of week k (1-based) of N weeks: 0 in week 1, 1 in week N. */
export function cycleProgress(week: number, weeks: number): number {
  if (weeks < 2) return 1;
  return (week - 1) / (weeks - 1);
}

/** The curve shape from 0 to 1: (sin(t·π − π/2) + 1) / 2. */
export function curveShape(t: number): number {
  return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2;
}

/** A point the progression curve passes through: cycle position and %. */
export type CurveAnchor = { t: number; pct: number };

/**
 * The progression curve: from the entry value (week 1) through the inner
 * anchors to 100 % (last week). Inner anchors have 0 < t < 1.
 */
export type Curve = { entryPct: number; anchors: CurveAnchor[] };

/** A curve, or just an entry value (0..1) for the straight line to 100 %. */
type CurveInput = Curve | number;
const asCurve = (curve: CurveInput): Curve =>
  typeof curve === "number" ? { entryPct: curve * 100, anchors: [] } : curve;

/** Natural cubic spline (zero curvature at both ends) through the points. */
function naturalSpline(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length - 1;
  const h = xs.slice(1).map((x, i) => x - xs[i]!);
  const alpha = new Array<number>(n + 1).fill(0);
  for (let i = 1; i < n; i++)
    alpha[i] =
      (3 / h[i]!) * (ys[i + 1]! - ys[i]!) -
      (3 / h[i - 1]!) * (ys[i]! - ys[i - 1]!);
  const l = new Array<number>(n + 1).fill(1);
  const mu = new Array<number>(n + 1).fill(0);
  const z = new Array<number>(n + 1).fill(0);
  for (let i = 1; i < n; i++) {
    l[i] = 2 * (xs[i + 1]! - xs[i - 1]!) - h[i - 1]! * mu[i - 1]!;
    mu[i] = h[i]! / l[i]!;
    z[i] = (alpha[i]! - h[i - 1]! * z[i - 1]!) / l[i]!;
  }
  const c = new Array<number>(n + 1).fill(0);
  const b = new Array<number>(n).fill(0);
  const d = new Array<number>(n).fill(0);
  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j]! - mu[j]! * c[j + 1]!;
    b[j] =
      (ys[j + 1]! - ys[j]!) / h[j]! - (h[j]! * (c[j + 1]! + 2 * c[j]!)) / 3;
    d[j] = (c[j + 1]! - c[j]!) / (3 * h[j]!);
  }
  return (x) => {
    let j = 0;
    while (j < n - 1 && x > xs[j + 1]!) j++;
    const dx = x - xs[j]!;
    return ys[j]! + b[j]! * dx + c[j]! * dx * dx + d[j]! * dx * dx * dx;
  };
}

/**
 * The progression curve's value (1 = 100 %) at cycle progress t: a natural
 * cubic spline through the entry value, the inner anchors and 100 %,
 * capped to 0–100 %.
 */
export function curveValue(curve: CurveInput, t: number): number {
  const { entryPct, anchors } = asCurve(curve);
  const inner = [...anchors].sort((a, b) => a.t - b.t);
  const xs = [0, ...inner.map((a) => a.t), 1];
  const ys = [entryPct, ...inner.map((a) => a.pct), 100];
  const value = naturalSpline(xs, ys)(Math.min(1, Math.max(0, t)));
  return Math.min(100, Math.max(0, value)) / 100;
}

/**
 * Intensity (share of the max values, 1 = 100 %) of a week: the progression
 * curve at its cycle progress t, ±5 points for high/low weeks (a high week
 * may exceed 100 %).
 */
export function intensity(
  curve: CurveInput,
  t: number,
  level: WeekLevel = "medium",
): number {
  return curveValue(curve, t) + LEVEL_OFFSET[level];
}

/**
 * The two inner anchors that approximate the former S-curve for an entry
 * value: at 1/3 and 2/3 of the cycle, 25 % and 75 % of the way to 100 %.
 */
export function sineLikeAnchors(entryPct: number): CurveAnchor[] {
  const at = (share: number) =>
    Math.round((entryPct + (100 - entryPct) * share) * 10) / 10;
  return [
    { t: 1 / 3, pct: at(0.25) },
    { t: 2 / 3, pct: at(0.75) },
  ];
}

/** Whole numbers, halves rounded up (also for values like 5.4999999 = 5.5). */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5 + 1e-9);
}

export type ExerciseValues = {
  referenceLift: "snatch" | "clean_and_jerk" | null;
  bestValuePct: number | null;
  maxWeeklyAverageWeightPct: number | null;
  repsPerSet: { min: number | null; max: number | null };
  repsPerWeek: { min: number | null; max: number | null };
};

export type Goals = { snatchGoalKg: number; cleanAndJerkGoalKg: number };

export type PlannedExercise = {
  bestKg: number | null;
  averageKg: number | null;
  setSize: number | null;
  weeklyReps: number | null;
};

function weightKg(
  intensityValue: number,
  pct: number | null,
  goal: number | null,
): number | null {
  if (pct === null || goal === null) return null;
  return roundHalfUp(intensityValue * (pct / 100) * goal);
}

function falling(
  range: { min: number | null; max: number | null },
  t: number,
): number | null {
  if (range.min === null || range.max === null) return null;
  return range.max - (range.max - range.min) * curveShape(t);
}

/** Planned values of one exercise in a week. */
export function plannedExercise(
  exercise: ExerciseValues,
  goals: Goals,
  curve: CurveInput,
  t: number,
  level: WeekLevel,
): PlannedExercise {
  const value = intensity(curve, t, level);
  const goal =
    exercise.referenceLift === "snatch"
      ? goals.snatchGoalKg
      : exercise.referenceLift === "clean_and_jerk"
        ? goals.cleanAndJerkGoalKg
        : null;
  const setSize = falling(exercise.repsPerSet, t);
  const weeklyReps = falling(exercise.repsPerWeek, t);
  return {
    bestKg: weightKg(value, exercise.bestValuePct, goal),
    averageKg: weightKg(value, exercise.maxWeeklyAverageWeightPct, goal),
    setSize: setSize === null ? null : roundHalfUp(setSize),
    weeklyReps:
      weeklyReps === null
        ? null
        : roundHalfUp(weeklyReps * WEEKLY_REPS_FACTOR[level]),
  };
}

/** Volume: sum of the weekly reps; null without exercises. */
export function volume(exercises: PlannedExercise[]): number | null {
  if (exercises.length === 0) return null;
  return exercises.reduce((sum, e) => sum + (e.weeklyReps ?? 0), 0);
}

export type MesocycleSpan = {
  type: MesocycleType;
  firstWeek: number;
  lastWeek: number;
};

/** Default split: 15 % (floored), 50 % (floored), the rest. */
export function splitMesocycles(weeks: number): MesocycleSpan[] {
  const general = Math.floor(0.15 * weeks);
  const special = Math.floor(0.5 * weeks);
  return [
    { type: "general_preparation", firstWeek: 1, lastWeek: general },
    {
      type: "special_preparation",
      firstWeek: general + 1,
      lastWeek: general + special,
    },
    {
      type: "competition_preparation",
      firstWeek: general + special + 1,
      lastWeek: weeks,
    },
  ];
}

/** The mesocycle a week belongs to. */
export function mesocycleOf(
  week: number,
  spans: MesocycleSpan[],
): MesocycleType {
  const span = spans.find((s) => week >= s.firstWeek && week <= s.lastWeek);
  if (!span) throw new Error(`Week ${week} belongs to no mesocycle`);
  return span.type;
}

/** Blocks from the first weeks of the special and competition preparation. */
export function spansFromBorders(
  weeks: number,
  specialStart: number,
  competitionStart: number,
): MesocycleSpan[] {
  return [
    { type: "general_preparation", firstWeek: 1, lastWeek: specialStart - 1 },
    {
      type: "special_preparation",
      firstWeek: specialStart,
      lastWeek: competitionStart - 1,
    },
    {
      type: "competition_preparation",
      firstWeek: competitionStart,
      lastWeek: weeks,
    },
  ];
}

/** Whether borders leave every block at least one week. */
export function bordersAreValid(
  weeks: number,
  specialStart: number,
  competitionStart: number,
): boolean {
  return (
    Number.isInteger(specialStart) &&
    Number.isInteger(competitionStart) &&
    specialStart >= 2 &&
    competitionStart >= specialStart + 1 &&
    competitionStart <= weeks
  );
}

/**
 * Scales the current block lengths to a new duration (rounded, each block at
 * least one week, the competition preparation block takes the rest).
 */
export function scaleMesocycles(
  spans: MesocycleSpan[],
  weeks: number,
): MesocycleSpan[] {
  const oldWeeks = spans[2]!.lastWeek;
  const length = (s: MesocycleSpan) => s.lastWeek - s.firstWeek + 1;
  let general = Math.max(
    1,
    roundHalfUp((length(spans[0]!) * weeks) / oldWeeks),
  );
  let special = Math.max(
    1,
    roundHalfUp((length(spans[1]!) * weeks) / oldWeeks),
  );
  while (general + special > weeks - 1) {
    if (special > 1) special -= 1;
    else general -= 1;
  }
  return spansFromBorders(weeks, general + 1, general + special + 1);
}
