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

/**
 * Intensity (share of the max values, 1 = 100 %) for entry value E (0..1):
 * ((1−E)/2)·sin(t·π − π/2) + E + (1−E)/2, ±5 points for high/low weeks.
 */
export function intensity(
  entryValue: number,
  t: number,
  level: WeekLevel = "medium",
): number {
  return entryValue + (1 - entryValue) * curveShape(t) + LEVEL_OFFSET[level];
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
  entryValue: number,
  t: number,
  level: WeekLevel,
): PlannedExercise {
  const value = intensity(entryValue, t, level);
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
