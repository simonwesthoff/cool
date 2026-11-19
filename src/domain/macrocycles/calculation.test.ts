import { describe, expect, it } from "vitest";
import {
  curveShape,
  curveValue,
  sineLikeAnchors,
  cycleProgress,
  intensity,
  bordersAreValid,
  mesocycleOf,
  plannedExercise,
  scaleMesocycles,
  spansFromBorders,
  roundHalfUp,
  splitMesocycles,
  volume,
  type ExerciseValues,
} from "./calculation";

const pct = (value: number) => Math.round(value * 1000) / 10;

// Catalog values (data/exercise-catalog).
const snatchPull: ExerciseValues = {
  referenceLift: "snatch",
  bestValuePct: 108,
  maxWeeklyAverageWeightPct: 94,
  repsPerSet: { min: 3, max: 8 },
  repsPerWeek: { min: 18, max: 48 },
};
const frontSquat: ExerciseValues = {
  referenceLift: "clean_and_jerk",
  bestValuePct: 105,
  maxWeeklyAverageWeightPct: 94,
  repsPerSet: { min: 3, max: 8 },
  repsPerWeek: { min: 18, max: 48 },
};
const benchPress: ExerciseValues = {
  referenceLift: null,
  bestValuePct: null,
  maxWeeklyAverageWeightPct: null,
  repsPerSet: { min: null, max: null },
  repsPerWeek: { min: null, max: null },
};
const goals = { snatchGoalKg: 100, cleanAndJerkGoalKg: 130 };
const t = (week: number) => cycleProgress(week, 21);

describe("cycle progress", () => {
  it("is 0, 0.5 and 1 in weeks 1, 11 and 21 of 21", () => {
    expect([t(1), t(11), t(21)]).toEqual([0, 0.5, 1]);
  });
});

describe("intensity curve", () => {
  it("is the straight line from the entry value to 100 % without inner anchors", () => {
    expect([1, 6, 11, 16, 21].map((w) => pct(intensity(0.6, t(w))))).toEqual([
      60, 70, 80, 90, 100,
    ]);
    const curve = { entryPct: 60, anchors: [] };
    expect(pct(intensity(curve, t(6)))).toBe(70);
  });

  it("runs smoothly through an inner anchor and stays within 0–100 %", () => {
    const curve = { entryPct: 60, anchors: [{ t: 0.25, pct: 90 }] };
    expect(pct(intensity(curve, t(6)))).toBe(90);
    const values = Array.from({ length: 21 }, (_, i) =>
      curveValue(curve, t(i + 1)),
    );
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    // Smooth: no jump between neighbouring weeks.
    for (let i = 1; i < values.length; i++)
      expect(Math.abs(values[i]! - values[i - 1]!)).toBeLessThan(0.08);
  });

  it("caps the curve at 100 % where the spline bulges above it, but not high weeks", () => {
    const curve = {
      entryPct: 60,
      anchors: [
        { t: 0.4, pct: 98 },
        { t: 0.6, pct: 100 },
      ],
    };
    const bulge = Array.from({ length: 101 }, (_, i) =>
      curveValue(curve, i / 100),
    );
    expect(Math.max(...bulge)).toBe(1);
    // Where the curve is capped (before the end), a high week is 105 %.
    const capped = bulge.findIndex((v, i) => v === 1 && i < 100) / 100;
    expect(capped).toBeGreaterThan(0);
    expect(intensity(curve, capped, "high")).toBeCloseTo(1.05, 12);
  });

  it("adds 5 points in high weeks and subtracts 5 in low weeks", () => {
    expect(pct(intensity(0.6, t(11), "high"))).toBe(85);
    expect(pct(intensity(0.6, t(11), "low"))).toBe(75);
  });

  it("stays level before a moved entry anchor and after a moved end anchor", () => {
    const curve = {
      entryPct: 60,
      entryT: 0.2,
      endPct: 95,
      endT: 0.8,
      anchors: [],
    };
    expect(curveValue(curve, 0)).toBeCloseTo(0.6, 12);
    expect(curveValue(curve, 0.2)).toBeCloseTo(0.6, 12);
    expect(curveValue(curve, 0.5)).toBeCloseTo(0.775, 12);
    expect(curveValue(curve, 0.8)).toBeCloseTo(0.95, 12);
    expect(curveValue(curve, 1)).toBeCloseTo(0.95, 12);
  });

  it("orders the inner anchors by position", () => {
    const a = {
      entryPct: 60,
      anchors: [
        { t: 0.7, pct: 95 },
        { t: 0.3, pct: 65 },
      ],
    };
    const b = {
      entryPct: 60,
      anchors: [
        { t: 0.3, pct: 65 },
        { t: 0.7, pct: 95 },
      ],
    };
    expect(curveValue(a, 0.5)).toBeCloseTo(curveValue(b, 0.5), 12);
  });
});

