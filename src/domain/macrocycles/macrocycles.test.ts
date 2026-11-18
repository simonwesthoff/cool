import { afterAll, describe, expect, it, vi } from "vitest";
import { DomainValidationError } from "@/domain/validation";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { startAsCoach } = await import("@/domain/roles");
const { athlete: athleteTable } = await import("@/server/db/schema");
const { eq } = await import("drizzle-orm");
const { createAthlete } = await import("@/domain/athletes");
const {
  canPlanMacrocycle,
  createMacrocycle,
  findMacrocycle,
  getExerciseWeeks,
  getMacrocycle,
  setMesocycleBorders,
  removeMesocycleExercise,
  setMesocycleExercise,
  setSwot,
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
  competitionDate: "2027-04-24",
  competitionType: "German Championships",
  /** Weekly schedule with 8 sessions: Monday and Tuesday twice, Wednesday–Saturday once. */
  sessions: [
    { weekday: 1, slot: 1 },
    { weekday: 1, slot: 2 },
    { weekday: 2, slot: 1 },
    { weekday: 2, slot: 2 },
    { weekday: 3, slot: 1 },
    { weekday: 4, slot: 1 },
    { weekday: 5, slot: 1 },
    { weekday: 6, slot: 1 },
  ],
};

/** Step 2 of the planning. */
const swot = {
  strengths: "Fast under the bar",
  snatchDeficits: "Weak turnover in the snatch",
  cleanDeficits: "Slow catch",
  jerkDeficits: "Short dip",
  otherDeficits: "Ankle mobility",
  experience: "6 years, 2 national championships",
  focusPoints: ["Turnover", "Squat strength"],
  injuriesAndIllnesses: "None",
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
      trainingFrequency: 8,
      bodyFatPct: null,
      muscleMassPct: null,
      // The SWOT is filled in step 2.
      strengths: "",
      snatchDeficits: "",
      focusPoints: [],
      injuriesAndIllnesses: "",
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
    delete incomplete.sessions;
    expect(
      await fieldsOf(createMacrocycle(coach, athlete.id, incomplete)),
    ).toEqual({
      snatchGoalKg: ["REQUIRED"],
      sessions: ["REQUIRED"],
    });
    // SWOT fields belong to step 2.
    expect(
      await fieldsOf(
        createMacrocycle(coach, athlete.id, { ...baseData, strengths: "x" }),
      ),
    ).toEqual({ strengths: ["UNKNOWN_FIELD"] });
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

  it("checks the weekly schedule", async () => {
    const { coach, athlete } = await setup();
    const withSessions = (sessions: unknown) =>
      fieldsOf(createMacrocycle(coach, athlete.id, { ...baseData, sessions }));
    expect(await withSessions([])).toEqual({ sessions: ["REQUIRED"] });
    // A fourth session on Monday, and a weekday 8.
    expect(
      await withSessions([
        { weekday: 1, slot: 4 },
        { weekday: 8, slot: 1 },
      ]),
    ).toEqual({
      // Slot 4 alone also leaves a gap in Monday's slots.
      sessions: ["INVALID"],
      "sessions.0.slot": ["OUT_OF_RANGE"],
      "sessions.1.weekday": ["OUT_OF_RANGE"],
    });
    // Slot 2 without slot 1, and a duplicate.
    expect(await withSessions([{ weekday: 1, slot: 2 }])).toEqual({
      sessions: ["INVALID"],
    });
    expect(
      await withSessions([
        { weekday: 1, slot: 1 },
        { weekday: 1, slot: 1 },
      ]),
    ).toEqual({ sessions: ["INVALID"] });
    const fifteen = [1, 2, 3, 4, 5, 6, 7]
      .flatMap((weekday) => [1, 2, 3].map((slot) => ({ weekday, slot })))
      .slice(0, 15);
    expect(await withSessions(fifteen)).toEqual({ sessions: ["TOO_MANY"] });
  });

  it("stores the schedule in week order and counts it as the training frequency", async () => {
    const { coach, athlete } = await setup();
    const created = await createMacrocycle(coach, athlete.id, {
      ...baseData,
      sessions: [
        { weekday: 5, slot: 1 },
        { weekday: 1, slot: 2 },
        { weekday: 1, slot: 1 },
        { weekday: 3, slot: 1 },
      ],
    });
    expect(created.sessions).toEqual([
      { weekday: 1, slot: 1 },
      { weekday: 1, slot: 2 },
      { weekday: 3, slot: 1 },
      { weekday: 5, slot: 1 },
    ]);
    expect(created.trainingFrequency).toBe(4);
    const updated = await updateBaseData(coach, athlete.id, {
      sessions: [{ weekday: 7, slot: 1 }],
    });
    expect(updated.sessions).toEqual([{ weekday: 7, slot: 1 }]);
    expect(updated.trainingFrequency).toBe(1);
    // Other changes keep the schedule.
    const again = await updateBaseData(coach, athlete.id, {
      snatchGoalKg: 105,
    });
    expect(again.sessions).toEqual([{ weekday: 7, slot: 1 }]);
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

describe("setSwot", () => {
  it("saves all SWOT fields and keeps the base data", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const m = await setSwot(coach, athlete.id, swot);
    expect(m).toMatchObject({ ...baseData, ...swot });
  });

  it("requires every SWOT field", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const incomplete: Record<string, unknown> = { ...swot, cleanDeficits: " " };
    delete incomplete.strengths;
    delete incomplete.jerkDeficits;
    expect(await fieldsOf(setSwot(coach, athlete.id, incomplete))).toEqual({
      strengths: ["REQUIRED"],
      cleanDeficits: ["REQUIRED"],
      jerkDeficits: ["REQUIRED"],
    });
    expect(
      await fieldsOf(
        setSwot(coach, athlete.id, { ...swot, snatchGoalKg: 100 }),
      ),
    ).toEqual({ snatchGoalKg: ["UNKNOWN_FIELD"] });
  });

  it("keeps 1 to 3 focus points in order", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const m = await setSwot(coach, athlete.id, {
      ...swot,
      focusPoints: ["Jerk stability", "Turnover", "Squat strength"],
    });
    expect(m.focusPoints).toEqual([
      "Jerk stability",
      "Turnover",
      "Squat strength",
    ]);
    for (const [focusPoints, expected] of [
      [[], { focusPoints: ["REQUIRED"] }],
      [["a", "b", "c", "d"], { focusPoints: ["TOO_MANY"] }],
      [["a", " "], { "focusPoints.1": ["REQUIRED"] }],
    ] as const) {
      expect(
        await fieldsOf(setSwot(coach, athlete.id, { ...swot, focusPoints })),
      ).toEqual(expected);
    }
  });

  it("needs an existing macrocycle of the coach's athlete", async () => {
    const { coach, athlete } = await setup();
    await expect(
      errorOf(setSwot(coach, athlete.id, swot)),
    ).resolves.toMatchObject({
      code: "MACROCYCLE_NOT_FOUND",
    });
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
        ownReasons: ["Strength"],
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
  const set = (
    coach: Awaited<ReturnType<typeof setup>>["coach"],
    athleteId: string,
    type: string,
    number: string,
    input: unknown,
  ) => setMesocycleExercise(coach, athleteId, type, number, input);

  it("chooses exercises with tags, own reasons and variation, and changes them", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await set(coach, athlete.id, "special_preparation", "19", {
      tags: ["MKF"],
    });
    await set(coach, athlete.id, "special_preparation", "7", {
      tags: ["Beschleunigung im 2. Zug", "Hoher Zug"],
    });
    const m = await set(coach, athlete.id, "special_preparation", "1", {
      variation: "  No feet snatch ",
      ownReasons: [" Footwork in the turnover ", "Balance"],
    });
    expect(m.mesocycles[1]!.exerciseNumbers).toEqual([1, 7, 19]);
    expect(m.mesocycles[1]!.exercises).toEqual([
      {
        exerciseNumber: 1,
        variation: "No feet snatch",
        tags: [],
        ownReasons: ["Footwork in the turnover", "Balance"],
      },
      {
        exerciseNumber: 7,
        variation: null,
        tags: ["Beschleunigung im 2. Zug", "Hoher Zug"],
        ownReasons: [],
      },
      { exerciseNumber: 19, variation: null, tags: ["MKF"], ownReasons: [] },
    ]);
    expect(m.mesocycles[0]!.exercises).toEqual([]);

    const changed = await set(coach, athlete.id, "special_preparation", "1", {
      tags: ["WKÜ"],
      variation: "",
      ownReasons: [],
    });
    expect(changed.mesocycles[1]!.exercises[0]).toEqual({
      exerciseNumber: 1,
      variation: null,
      tags: ["WKÜ"],
      ownReasons: [],
    });
  });

  it("does not change the calculated values with a variation", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const plain = await set(coach, athlete.id, "special_preparation", "13", {
      tags: ["SKF"],
    });
    const varied = await set(coach, athlete.id, "special_preparation", "13", {
      tags: ["SKF"],
      variation: "From blocks",
    });
    expect(varied.weeks[10]!.exercises).toEqual(plain.weeks[10]!.exercises);
  });

  it("allows the same exercise in several mesocycles", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await set(coach, athlete.id, "general_preparation", "13", {
      ownReasons: ["Basics"],
    });
    const m = await set(coach, athlete.id, "competition_preparation", "13", {
      tags: ["SKF"],
      variation: "Light",
    });
    expect(m.mesocycles.map((x) => x.exerciseNumbers)).toEqual([
      [13],
      [],
      [13],
    ]);
  });

  it("requires a tag or an own reason, only the exercise's tags, and limits the own reasons", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const seven = (input: unknown) =>
      set(coach, athlete.id, "special_preparation", "7", input);
    expect(await fieldsOf(seven({ ownReasons: [] }))).toEqual({
      reason: ["REQUIRED"],
    });
    expect(await fieldsOf(seven({ ownReasons: ["a", " "] }))).toEqual({
      "ownReasons.1": ["REQUIRED"],
    });
    expect(await fieldsOf(seven({ ownReasons: ["a", "a"] }))).toEqual({
      ownReasons: ["DUPLICATE"],
    });
    expect(
      await fieldsOf(
        seven({ ownReasons: Array.from({ length: 11 }, (_, i) => `r${i}`) }),
      ),
    ).toEqual({ ownReasons: ["TOO_BIG"] });
    expect(await fieldsOf(seven({}))).toEqual({ reason: ["REQUIRED"] });
    expect(await fieldsOf(seven({ tags: ["SKF"] }))).toEqual({
      tags: ["UNKNOWN_TAG"],
    });
    expect(await fieldsOf(seven({ tags: ["Hoher Zug", "Hoher Zug"] }))).toEqual(
      {
        tags: ["DUPLICATE"],
      },
    );
    expect(
      await fieldsOf(
        seven({ ownReasons: ["x".repeat(201)], variation: "v".repeat(201) }),
      ),
    ).toEqual({ "ownReasons.0": ["TOO_LONG"], variation: ["TOO_LONG"] });
    // Exercises without addressed points are chosen with own reasons.
    const m = await set(coach, athlete.id, "general_preparation", "33", {
      ownReasons: ["Back"],
    });
    expect(m.mesocycles[0]!.exerciseNumbers).toEqual([33]);
  });

  it("rejects unknown exercises and unknown mesocycles", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const n of ["99", "abc", "0"])
      await expect(
        errorOf(
          set(coach, athlete.id, "special_preparation", n, {
            ownReasons: ["x"],
          }),
        ),
      ).resolves.toMatchObject({ code: "EXERCISE_NOT_FOUND" });
    await expect(
      errorOf(set(coach, athlete.id, "taper", "1", { ownReasons: ["x"] })),
    ).resolves.toMatchObject({ code: "MESOCYCLE_NOT_FOUND" });
  });
});

