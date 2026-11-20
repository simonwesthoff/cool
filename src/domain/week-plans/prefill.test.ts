import { describe, expect, it } from "vitest";
import { deviation, weekActuals } from "./calculation";
import { prefillSets, repsPerSet, splitReps } from "./prefill";

const week11 = { bestKg: 80, averageKg: 69, setSize: 3, weeklyReps: 20 };
const actualsOf = (sets: { weightKg: number; reps: number }[]) =>
  weekActuals(sets.map((s) => ({ ...s, sets: 1 })));

/** The rules every autofilled session holds. */
function expectRules(sets: { weightKg: number; reps: number }[], best: number) {
  expect(sets.length).toBeGreaterThan(0);
  expect(sets.length).toBeLessThanOrEqual(10);
  expect(sets.at(-1)!.weightKg).toBe(best);
  for (const s of sets) {
    expect(Number.isInteger(s.weightKg)).toBe(true);
    expect(Number.isInteger(s.reps)).toBe(true);
    expect(s.weightKg).toBeGreaterThanOrEqual(0);
    expect(s.reps).toBeGreaterThanOrEqual(1);
    expect(s.reps).toBeLessThanOrEqual(30);
  }
  const firstBest = sets.findIndex((s) => s.weightKg === best);
  for (let i = 1; i < sets.length; i++) {
    const jump = sets[i]!.weightKg - sets[i - 1]!.weightKg;
    expect(sets[i]!.reps).toBeLessThanOrEqual(sets[i - 1]!.reps);
    if (i === firstBest) {
      expect(jump).toBeGreaterThanOrEqual(1);
      expect(jump).toBeLessThanOrEqual(5);
    } else {
      expect([0, 5]).toContain(jump);
    }
  }
}

describe("splitReps and repsPerSet", () => {
  it("splits the week's reps evenly, the extra reps to earlier sessions", () => {
    expect(splitReps(20, 2)).toEqual([10, 10]);
    expect(splitReps(21, 2)).toEqual([11, 10]);
    expect(splitReps(20, 3)).toEqual([7, 7, 6]);
  });

  it("spreads reps over sets near the set size, never rising", () => {
    expect(repsPerSet(20, 3)).toEqual([3, 3, 3, 3, 3, 3, 2]);
    expect(repsPerSet(18, 2.5)).toEqual([3, 3, 3, 3, 2, 2, 2]);
    // At most 10 sets.
    expect(repsPerSet(40, 2)).toHaveLength(10);
  });
});

describe("prefillSets", () => {
  it("fills the week 11 snatch within 5 % of every projection", () => {
    const [sets] = prefillSets(week11, 1)!;
    expect(sets!.map((s) => s.reps)).toEqual([3, 3, 3, 3, 3, 3, 2]);
    expectRules(sets!, 80);
    const a = actualsOf(sets!);
    expect(a.heaviestKg).toBe(80);
    expect(a.weeklyReps).toBe(20);
    expect(deviation(a.averageKg, 69)).toBe("within");
    expect(deviation(a.setSize, 3)).toBe("within");
  });

  it("prefers fewer jumps while within 5 %, then the closer mHG", () => {
    const [sets] = prefillSets(week11, 1)!;
    expect(sets!.map((s) => s.weightKg)).toEqual([70, 70, 70, 70, 70, 75, 80]);
    // An mHG within 5 % of the best value needs no jump at all.
    const [flat] = prefillSets(
      { bestKg: 100, averageKg: 97, setSize: 2, weeklyReps: 10 },
      1,
    )!;
    expect(flat!.map((s) => s.weightKg)).toEqual([100, 100, 100, 100, 100]);
  });

  it("uses a plateau at the best value and a smaller jump into it for a high mHG", () => {
    const [sets] = prefillSets(
      { bestKg: 100, averageKg: 98, setSize: 2, weeklyReps: 10 },
      1,
    )!;
    expectRules(sets!, 100);
    const weights = sets!.map((s) => s.weightKg);
    expect(weights.filter((w) => w === 100).length).toBeGreaterThan(1);
    expect(deviation(actualsOf(sets!).averageKg, 98)).toBe("within");
  });

  it("jumps 5 kg in every set when the mHG is out of reach", () => {
    const [sets] = prefillSets(
      { bestKg: 120, averageKg: 95, setSize: 5, weeklyReps: 25 },
      1,
    )!;
    expect(sets!.map((s) => s.weightKg)).toEqual([100, 105, 110, 115, 120]);
  });

  it("splits over two sessions, each reaching the best value", () => {
    const sessions = prefillSets(week11, 2)!;
    expect(sessions).toHaveLength(2);
    for (const sets of sessions) {
      expectRules(sets, 80);
      expect(sets.reduce((sum, s) => sum + s.reps, 0)).toBe(10);
    }
    const odd = prefillSets({ ...week11, weeklyReps: 21 }, 2)!;
    expect(odd.map((s) => s.reduce((sum, x) => sum + x.reps, 0))).toEqual([
      11, 10,
    ]);
  });

  it("rounds decimal projections to whole kg and whole reps", () => {
    const [sets] = prefillSets(
      { bestKg: 77.3, averageKg: 66.6, setSize: 2.5, weeklyReps: 17.5 },
      1,
    )!;
    expectRules(sets!, 77);
    expect(sets!.reduce((sum, s) => sum + s.reps, 0)).toBe(18);
  });

  it("returns null without a complete projection", () => {
    expect(prefillSets(undefined, 1)).toBeNull();
    expect(prefillSets({ ...week11, bestKg: null }, 1)).toBeNull();
    expect(prefillSets({ ...week11, weeklyReps: null }, 1)).toBeNull();
    expect(prefillSets(week11, 0)).toBeNull();
  });

  it("keeps the rules over a grid of projections", () => {
    for (const best of [20, 47.5, 80, 101.3, 160])
      for (const ratio of [0.6, 0.75, 0.86, 0.95])
        for (const setSize of [1, 2.5, 3, 5])
          for (const weeklyReps of [3, 12.5, 20, 36])
            for (const sessions of [1, 2, 3]) {
              const result = prefillSets(
                { bestKg: best, averageKg: best * ratio, setSize, weeklyReps },
                sessions,
              )!;
              const total = result.flat().reduce((s, x) => s + x.reps, 0);
              expect(total).toBe(Math.round(weeklyReps));
              for (const sets of result)
                if (sets.length) expectRules(sets, Math.round(best));
            }
  });
});
