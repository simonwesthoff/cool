/**
 * "Autofill" in step 2 of the week editor: sets for an exercise that meet
 * its projection (best value, mHG, set size, weekly reps) as closely as
 * the rules allow. Pure functions, no I/O.
 */
import type { PlannedExercise } from "@/domain/macrocycles/calculation";
import { deviation, weekActuals } from "./calculation";

export type PrefilledSet = { weightKg: number; reps: number };

/** Sets and reps per set the week editor allows. */
const MAX_SETS = 10;
const MAX_REPS = 30;
/** The usual weight jump, and the most a jump may be. */
const JUMP = 5;

/** Whole reps per session: earlier sessions get the extra reps. */
export function splitReps(total: number, sessions: number): number[] {
  const base = Math.floor(total / sessions);
  const extra = total % sessions;
  return Array.from({ length: sessions }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Reps per set that never rise: `reps` over sets close to `setSize`. */
export function repsPerSet(reps: number, setSize: number): number[] {
  if (reps <= 0) return [];
  const n = Math.min(
    Math.max(Math.round(reps / setSize), 1, Math.ceil(reps / MAX_REPS)),
    MAX_SETS,
    reps,
  );
  const base = Math.floor(reps / n);
  const extra = reps % n;
  return Array.from({ length: n }, (_, i) =>
    Math.min(base + (i < extra ? 1 : 0), MAX_REPS),
  );
}

const meanOf = (weights: number[], reps: number[]) =>
  weekActuals(
    weights.map((weightKg, i) => ({ sets: 1, reps: reps[i]!, weightKg })),
  ).averageKg!;

/**
 * Weights for the given reps: ending at `best`, rising in steps of 0 or
 * 5 kg, where only the jump into the first set at `best` may be 1–5 kg.
 * Within 5 % of the mHG, the candidate with the fewest jumps wins,
 * then the closest one; otherwise the closest one, then the fewest jumps.
 */
export function weightsFor(
  reps: number[],
  best: number,
  mhg: number,
): number[] {
  const n = reps.length;
  type Candidate = { weights: number[]; jumps: number; distance: number };
  let pick: Candidate | null = null;
  const better = (a: Candidate, b: Candidate) => {
    const aIn = deviation(meanOf(a.weights, reps), mhg) === "within";
    const bIn = deviation(meanOf(b.weights, reps), mhg) === "within";
    if (aIn !== bIn) return aIn;
    if (aIn && a.jumps !== b.jumps) return a.jumps < b.jumps;
    if (a.distance !== b.distance) return a.distance < b.distance;
    return a.jumps < b.jumps;
  };
  const consider = (weights: number[], jumps: number) => {
    if (weights.some((w) => w < 0)) return;
    const c = {
      weights,
      jumps,
      distance: Math.abs(meanOf(weights, reps) - mhg),
    };
    if (!pick || better(c, pick)) pick = c;
  };
  // k sets at the best value, the jump d below them, then steps of 0/5.
  for (let k = 1; k <= n; k++) {
    const below = n - k;
    if (below === 0) {
      consider(Array(n).fill(best), 0);
      continue;
    }
    for (let d = 1; d <= JUMP; d++) {
      const patterns = 1 << (below - 1);
      for (let mask = 0; mask < patterns; mask++) {
        const weights = Array<number>(n).fill(best);
        let w = best - d;
        // Every change of weight counts, the smaller jump included.
        let jumps = 1;
        weights[below - 1] = w;
        for (let i = below - 2; i >= 0; i--) {
          const step = mask & (1 << i) ? JUMP : 0;
          if (step) jumps++;
          w -= step;
          weights[i] = w;
        }
        consider(weights, jumps);
      }
    }
  }
  return pick!.weights;
}

/**
 * The sets of one exercise per session, or null without a complete
 * projection. Best value and weekly reps are rounded to whole numbers.
 */
export function prefillSets(
  projection: PlannedExercise | undefined,
  sessionCount: number,
): PrefilledSet[][] | null {
  if (!projection || sessionCount < 1) return null;
  const { bestKg, averageKg, setSize, weeklyReps } = projection;
  if (
    bestKg === null ||
    averageKg === null ||
    setSize === null ||
    weeklyReps === null ||
    setSize <= 0
  )
    return null;
  const best = Math.round(bestKg);
  const total = Math.round(weeklyReps);
  if (best <= 0 || total <= 0) return null;
  return splitReps(total, sessionCount).map((share) => {
    const reps = repsPerSet(share, setSize);
    if (reps.length === 0) return [];
    const weights = weightsFor(reps, best, averageKg);
    return reps.map((r, i) => ({ weightKg: weights[i]!, reps: r }));
  });
}
