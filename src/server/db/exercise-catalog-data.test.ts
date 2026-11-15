import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { exercise, exerciseGroup } from "@/server/db/schema";
import { createTestDb } from "@/test/db";

const testDb = await createTestDb();
afterAll(() => testDb.close());

describe("exercise catalog data migration", () => {
  it("contains 9 groups and 45 exercises", async () => {
    expect(await testDb.db.$count(exerciseGroup)).toBe(9);
    expect(await testDb.db.$count(exercise)).toBe(45);
  });

  it("has the values of exercises 1, 13 and 31", async () => {
    const rows = await testDb.db.select().from(exercise);
    const byNumber = new Map(rows.map((r) => [r.number, r]));
    expect(byNumber.get(1)).toMatchObject({
      nameDe: "Reißen",
      nameEn: "Snatch",
      groupNumber: 1,
      referenceLift: "snatch",
      bestValuePct: 100,
      maxWeeklyAverageWeightPct: 86,
      minRepsPerSet: 1,
      maxRepsPerSet: 5,
      minRepsPerWeek: 10,
      maxRepsPerWeek: 30,
    });
    expect(byNumber.get(13)).toMatchObject({
      nameDe: "Zug breit",
      groupNumber: 3,
      bestValuePct: 108,
      maxWeeklyAverageWeightPct: 94,
      minRepsPerSet: 3,
      maxRepsPerSet: 8,
      minRepsPerWeek: 18,
      maxRepsPerWeek: 48,
    });
    expect(byNumber.get(31)).toMatchObject({
      nameDe: "Bankdrücken",
      groupNumber: 8,
      referenceLift: null,
      bestValuePct: null,
      commentDe: null,
    });
  });

  it("has the fixed typos", async () => {
    const [k8] = await testDb.db
      .select()
      .from(exerciseGroup)
      .where(eq(exerciseGroup.number, 8));
    expect(k8?.nameDe).toBe("Allgemeines Muskelkrafttraining 1 (AMKT)");
    const [ex29] = await testDb.db
      .select()
      .from(exercise)
      .where(eq(exercise.number, 29));
    expect(ex29?.nameDe).toBe("Kniebeuge vorne + Ausstoßen");
  });
});