describe("removeMesocycleExercise", () => {
  it("removes one exercise of one mesocycle only", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    for (const type of ["general_preparation", "special_preparation"])
      for (const n of ["1", "13"])
        await setMesocycleExercise(coach, athlete.id, type, n, {
          ownReasons: ["x"],
        });
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
      tags: ["SKF"],
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
      await fieldsOf(updateBaseData(coach, athlete.id, { otherDeficits: "x" })),
    ).toEqual({
      otherDeficits: ["UNKNOWN_FIELD"],
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

describe("read access for the linked athlete", () => {
  const link = (athleteId: string, userId: string) =>
    testDb.db
      .update(athleteTable)
      .set({ userAccountId: userId })
      .where(eq(athleteTable.id, athleteId));

  async function linkedSetup() {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const linked = await createUser(testDb.db);
    await link(athlete.id, linked.id);
    return { coach, athlete, linked };
  }

  it("lets the linked athlete read the same macrocycle as the coach", async () => {
    const { coach, athlete, linked } = await linkedSetup();
    const asCoach = await getMacrocycle(coach, athlete.id);
    expect(await getMacrocycle(linked, athlete.id)).toEqual(asCoach);
    expect(await findMacrocycle(linked, athlete.id)).toEqual(asCoach);
  });

  it("refuses every change by the linked athlete", async () => {
    const { athlete, linked } = await linkedSetup();
    const attempts = () => [
      () => createMacrocycle(linked, athlete.id, baseData),
      () => updateBaseData(linked, athlete.id, { snatchGoalKg: 110 }),
      () => setSwot(linked, athlete.id, swot),
      () => setWeekLevel(linked, athlete.id, 11, { level: "high" }),
      () =>
        setMesocycleBorders(linked, athlete.id, {
          specialPreparationStart: 5,
          competitionPreparationStart: 14,
        }),
      () =>
        setMesocycleExercise(linked, athlete.id, "special_preparation", "13", {
          tags: ["SKF"],
        }),
      () =>
        removeMesocycleExercise(
          linked,
          athlete.id,
          "special_preparation",
          "13",
        ),
    ];
    // Without a Team of their own: the answer for every user without a Team.
    for (const attempt of attempts()) {
      await expect(errorOf(attempt())).resolves.toMatchObject({
        code: "NOT_A_COACH",
      });
    }
    // Leading another Team: the athlete is not in it.
    await startAsCoach(linked);
    for (const attempt of attempts()) {
      await expect(errorOf(attempt())).resolves.toMatchObject({
        code: "ATHLETE_NOT_FOUND",
      });
    }
    expect((await getMacrocycle(linked, athlete.id)).snatchGoalKg).toBe(100);
  });

  it("refuses unrelated users", async () => {
    const { athlete } = await linkedSetup();
    const stranger = await createUser(testDb.db);
    await expect(
      errorOf(getMacrocycle(stranger, athlete.id)),
    ).resolves.toMatchObject({ code: "ATHLETE_NOT_FOUND" });
  });

  it("lets a coach who is linked to an Athlete of another Team see both", async () => {
    const { athlete: own, linked } = await linkedSetup();
    // The linked user also leads a Team of their own.
    await startAsCoach(linked);
    const theirs = await createAthlete(linked, { name: "Max Coach" });
    await createMacrocycle(linked, theirs.id, baseData);
    expect((await getMacrocycle(linked, own.id)).athleteId).toBe(own.id);
    expect((await getMacrocycle(linked, theirs.id)).athleteId).toBe(theirs.id);
  });
});

describe("canPlanMacrocycle", () => {
  it("is true only for the coach of the athlete's Team", async () => {
    const { coach, athlete } = await setup();
    expect(await canPlanMacrocycle(coach, athlete.id)).toBe(true);
    // The linked athlete, first without a Team, then leading another one.
    const linked = await createUser(testDb.db);
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: linked.id })
      .where(eq(athleteTable.id, athlete.id));
    expect(await canPlanMacrocycle(linked, athlete.id)).toBe(false);
    await startAsCoach(linked);
    expect(await canPlanMacrocycle(linked, athlete.id)).toBe(false);
    const stranger = await createUser(testDb.db);
    expect(await canPlanMacrocycle(stranger, athlete.id)).toBe(false);
  });

  it("is true for a coach who trains themselves", async () => {
    const { coach, athlete } = await setup();
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: coach.id })
      .where(eq(athleteTable.id, athlete.id));
    expect(await canPlanMacrocycle(coach, athlete.id)).toBe(true);
  });
});