describe("approximation of the former S-curve", () => {
  const sine = (entry: number, progress: number) =>
    entry + (1 - entry) * curveShape(progress);

  it("uses two inner anchors at 1/3 and 2/3, below and above the straight line", () => {
    expect(sineLikeAnchors(60)).toEqual([
      { t: 1 / 3, pct: 70 },
      { t: 2 / 3, pct: 90 },
    ]);
  });

  it("stays within 1.2 points of the sine for 60 % and 2.0 points for 30 %", () => {
    for (const [entry, bound] of [
      [0.6, 1.2],
      [0.3, 2.0],
    ] as const) {
      const curve = {
        entryPct: entry * 100,
        anchors: sineLikeAnchors(entry * 100),
      };
      for (let i = 0; i <= 200; i++) {
        const progress = i / 200;
        expect(
          Math.abs(curveValue(curve, progress) - sine(entry, progress)) * 100,
        ).toBeLessThanOrEqual(bound + 0.05);
      }
    }
    const curve = { entryPct: 60, anchors: sineLikeAnchors(60) };
    expect([1, 11, 21].map((w) => pct(intensity(curve, t(w))))).toEqual([
      60, 80, 100,
    ]);
  });
});

describe("planned exercise values", () => {
  it("snatch pull in week 11 (medium)", () => {
    expect(plannedExercise(snatchPull, goals, 0.6, t(11), "medium")).toEqual({
      bestKg: 86,
      averageKg: 75,
      setSize: 6,
      weeklyReps: 33,
    });
  });

  it("snatch pull in week 11 as high week: heavier and more weekly reps, same set size", () => {
    expect(plannedExercise(snatchPull, goals, 0.6, t(11), "high")).toEqual({
      bestKg: 92,
      averageKg: 80,
      setSize: 6,
      weeklyReps: 35,
    });
  });

  it("snatch pull in week 11 as low week", () => {
    expect(plannedExercise(snatchPull, goals, 0.6, t(11), "low")).toMatchObject(
      {
        bestKg: 81,
        setSize: 6,
        weeklyReps: 31,
      },
    );
  });

  it("snatch pull in the first and last week", () => {
    expect(plannedExercise(snatchPull, goals, 0.6, t(1), "medium")).toEqual({
      bestKg: 65,
      averageKg: 56,
      setSize: 8,
      weeklyReps: 48,
    });
    expect(plannedExercise(snatchPull, goals, 0.6, t(21), "medium")).toEqual({
      bestKg: 108,
      averageKg: 94,
      setSize: 3,
      weeklyReps: 18,
    });
  });

  it("uses the clean & jerk goal for clean & jerk exercises (136.5 → 137 kg)", () => {
    expect(
      plannedExercise(frontSquat, goals, 0.6, t(21), "medium").bestKg,
    ).toBe(137);
  });

  it("has no values for exercises without catalog values", () => {
    expect(plannedExercise(benchPress, goals, 0.6, t(11), "high")).toEqual({
      bestKg: null,
      averageKg: null,
      setSize: null,
      weeklyReps: null,
    });
  });
});

