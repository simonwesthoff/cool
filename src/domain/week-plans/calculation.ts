/**
 * Pure calculations of a week plan: the week's actual values per exercise
 * and their deviation from the macrocycle projection. No server imports.
 */

export type SetGroupValues = {
  sets: number;
  reps: number;
  /** Null for exercises without a weight (e.g. body weight). */
  weightKg: number | null;
};

/** One exercise's values over all sessions of the week. */
export type WeekActuals = {
  /** Heaviest weight of all set groups; null without weights. */
  heaviestKg: number | null;
  /** mHG: average weight over all reps with a weight; null without weights. */
  averageKg: number | null;
  /** Average reps per set; null without sets. */
  setSize: number | null;
  /** Sum of all reps; null without sets (nothing to compare). */
  weeklyReps: number | null;
};

/** The week's actual values of one exercise from all its set groups. */
export function weekActuals(groups: SetGroupValues[]): WeekActuals {
  let sets = 0;
  let reps = 0;
  let weightedReps = 0;
  let load = 0;
  let heaviest: number | null = null;
  for (const g of groups) {
    sets += g.sets;
    reps += g.sets * g.reps;
    if (g.weightKg !== null) {
      weightedReps += g.sets * g.reps;
      load += g.sets * g.reps * g.weightKg;
      heaviest =
        heaviest === null ? g.weightKg : Math.max(heaviest, g.weightKg);
    }
  }
  return {
    heaviestKg: heaviest,
    averageKg: weightedReps > 0 ? round1(load / weightedReps) : null,
    setSize: sets > 0 ? round1(reps / sets) : null,
    weeklyReps: sets > 0 ? reps : null,
  };
}

export type Deviation = "above" | "below" | "within";

/** Share by which an actual value may differ from its projection. */
export const TOLERANCE = 0.05;

/**
 * Whether an actual value is more than 5 % above or below its projection;
 * null when either is missing (no comparison).
 */
export function deviation(
  actual: number | null,
  projected: number | null,
): Deviation | null {
  if (actual === null || projected === null || projected <= 0) return null;
  // Small epsilon so exactly 5 % (e.g. 72.45 vs 69) counts as within.
  const limit = projected * TOLERANCE + 1e-9;
  if (actual - projected > limit) return "above";
  if (projected - actual > limit) return "below";
  return "within";
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
