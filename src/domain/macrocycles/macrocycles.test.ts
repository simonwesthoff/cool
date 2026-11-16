import { afterAll, describe, expect, it, vi } from "vitest";
import { DomainValidationError } from "@/domain/validation";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { startAsCoach } = await import("@/domain/roles");
const { createAthlete } = await import("@/domain/athletes");
const {
  createMacrocycle,
  findMacrocycle,
  getMacrocycle,
  setMesocycleBorders,
  removeMesocycleExercise,
  setMesocycleExercise,
  setWeekLevel,
  updateBaseData,
} = await import("./index");

/** 21 weeks from Monday 2026-11-30, entry 60 %, snatch goal 100 kg, C&J goal 130 kg. */
const baseData = {
  startDate: "2026-11-30",
  durationWeeks: 21,
  entryValuePct: 60,
  snatchBestKg: 90,
  cleanAndJerkBestKg: 115,
  snatchGoalKg: 100,
  cleanAndJerkGoalKg: 130,
  bodyWeightKg: 81,
  targetBodyWeightKg: 80.5,
  deficits: "Weak turnover in the snatch",
  injuriesAndIllnesses: "None",
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
  strengths: "Fast under the bar",
  experience: "6 years, 2 national championships",
  trainingFrequency: 8,
  focusPoints: ["Turnover", "Squat strength"],
};

async function setup() {
  const coach = await createUser(testDb.db);
  await startAsCoach(coach);
  const athlete = await createAthlete(coach, { name: "Anna Weber" });
  return { coach, athlete };
}

const errorOf = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: unknown) => e,
  );

const fieldsOf = async (p: Promise<unknown>) => {
  const error = await errorOf(p);
  if (!(error instanceof DomainValidationError))
    throw new Error(`expected validation error, got ${String(error)}`);
  return error.fields;
};

