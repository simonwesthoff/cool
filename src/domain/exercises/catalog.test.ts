import { afterAll, describe, expect, it, vi } from "vitest";
import { createTestDb } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { getCatalog, getExercise, localized } = await import("./index");

describe("getCatalog", () => {
  it("returns the groups in order with their exercises in order", async () => {
    const groups = await getCatalog();
    expect(groups.map((g) => g.code)).toEqual([
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
      "K6",
      "K7",
      "K8",
      "K9",
    ]);
    const numbers = groups.flatMap((g) => g.exercises.map((e) => e.number));
    expect(numbers).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    expect(groups[2]!.name).toEqual({
      de: "Schnellkraftfähigkeit (SKF)",
      en: "Speed strength",
    });
  });

  it("returns values, ranges and comments in both languages", async () => {
    const exercises = (await getCatalog()).flatMap((g) => g.exercises);
    expect(exercises[0]).toEqual({
      number: 1,
      groupNumber: 1,
      name: { de: "Reißen", en: "Snatch" },
      referenceLift: "snatch",
      bestValuePct: 100,
      maxWeeklyAverageWeightPct: 86,
      repsPerSet: { min: 1, max: 5 },
      repsPerWeek: { min: 10, max: 30 },
      comment: {
        de: "Wettkampfübung, Variation: Komische 1 = ohne Füße setzen",
        en: "Competition exercise. Variation: No feet snatch",
      },
    });
    expect(exercises[30]).toMatchObject({
      number: 31,
      referenceLift: null,
      bestValuePct: null,
      repsPerSet: { min: null, max: null },
      comment: null,
    });
  });
});

describe("getExercise", () => {
  it("returns an exercise with its group", async () => {
    const { exercise, group } = await getExercise(13);
    expect(exercise.name).toEqual({ de: "Zug breit", en: "Snatch pull" });
    expect(group).toEqual({
      number: 3,
      code: "K3",
      name: { de: "Schnellkraftfähigkeit (SKF)", en: "Speed strength" },
    });
  });

  it.each([0, 46, 1.5, Number.NaN, 99999])(
    "reports %s as EXERCISE_NOT_FOUND",
    async (number) => {
      await expect(getExercise(number)).rejects.toMatchObject({
        code: "EXERCISE_NOT_FOUND",
        kind: "not_found",
      });
    },
  );
});

describe("localized", () => {
  it("picks German for de and English otherwise", () => {
    expect(localized({ de: "Reißen", en: "Snatch" }, "de")).toBe("Reißen");
    expect(localized({ de: "Reißen", en: "Snatch" }, "en")).toBe("Snatch");
  });
});
