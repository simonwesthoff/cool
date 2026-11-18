import { describe, expect, it, vi } from "vitest";

const findMacrocycle = vi.fn();
const getExerciseWeeks = vi.fn();
const canPlanMacrocycle = vi.fn();
vi.mock("@/domain/macrocycles", () => ({
  findMacrocycle,
  getExerciseWeeks,
  canPlanMacrocycle,
}));
vi.mock("@/domain/exercises", () => ({
  getExercisesWithValues: async () => [
    { number: 1, name: { de: "Reißen", en: "Snatch" }, group: "K1" },
  ],
}));

const { loadMacrocycleView, loadMacrocycleChart } = await import("./load");
const user = { id: "u1", name: "Max", email: "m@x.invalid", image: null };

describe("loadMacrocycleView", () => {
  it("offers Change planning only when the user may plan the macrocycle", async () => {
    findMacrocycle.mockResolvedValue({ athleteId: "a1" });
    getExerciseWeeks.mockResolvedValue({ exerciseNumber: 1, weeks: [] });
    canPlanMacrocycle.mockResolvedValue(true);
    const asCoach = await loadMacrocycleView(user, "a1");
    expect(asCoach?.editHref).toBe("/athletes/a1/macrocycle/base-data");
    expect(asCoach?.exercises).toEqual([
      { number: 1, name: { de: "Reißen", en: "Snatch" } },
    ]);
    expect(canPlanMacrocycle).toHaveBeenCalledWith(user, "a1");
    canPlanMacrocycle.mockResolvedValue(false);
    expect((await loadMacrocycleView(user, "a1"))?.editHref).toBeUndefined();
  });

  it("is null without a macrocycle", async () => {
    findMacrocycle.mockResolvedValue(null);
    expect(await loadMacrocycleView(user, "a1")).toBeNull();
    expect(await loadMacrocycleChart(user, "a1")).toBeNull();
  });
});