describe("createMacrocycle", () => {
  it("creates base data, default mesocycles and only medium weeks", async () => {
    const { coach, athlete } = await setup();
    const created = await createMacrocycle(coach, athlete.id, baseData);
    expect(created).toMatchObject({
      ...baseData,
      bodyFatPct: null,
      muscleMassPct: null,
    });
    expect(created.mesocycles).toEqual([
      {
        type: "general_preparation",
        firstWeek: 1,
        lastWeek: 3,
        exerciseNumbers: [],
        exercises: [],
      },
      {
        type: "special_preparation",
        firstWeek: 4,
        lastWeek: 13,
        exerciseNumbers: [],
        exercises: [],
      },
      {
        type: "competition_preparation",
        firstWeek: 14,
        lastWeek: 21,
        exerciseNumbers: [],
        exercises: [],
      },
    ]);
    expect(created.weeks).toHaveLength(21);
    expect(created.weeks.every((w) => w.level === "medium")).toBe(true);
    expect(
      created.weeks.map((w) => w.intensityPct).filter((_, i) => i % 5 === 0),
    ).toEqual([60, 65.9, 80, 94.1, 100]);
    expect(created.weeks[1]!.startDate).toBe("2026-12-07");
    expect(created.weeks[20]!.startDate).toBe("2027-04-19");
    expect(created.weeks[0]!.volume).toBeNull();
  });

  it("accepts body fat and muscle mass as optional values", async () => {
    const { coach, athlete } = await setup();
    const created = await createMacrocycle(coach, athlete.id, {
      ...baseData,
      bodyFatPct: 12.5,
      muscleMassPct: 45,
    });
    expect(created).toMatchObject({ bodyFatPct: 12.5, muscleMassPct: 45 });
  });

  it("requires all other base data", async () => {
    const { coach, athlete } = await setup();
    const incomplete: Record<string, unknown> = { ...baseData };
    delete incomplete.snatchGoalKg;
    delete incomplete.deficits;
    expect(
      await fieldsOf(createMacrocycle(coach, athlete.id, incomplete)),
    ).toEqual({
      snatchGoalKg: ["REQUIRED"],
      deficits: ["REQUIRED"],
    });
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          competitionType: " ",
        }),
      ),
    ).toEqual({
      competitionType: ["REQUIRED"],
    });
  });

  it("checks the Monday rule, ranges and the competition date", async () => {
    const { coach, athlete } = await setup();
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          startDate: "2026-12-02",
          durationWeeks: 6,
          entryValuePct: 20,
          bodyFatPct: 90,
        }),
      ),
    ).toEqual({
      startDate: ["NOT_MONDAY"],
      durationWeeks: ["OUT_OF_RANGE"],
      entryValuePct: ["OUT_OF_RANGE"],
      bodyFatPct: ["OUT_OF_RANGE"],
    });
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          competitionDate: "2026-11-01",
        }),
      ),
    ).toEqual({ competitionDate: ["BEFORE_START"] });
  });

  it("keeps 1 to 3 focus points in order", async () => {
    const { coach, athlete } = await setup();
    const created = await createMacrocycle(coach, athlete.id, {
      ...baseData,
      focusPoints: ["Turnover", "Squat strength", "Jerk stability"],
    });
    expect(created.focusPoints).toEqual([
      "Turnover",
      "Squat strength",
      "Jerk stability",
    ]);
    const reordered = await updateBaseData(coach, athlete.id, {
      focusPoints: ["Jerk stability", "Turnover"],
    });
    expect(reordered.focusPoints).toEqual(["Jerk stability", "Turnover"]);
  });

  it("rejects no focus point, more than three, empty ones and a wrong frequency", async () => {
    const { coach, athlete } = await setup();
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, { ...baseData, focusPoints: [] }),
      ),
    ).toEqual({ focusPoints: ["REQUIRED"] });
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          focusPoints: ["a", "b", "c", "d"],
        }),
      ),
    ).toEqual({ focusPoints: ["TOO_MANY"] });
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          focusPoints: ["a", " "],
        }),
      ),
    ).toEqual({ "focusPoints.1": ["REQUIRED"] });
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, {
          ...baseData,
          trainingFrequency: 15,
        }),
      ),
    ).toEqual({ trainingFrequency: ["OUT_OF_RANGE"] });
  });

  it("allows only one macrocycle per athlete", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await expect(
      errorOf(createMacrocycle(coach, athlete.id, baseData)),
    ).resolves.toMatchObject({
      code: "MACROCYCLE_EXISTS",
      kind: "conflict",
    });
  });

  it("is refused for another Team's athlete", async () => {
    const { athlete } = await setup();
    const other = await createUser(testDb.db);
    await startAsCoach(other);
    for (const attempt of [
      createMacrocycle(other, athlete.id, baseData),
      findMacrocycle(other, athlete.id),
    ]) {
      await expect(errorOf(attempt)).resolves.toMatchObject({
        code: "ATHLETE_NOT_FOUND",
      });
    }
  });
});

describe("getMacrocycle", () => {
  it("reports MACROCYCLE_NOT_FOUND, and findMacrocycle null, without one", async () => {
    const { coach, athlete } = await setup();
    await expect(
      errorOf(getMacrocycle(coach, athlete.id)),
    ).resolves.toMatchObject({
      code: "MACROCYCLE_NOT_FOUND",
    });
    await expect(findMacrocycle(coach, athlete.id)).resolves.toBeNull();
  });

  it("calculates week 11 for exercise 13 as in the spec", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const n of ["13", "19"])
      await setMesocycleExercise(coach, athlete.id, "special_preparation", n, {
        reason: "Pull strength",
      });
    const week11 = (await getMacrocycle(coach, athlete.id)).weeks[10]!;
    expect(week11).toMatchObject({
      number: 11,
      mesocycle: "special_preparation",
      level: "medium",
      intensityPct: 80,
    });
    expect(week11.exercises).toEqual([
      {
        exerciseNumber: 13,
        bestKg: 86,
        averageKg: 75,
        setSize: 6,
        weeklyReps: 33,
      },
      {
        exerciseNumber: 19,
        bestKg: 109,
        averageKg: 98,
        setSize: 6,
        weeklyReps: 33,
      },
    ]);
    expect(week11.volume).toBe(66);
  });
});