describe("volume", () => {
  it("sums the weekly reps of the week's exercises", () => {
    const week11 = [snatchPull, frontSquat].map((e) =>
      plannedExercise(e, goals, 0.6, t(11), "medium"),
    );
    expect(volume(week11)).toBe(66);
  });

  it("counts exercises without reps as 0 and is undefined without exercises", () => {
    expect(
      volume([plannedExercise(benchPress, goals, 0.6, 0.5, "medium")]),
    ).toBe(0);
    expect(volume([])).toBeNull();
  });
});

describe("rounding", () => {
  it.each([
    [86.4, 86],
    [136.5, 137],
    [5.5, 6],
    [34.65, 35],
    [31.35, 31],
    [5.49, 5],
    [5.4999999999999995, 6],
  ])("%s → %s", (value, expected) => {
    expect(roundHalfUp(value)).toBe(expected);
  });
});

describe("default mesocycles", () => {
  it("splits 21 weeks into 1–3, 4–13 and 14–21", () => {
    expect(splitMesocycles(21)).toEqual([
      { type: "general_preparation", firstWeek: 1, lastWeek: 3 },
      { type: "special_preparation", firstWeek: 4, lastWeek: 13 },
      { type: "competition_preparation", firstWeek: 14, lastWeek: 21 },
    ]);
  });

  it("gives every block at least one week from 7 weeks on", () => {
    expect(splitMesocycles(7)).toEqual([
      { type: "general_preparation", firstWeek: 1, lastWeek: 1 },
      { type: "special_preparation", firstWeek: 2, lastWeek: 4 },
      { type: "competition_preparation", firstWeek: 5, lastWeek: 7 },
    ]);
    for (let weeks = 7; weeks <= 52; weeks++) {
      const spans = splitMesocycles(weeks);
      expect(spans.every((s) => s.lastWeek >= s.firstWeek)).toBe(true);
      expect(spans[2]!.lastWeek).toBe(weeks);
    }
  });

  it("finds the mesocycle of a week", () => {
    const spans = splitMesocycles(21);
    expect([3, 4, 13, 14].map((w) => mesocycleOf(w, spans))).toEqual([
      "general_preparation",
      "special_preparation",
      "special_preparation",
      "competition_preparation",
    ]);
  });
});

describe("adjustable mesocycle borders", () => {
  it("builds blocks from the two borders", () => {
    expect(spansFromBorders(21, 6, 14)).toEqual([
      { type: "general_preparation", firstWeek: 1, lastWeek: 5 },
      { type: "special_preparation", firstWeek: 6, lastWeek: 13 },
      { type: "competition_preparation", firstWeek: 14, lastWeek: 21 },
    ]);
  });

  it("requires at least one week per block", () => {
    expect(bordersAreValid(21, 2, 3)).toBe(true);
    expect(bordersAreValid(21, 1, 3)).toBe(false);
    expect(bordersAreValid(21, 5, 5)).toBe(false);
    expect(bordersAreValid(21, 5, 22)).toBe(false);
    expect(bordersAreValid(21, 2, 21)).toBe(true);
    expect(bordersAreValid(21, 2.5, 10)).toBe(false);
  });

  it("scales the block lengths to a new duration (spec example 21 → 42)", () => {
    expect(scaleMesocycles(spansFromBorders(21, 6, 14), 42)).toEqual(
      spansFromBorders(42, 11, 27),
    );
  });

  it("keeps every block at least one week when shrinking", () => {
    for (let weeks = 7; weeks <= 52; weeks++) {
      const scaled = scaleMesocycles(spansFromBorders(52, 40, 51), weeks);
      expect(scaled.every((s) => s.lastWeek >= s.firstWeek)).toBe(true);
      expect(scaled[2]!.lastWeek).toBe(weeks);
    }
  });
});
