import { describe, expect, it } from "vitest";
import { draftOf, hasErrors, payloadOf, setErrors } from "./week-draft";

const one = (
  setGroups: { sets: number; reps: number; weightKg: number | null }[],
) =>
  draftOf([
    {
      weekday: 1,
      slot: 1,
      exercises: [{ exerciseNumber: 1, note: null, setGroups }],
    },
  ]);
const set = (weight: string, reps: string) => ({ key: "x", weight, reps });

describe("week draft", () => {
  it("expands set groups into single sets and groups equal neighbours again", () => {
    const draft = one([
      { sets: 2, reps: 3, weightKg: 60 },
      { sets: 1, reps: 2, weightKg: 70 },
      { sets: 2, reps: 2, weightKg: 70 },
      { sets: 1, reps: 3, weightKg: 60 },
    ]);
    expect(draft[0]!.exercises[0]!.sets).toHaveLength(6);
    expect(payloadOf(draft).sessions[0]!.exercises[0]!.setGroups).toEqual([
      { sets: 2, reps: 3, weightKg: 60 },
      { sets: 3, reps: 2, weightKg: 70 },
      { sets: 1, reps: 3, weightKg: 60 },
    ]);
  });

  it("saves only sets with reps, and marks invalid cells", () => {
    const draft = one([]);
    draft[0]!.exercises[0]!.sets = [
      { key: "a", weight: "", reps: "" },
      { key: "b", weight: "", reps: "8" },
    ];
    expect(payloadOf(draft).sessions[0]!.exercises[0]!.setGroups).toEqual([
      { sets: 1, reps: 8, weightKg: null },
    ]);
    expect(hasErrors(draft)).toBe(false);
    // A weight needs reps.
    expect(setErrors(set("80", ""))).toEqual(["reps"]);
    expect(setErrors(set("82.3", "2"))).toEqual(["weight"]);
    expect(setErrors(set("80", "0"))).toEqual(["reps"]);
    expect(setErrors(set("80,5", "31"))).toEqual(["reps"]);
    expect(setErrors(set("", "2.5"))).toEqual(["reps"]);
    expect(setErrors(set("501", "2"))).toEqual(["weight"]);
  });
});