describe("setWeekLevel", () => {
  it("makes a week high and back to medium", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    let m = await setWeekLevel(coach, athlete.id, 11, { level: "high" });
    expect(m.weeks[10]).toMatchObject({ level: "high", intensityPct: 85 });
    m = await setWeekLevel(coach, athlete.id, 11, { level: "medium" });
    expect(m.weeks[10]).toMatchObject({ level: "medium", intensityPct: 80 });
  });

  it("rejects unknown weeks and levels", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await expect(
      errorOf(setWeekLevel(coach, athlete.id, 22, { level: "high" })),
    ).resolves.toMatchObject({
      code: "WEEK_NOT_FOUND",
    });
    expect(
      await fieldsOf(setWeekLevel(coach, athlete.id, 1, { level: "extreme" })),
    ).toEqual({
      level: ["INVALID_VALUE"],
    });
  });
});

describe("setMesocycleExercise", () => {
  it("chooses exercises with reason and variation, and changes them", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const n of ["19", "1", "13"])
      await setMesocycleExercise(coach, athlete.id, "special_preparation", n, {
        reason: "Pull strength",
      });
    const m = await setMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "1",
      { variation: "  No feet snatch ", reason: " Footwork in the turnover " },
    );
    expect(m.mesocycles[1]!.exerciseNumbers).toEqual([1, 13, 19]);
    expect(m.mesocycles[1]!.exercises[0]).toEqual({
      exerciseNumber: 1,
      variation: "No feet snatch",
      reason: "Footwork in the turnover",
    });
    expect(m.mesocycles[1]!.exercises[1]).toMatchObject({ variation: null });
    expect(m.mesocycles[0]!.exercises).toEqual([]);

    const cleared = await setMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "1",
      { variation: "", reason: "Technique" },
    );
    expect(cleared.mesocycles[1]!.exercises[0]).toEqual({
      exerciseNumber: 1,
      variation: null,
      reason: "Technique",
    });
  });

  it("does not change the calculated values with a variation", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const plain = await setMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "13",
      {
        reason: "Pull strength",
      },
    );
    const varied = await setMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "13",
      {
        reason: "Pull strength",
        variation: "From blocks",
      },
    );
    expect(varied.weeks[10]!.exercises).toEqual(plain.weeks[10]!.exercises);
  });

  it("allows the same exercise in several mesocycles", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await setMesocycleExercise(coach, athlete.id, "general_preparation", "13", {
      reason: "Basics",
    });
    const m = await setMesocycleExercise(
      coach,
      athlete.id,
      "competition_preparation",
      "13",
      { reason: "Speed", variation: "Light" },
    );
    expect(m.mesocycles.map((x) => x.exerciseNumbers)).toEqual([
      [13],
      [],
      [13],
    ]);
  });

  it("requires a reason and limits the lengths", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const set = (input: unknown) =>
      setMesocycleExercise(
        coach,
        athlete.id,
        "special_preparation",
        "13",
        input,
      );
    expect(await fieldsOf(set({ reason: "   " }))).toEqual({
      reason: ["REQUIRED"],
    });
    expect(await fieldsOf(set({}))).toEqual({ reason: ["REQUIRED"] });
    expect(
      await fieldsOf(
        set({ reason: "x".repeat(501), variation: "v".repeat(201) }),
      ),
    ).toEqual({ reason: ["TOO_LONG"], variation: ["TOO_LONG"] });
  });

  it("rejects unknown exercises and unknown mesocycles", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const n of ["99", "abc", "0"])
      await expect(
        errorOf(
          setMesocycleExercise(coach, athlete.id, "special_preparation", n, {
            reason: "x",
          }),
        ),
      ).resolves.toMatchObject({ code: "EXERCISE_NOT_FOUND" });
    await expect(
      errorOf(
        setMesocycleExercise(coach, athlete.id, "taper", "1", { reason: "x" }),
      ),
    ).resolves.toMatchObject({ code: "MESOCYCLE_NOT_FOUND" });
  });
});

