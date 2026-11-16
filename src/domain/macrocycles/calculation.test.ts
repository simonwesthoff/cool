import { describe, expect, it } from "vitest";
import {
  curveShape,
  cycleProgress,
  intensity,
  mesocycleOf,
  plannedExercise,
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
  it("follows the user's formula with entry value 60 %", () => {
    expect([1, 6, 11, 16, 21].map((w) => pct(intensity(0.6, t(w))))).toEqual([
      60, 65.9, 80, 94.1, 100,
    ]);
  });

  it("equals ((1−E)/2)·sin(t·π − π/2) + E + (1−E)/2 for other entry values", () => {
    for (const entry of [0.3, 0.5, 0.95]) {
      for (const progress of [0, 0.1, 0.37, 0.5, 0.8, 1]) {
        const formula =
          ((1 - entry) / 2) * Math.sin(progress * Math.PI - Math.PI / 2) +
          entry +
          (1 - entry) / 2;
        expect(intensity(entry, progress)).toBeCloseTo(formula, 12);
      }
    }
  });

  it("adds 5 points in high weeks and subtracts 5 in low weeks", () => {
    expect(pct(intensity(0.6, t(11), "high"))).toBe(85);
    expect(pct(intensity(0.6, t(11), "low"))).toBe(75);
  });

  it("rises monotonically", () => {
    const values = Array.from({ length: 52 }, (_, i) =>
      intensity(0.6, cycleProgress(i + 1, 52)),
    );
    for (let i = 1; i < values.length; i++)
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    expect(curveShape(0)).toBe(0);
    expect(curveShape(1)).toBe(1);
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