describe("getExerciseWeeks", () => {
  it("returns the snatch values of every week as in the spec", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const { exerciseNumber, weeks } = await getExerciseWeeks(
      coach,
      athlete.id,
      "1",
    );
    expect(exerciseNumber).toBe(1);
    expect(weeks).toHaveLength(21);
    expect(weeks[0]).toEqual({
      number: 1,
      bestKg: 60,
      averageKg: 52,
      setSize: 5,
      weeklyReps: 30,
    });
    expect(weeks[10]).toEqual({
      number: 11,
      bestKg: 80,
      averageKg: 69,
      setSize: 3,
      weeklyReps: 20,
    });
  });

  it("follows the week levels and does not depend on the chosen exercises", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    await setWeekLevel(coach, athlete.id, 11, { level: "high" });
    // Exercise 1 is chosen in no mesocycle; its values exist anyway.
    const { weeks } = await getExerciseWeeks(coach, athlete.id, "1");
    expect(weeks[10]).toEqual({
      number: 11,
      bestKg: 85,
      averageKg: 73,
      setSize: 3,
      weeklyReps: 21,
    });
  });

  it("has no values for an exercise without catalog values", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const { weeks } = await getExerciseWeeks(coach, athlete.id, "31");
    expect(
      weeks.every(
        (w) =>
          w.bestKg === null &&
          w.averageKg === null &&
          w.setSize === null &&
          w.weeklyReps === null,
      ),
    ).toBe(true);
  });

  it("answers unknown exercises, missing macrocycles and other users", async () => {
    const { coach, athlete } = await setup();
    await expect(
      errorOf(getExerciseWeeks(coach, athlete.id, "1")),
    ).resolves.toMatchObject({
      code: "MACROCYCLE_NOT_FOUND",
    });
    await createMacrocycle(coach, athlete.id, baseData);
    for (const n of ["99", "abc", "0"])
      await expect(
        errorOf(getExerciseWeeks(coach, athlete.id, n)),
      ).resolves.toMatchObject({
        code: "EXERCISE_NOT_FOUND",
      });
    const stranger = await createUser(testDb.db);
    await expect(
      errorOf(getExerciseWeeks(stranger, athlete.id, "1")),
    ).resolves.toMatchObject({
      code: "ATHLETE_NOT_FOUND",
    });
  });

  it("is readable by the linked athlete", async () => {
    const { coach, athlete } = await setup();
    await createMacrocycle(coach, athlete.id, baseData);
    const linked = await createUser(testDb.db);
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: linked.id })
      .where(eq(athleteTable.id, athlete.id));
    expect(await getExerciseWeeks(linked, athlete.id, "13")).toEqual(
      await getExerciseWeeks(coach, athlete.id, "13"),
    );
  });
});
