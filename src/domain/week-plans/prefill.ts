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
 * Run lengths from the lightest weight up. The ideal is a jump every two
 * sets (pairs); `singles` more jumps are added from the heaviest weights
 * down (single sets at the top), and `plateau` extends the top run instead
 * (several sets at the best value) for an mHG above the ideal's.
 */
export function shapeOf(n: number, extra: number, kind: "singles" | "plateau") {
  const top =
    kind === "singles"
      ? Array<number>(Math.min((n % 2) + 2 * extra, n)).fill(1)
      : [];
  if (kind === "plateau") {
    const t = Math.min((n % 2 === 0 ? 2 : 1) + extra, n);
    top.push(t);
  }
  const rest = n - top.reduce((a, b) => a + b, 0);
  const runs = Array<number>(Math.floor(rest / 2)).fill(2);
  if (rest % 2) runs.unshift(1);
  return [...runs, ...top];
}

/** Weights from run lengths: the top run at `best`, `d` below it, then 5 kg steps. */
function ladder(runs: number[], best: number, d: number): number[] {
  const weights: number[] = [];
  let w = best;
  for (let r = runs.length - 1; r >= 0; r--) {
    for (let i = 0; i < runs[r]!; i++) weights.unshift(w);
    w -= r === runs.length - 1 ? d : JUMP;
  }
  return weights;
}

/**
 * Weights for the given reps, ending at `best` and rising by 5 kg (only the
 * jump into the first set at `best` may be 1–5 kg). The ideal is a jump
 * every two sets. If its mHG is not within 5 %, jumps are added from the
 * heaviest weights down (for a lower mHG) or the top run at the best value
 * grows (for a higher one), until it is; otherwise the closest shape wins,
 * which for a low mHG is a 5 kg jump in every set.
 */
export function weightsFor(
  reps: number[],
  best: number,
  mhg: number,
): number[] {
  const n = reps.length;
  const within = (w: number[]) => deviation(meanOf(w, reps), mhg) === "within";
  const distance = (w: number[]) => Math.abs(meanOf(w, reps) - mhg);
  /** The best jump d for a shape: 5 kg if it fits, else the closest. */
  const bestOf = (runs: number[]) => {
    const options = [5, 4, 3, 2, 1]
      .map((d) => ({ d, w: ladder(runs, best, d) }))
      .filter((o) => o.w.every((x) => x >= 0));
    if (options.length === 0) return null;
    // The usual 5 kg jump when it fits, else the closest fitting one.
    const usual = options.find((o) => o.d === JUMP);
    if (usual && within(usual.w)) return usual.w;
    const fitting = options.filter((o) => within(o.w));
    const pool = fitting.length ? fitting : options;
    return pool.reduce((a, b) => (distance(b.w) < distance(a.w) ? b : a)).w;
  };
  const ideal = bestOf(shapeOf(n, 0, "singles"))!;
  if (within(ideal)) return ideal;
  // Lower mHG: more jumps from the top; higher: a longer top run.
  const kind = meanOf(ideal, reps) > mhg ? "singles" : "plateau";
  let closest = ideal;
  for (let extra = 1; extra <= n; extra++) {
    const w = bestOf(shapeOf(n, extra, kind));
    if (!w) continue;
    if (within(w)) return w;
    if (distance(w) < distance(closest)) closest = w;
  }
  return closest;
}

/**
 * The sets of one exercise per session, or null without a complete
 * projection. Best value and weekly reps are rounded to whole numbers.
 * Equal reps in every set are preferred whenever best value, mHG, set size
 * and weekly reps all stay within 5 %.
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
  const shares = splitReps(total, sessionCount);
  const build = (repsOf: (share: number) => number[]) =>
    shares.map((share) => {
      const reps = repsOf(share);
      if (reps.length === 0) return [];
      const weights = weightsFor(reps, best, averageKg);
      return reps.map((r, i) => ({ weightKg: weights[i]!, reps: r }));
    });
  // Equal reps in every set when all four values stay within 5 %, even if
  // the week's reps are then a little off; else reps meeting them exactly.
  const equal = equalRepsOptions(setSize)
    .map((r) => build((share) => equalReps(share, r)))
    .filter((sessions) => withinAll(sessions, projection))
    .sort(
      (a, b) =>
        Math.abs(repsOf(a) - weeklyReps) - Math.abs(repsOf(b) - weeklyReps),
    )[0];
  return equal ?? build((share) => repsPerSet(share, setSize));
}

/** Whole reps per set to try for equal sets: around the set size. */
function equalRepsOptions(setSize: number): number[] {
  return [
    ...new Set([Math.round(setSize), Math.floor(setSize), Math.ceil(setSize)]),
  ].filter((r) => r >= 1 && r <= MAX_REPS);
}

/** `r` reps in each set, as many sets as come closest to `share`. */
function equalReps(share: number, r: number): number[] {
  if (share <= 0) return [];
  const n = Math.min(Math.max(Math.round(share / r), 1), MAX_SETS);
  return Array<number>(n).fill(r);
}

const repsOf = (sessions: PrefilledSet[][]) =>
  sessions.flat().reduce((sum, s) => sum + s.reps, 0);

/** Whether the week's values of these sets are all within 5 %. */
function withinAll(
  sessions: PrefilledSet[][],
  projection: PlannedExercise,
): boolean {
  const a = weekActuals(
    sessions
      .flat()
      .map((s) => ({ sets: 1, reps: s.reps, weightKg: s.weightKg })),
  );
  return (
    deviation(a.heaviestKg, projection.bestKg) === "within" &&
    deviation(a.averageKg, projection.averageKg) === "within" &&
    deviation(a.setSize, projection.setSize) === "within" &&
    deviation(a.weeklyReps, projection.weeklyReps) === "within"
  );
}
