import { describe, expect, it } from "vitest";
import { currentAndNextWeek, deviation, weekActuals } from "./calculation";

/** The spec's week 11 snatch: Monday ramping up, Thursday 3 × 2 @ 75 kg. */
const snatchWeek11 = [
  { sets: 2, reps: 3, weightKg: 60 },
  { sets: 3, reps: 2, weightKg: 70 },
  { sets: 2, reps: 1, weightKg: 80 },
  { sets: 3, reps: 2, weightKg: 75 },
];
/** Week 11 projection of the snatch: 80 kg, 69 kg, set size 3, 20 reps. */
const projected = { bestKg: 80, averageKg: 69, setSize: 3, weeklyReps: 20 };

describe("weekActuals", () => {
  it("sums the week 11 snatch as in the spec", () => {
    expect(weekActuals(snatchWeek11)).toEqual({
      heaviestKg: 80,
      averageKg: 69.5,
      setSize: 2,
      weeklyReps: 20,
    });
  });

  it("leaves set groups without weight out of heaviest weight and mHG", () => {
    expect(
      weekActuals([
        { sets: 3, reps: 8, weightKg: null },
        { sets: 1, reps: 4, weightKg: 20 },
      ]),
    ).toEqual({ heaviestKg: 20, averageKg: 20, setSize: 7, weeklyReps: 28 });
    expect(weekActuals([{ sets: 3, reps: 8, weightKg: null }])).toEqual({
      heaviestKg: null,
      averageKg: null,
      setSize: 8,
      weeklyReps: 24,
    });
    expect(weekActuals([])).toEqual({
      heaviestKg: null,
      averageKg: null,
      setSize: null,
      weeklyReps: null,
    });
  });
});

describe("deviation", () => {
  it("flags only set size for the week 11 snatch", () => {
    const actual = weekActuals(snatchWeek11);
    expect(deviation(actual.heaviestKg, projected.bestKg)).toBe("within");
    expect(deviation(actual.averageKg, projected.averageKg)).toBe("within");
    expect(deviation(actual.setSize, projected.setSize)).toBe("below");
    expect(deviation(actual.weeklyReps, projected.weeklyReps)).toBe("within");
  });

  it("uses a strict 5 % band", () => {
    expect(deviation(85, 80)).toBe("above");
    expect(deviation(72.45, 69)).toBe("within");
    expect(deviation(72.5, 69)).toBe("above");
    expect(deviation(65.55, 69)).toBe("within");
    expect(deviation(65.5, 69)).toBe("below");
  });

  it("does not compare missing values", () => {
    expect(deviation(null, 80)).toBeNull();
    expect(deviation(80, null)).toBeNull();
  });
});

describe("currentAndNextWeek", () => {
  // 21 weeks from Monday 2026-11-30.
  const of = (today: string) => currentAndNextWeek("2026-11-30", 21, today);
  it("is week 1 next before the start", () => {
    expect(of("2026-11-25")).toEqual({ current: null, next: 1 });
  });
  it("follows today during the macrocycle", () => {
    expect(of("2026-11-30")).toEqual({ current: 1, next: 2 });
    expect(of("2027-01-06")).toEqual({ current: 6, next: 7 });
  });
  it("has no next week in the last week and none after the end", () => {
    expect(of("2027-04-25")).toEqual({ current: 21, next: null });
    expect(of("2027-04-26")).toEqual({ current: null, next: null });
  });
});