describe("removeMesocycleExercise", () => {
  it("removes one exercise of one mesocycle only", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const type of ["general_preparation", "special_preparation"])
      for (const n of ["1", "13"])
        await setMesocycleExercise(coach, athlete.id, type, n, { reason: "x" });
    await removeMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "13",
    );
    await removeMesocycleExercise(
      coach,
      athlete.id,
      "special_preparation",
      "19",
    );
    const m = await getMacrocycle(coach, athlete.id);
    expect(m.mesocycles.map((x) => x.exerciseNumbers)).toEqual([
      [1, 13],
      [1],
      [],
    ]);
  });
});

describe("updateBaseData", () => {
  it("changes values and clears optional ones", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, { ...baseData, bodyFatPct: 12 });
    const m = await updateBaseData(coach, athlete.id, {
      snatchGoalKg: 105,
      bodyFatPct: null,
    });
    expect(m).toMatchObject({
      snatchGoalKg: 105,
      bodyFatPct: null,
      durationWeeks: 21,
    });
  });

  it("keeps levels and exercises when the duration changes", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await setWeekLevel(coach, athlete.id, 11, { level: "high" });
    await setWeekLevel(coach, athlete.id, 21, { level: "low" });
    await setMesocycleExercise(coach, athlete.id, "special_preparation", "13", {
      reason: "Pull strength",
    });

    const longer = await updateBaseData(coach, athlete.id, {
      durationWeeks: 24,
    });
    expect(longer.weeks).toHaveLength(24);
    expect(longer.weeks.map((w) => w.level).slice(10, 24)).toEqual([
      "high",
      "medium",
      "medium",
      "medium",
      "medium",
      "medium",
      "medium",
      "medium",
      "medium",
      "medium",
      "low",
      "medium",
      "medium",
      "medium",
    ]);
    expect(
      longer.mesocycles.map((x) => [
        x.firstWeek,
        x.lastWeek,
        x.exerciseNumbers,
      ]),
    ).toEqual([
      [1, 3, []],
      [4, 14, [13]],
      [15, 24, []],
    ]);

    const shorter = await updateBaseData(coach, athlete.id, {
      durationWeeks: 10,
    });
    expect(shorter.weeks).toHaveLength(10);
    expect(shorter.mesocycles.map((x) => [x.firstWeek, x.lastWeek])).toEqual([
      [1, 1],
      [2, 6],
      [7, 10],
    ]);
  });

  it("validates the merged data", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    expect(
      await fieldsOf(
        updateBaseData(coach, athlete.id, { startDate: "2027-05-03" }),
      ),
    ).toEqual({
      competitionDate: ["BEFORE_START"],
    });
    expect(
      await fieldsOf(updateBaseData(coach, athlete.id, { deficits: null })),
    ).toEqual({
      deficits: ["INVALID_TYPE"],
    });
  });
});

describe("setMesocycleBorders", () => {
  it("moves the borders and the weeks follow", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const m = await setMesocycleBorders(coach, athlete.id, {
      specialPreparationStart: 6,
      competitionPreparationStart: 14,
    });
    expect(m.mesocycles.map((x) => [x.firstWeek, x.lastWeek])).toEqual([
      [1, 5],
      [6, 13],
      [14, 21],
    ]);
    expect(m.weeks[4]!.mesocycle).toBe("general_preparation");
    expect(m.weeks[5]!.mesocycle).toBe("special_preparation");
  });

  it("keeps the adjusted proportions when the duration changes (21 → 42)", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await setMesocycleBorders(coach, athlete.id, {
      specialPreparationStart: 6,
      competitionPreparationStart: 14,
    });
    const m = await updateBaseData(coach, athlete.id, {
      durationWeeks: 42,
      competitionDate: "2027-09-30",
    });
    expect(m.mesocycles.map((x) => [x.firstWeek, x.lastWeek])).toEqual([
      [1, 10],
      [11, 26],
      [27, 42],
    ]);
  });

  it("rejects borders that leave a block without weeks", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const borders of [
      { specialPreparationStart: 1, competitionPreparationStart: 10 },
      { specialPreparationStart: 8, competitionPreparationStart: 8 },
      { specialPreparationStart: 4, competitionPreparationStart: 22 },
    ]) {
      expect(
        await fieldsOf(setMesocycleBorders(coach, athlete.id, borders)),
      ).toEqual({
        _root: ["INVALID_BORDERS"],
      });
    }
  });
});
