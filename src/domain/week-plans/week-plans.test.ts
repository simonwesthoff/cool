import { afterAll, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { startAsCoach } = await import("@/domain/roles");
const { createAthlete } = await import("@/domain/athletes");
const { createMacrocycle, setMesocycleExercise } =
  await import("@/domain/macrocycles");
const { athlete: athleteTable } = await import("@/server/db/schema");
const { eq } = await import("drizzle-orm");
const {
  getWeekPlan,
  getTrainingWeeks,
  getWeekProjections,
  initialWeekContent,
  listWeekPlans,
  saveWeekPlan,
} = await import("./index");

/** 21 weeks from Monday 2026-11-30, entry 60 %, snatch goal 100 kg. */
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
  sessions: [
    { weekday: 1, slot: 1 },
    { weekday: 1, slot: 2 },
    { weekday: 3, slot: 1 },
    { weekday: 5, slot: 1 },
  ],
};

async function setup() {
  const coach = await createUser(testDb.db);
  await startAsCoach(coach);
  const athlete = await createAthlete(coach, { name: "Anna Weber" });
  await createMacrocycle(coach, athlete.id, baseData);
  return { coach, athlete };
}

/** The spec's week 11: the snatch on Monday (ramping up) and Thursday, 20 on Monday. */
const week11 = {
  sessions: [
    {
      weekday: 4,
      slot: 1,
      exercises: [
        {
          exerciseNumber: 1,
          setGroups: [{ sets: 3, reps: 2, weightKg: 75 }],
        },
      ],
    },
    {
      weekday: 1,
      slot: 1,
      exercises: [
        {
          exerciseNumber: 1,
          note: " Fast turnover ",
          setGroups: [
            { sets: 2, reps: 3, weightKg: 60 },
            { sets: 3, reps: 2, weightKg: 70 },
            { sets: 2, reps: 1, weightKg: 80 },
          ],
        },
        {
          exerciseNumber: 33,
          setGroups: [{ sets: 3, reps: 8, weightKg: null }],
        },
      ],
    },
  ],
};

const fieldsOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: { fields?: unknown }) => error.fields,
  );
const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: { code?: string }) => error.code,
  );

describe("saveWeekPlan and getWeekPlan", () => {
  it("stores the week in week order and reads it back", async () => {
    const { coach, athlete } = await setup();
    const saved = await saveWeekPlan(coach, athlete.id, "11", week11);
    expect(saved).toMatchObject({
      weekNumber: 11,
      durationWeeks: 21,
      startDate: "2027-02-08",
      mesocycle: "special_preparation",
      level: "medium",
      planned: true,
    });
    expect(saved.sessions).toEqual([
      {
        weekday: 1,
        slot: 1,
        exercises: [
          {
            exerciseNumber: 1,
            note: "Fast turnover",
            setGroups: [
              { sets: 2, reps: 3, weightKg: 60 },
              { sets: 3, reps: 2, weightKg: 70 },
              { sets: 2, reps: 1, weightKg: 80 },
            ],
          },
          {
            exerciseNumber: 33,
            note: null,
            setGroups: [{ sets: 3, reps: 8, weightKg: null }],
          },
        ],
      },
      {
        weekday: 4,
        slot: 1,
        exercises: [
          {
            exerciseNumber: 1,
            note: null,
            setGroups: [{ sets: 3, reps: 2, weightKg: 75 }],
          },
        ],
      },
    ]);
    expect(await getWeekPlan(coach, athlete.id, "11")).toEqual(saved);
    // Saving again replaces the week.
    const replaced = await saveWeekPlan(coach, athlete.id, "11", {
      sessions: [{ weekday: 2, slot: 1, exercises: [] }],
    });
    expect(replaced.sessions).toEqual([{ weekday: 2, slot: 1, exercises: [] }]);
  });

  it("makes a week unplanned when saved without sessions", async () => {
    const { coach, athlete } = await setup();
    await saveWeekPlan(coach, athlete.id, "11", week11);
    const emptied = await saveWeekPlan(coach, athlete.id, "11", {
      sessions: [],
    });
    expect(emptied).toMatchObject({ planned: false, sessions: [] });
    expect(await listWeekPlans(coach, athlete.id)).toEqual([]);
  });

  it("validates sets, weights, duplicates, the number of sessions and slots", async () => {
    const { coach, athlete } = await setup();
    const one = (setGroups: unknown) => ({
      sessions: [
        { weekday: 1, slot: 1, exercises: [{ exerciseNumber: 1, setGroups }] },
      ],
    });
    expect(
      await fieldsOf(
        saveWeekPlan(
          coach,
          athlete.id,
          "11",
          one([
            { sets: 0, reps: 2, weightKg: 80 },
            { sets: 3, reps: 2, weightKg: 82.3 },
          ]),
        ),
      ),
    ).toEqual({
      "sessions.0.exercises.0.setGroups.0.sets": ["OUT_OF_RANGE"],
      "sessions.0.exercises.0.setGroups.1.weightKg": ["NOT_HALF_KG"],
    });
    expect(
      await fieldsOf(
        saveWeekPlan(coach, athlete.id, "11", {
          sessions: [
            {
              weekday: 1,
              slot: 4,
              exercises: [
                { exerciseNumber: 1, setGroups: [] },
                { exerciseNumber: 1, setGroups: [] },
              ],
            },
          ],
        }),
      ),
    ).toEqual({
      "sessions.0.slot": ["OUT_OF_RANGE"],
      "sessions.0.exercises": ["DUPLICATE"],
    });
    const fifteen = Array.from({ length: 15 }, (_, i) => ({
      weekday: (i % 7) + 1,
      slot: Math.floor(i / 7) + 1,
      exercises: [],
    }));
    expect(
      await fieldsOf(
        saveWeekPlan(coach, athlete.id, "11", { sessions: fifteen }),
      ),
    ).toEqual({ sessions: ["TOO_MANY"] });
    expect(
      await fieldsOf(
        saveWeekPlan(coach, athlete.id, "11", {
          sessions: [
            { weekday: 1, slot: 1, exercises: [] },
            { weekday: 1, slot: 1, exercises: [] },
          ],
        }),
      ),
    ).toEqual({ sessions: ["DUPLICATE"] });
    expect(
      await fieldsOf(
        saveWeekPlan(coach, athlete.id, "11", {
          sessions: [
            {
              weekday: 1,
              slot: 1,
              exercises: [{ exerciseNumber: 999, setGroups: [] }],
            },
          ],
        }),
      ),
    ).toEqual({
      "sessions.0.exercises.0.exerciseNumber": ["UNKNOWN_EXERCISE"],
    });
  });

  it("refuses weeks outside the macrocycle", async () => {
    const { coach, athlete } = await setup();
    for (const week of ["0", "22", "x"])
      expect(await codeOf(saveWeekPlan(coach, athlete.id, week, week11))).toBe(
        "WEEK_NOT_FOUND",
      );
  });
});

describe("mesocycle check", () => {
  it("lists missing and not planned exercises as in the spec", async () => {
    const { coach, athlete } = await setup();
    for (const number of ["1", "13"])
      await setMesocycleExercise(
        coach,
        athlete.id,
        "special_preparation",
        number,
        { ownReasons: ["Technique"] },
      );
    const plan = await saveWeekPlan(coach, athlete.id, "11", {
      sessions: [
        {
          weekday: 1,
          slot: 1,
          exercises: [
            { exerciseNumber: 1, setGroups: [] },
            { exerciseNumber: 20, setGroups: [] },
          ],
        },
      ],
    });
    expect(plan.check).toEqual({
      chosen: [1, 13],
      missing: [13],
      notPlanned: [20],
    });
    expect(plan.variations).toEqual({});
    await setMesocycleExercise(coach, athlete.id, "special_preparation", "13", {
      ownReasons: ["Technique"],
      variation: "From blocks",
    });
    expect((await getWeekPlan(coach, athlete.id, "11")).variations).toEqual({
      13: "From blocks",
    });
  });
});

describe("access", () => {
  it("lets the linked athlete read but not write, and refuses strangers", async () => {
    const { coach, athlete } = await setup();
    await saveWeekPlan(coach, athlete.id, "11", week11);
    const linked = await createUser(testDb.db);
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: linked.id })
      .where(eq(athleteTable.id, athlete.id));
    expect(await getWeekPlan(linked, athlete.id, "11")).toEqual(
      await getWeekPlan(coach, athlete.id, "11"),
    );
    expect(await listWeekPlans(linked, athlete.id)).toEqual([
      { weekNumber: 11, startDate: "2027-02-08" },
    ]);
    expect(await codeOf(saveWeekPlan(linked, athlete.id, "11", week11))).toBe(
      "NOT_A_COACH",
    );
    expect(
      await codeOf(initialWeekContent(linked, athlete.id, "12", true)),
    ).toBe("NOT_A_COACH");
    const stranger = await createUser(testDb.db);
    expect(await codeOf(getWeekPlan(stranger, athlete.id, "11"))).toBe(
      "ATHLETE_NOT_FOUND",
    );
  });
});

describe("initialWeekContent", () => {
  it("starts with the stored plan, a copy of the previous week, or the schedule", async () => {
    const { coach, athlete } = await setup();
    await saveWeekPlan(coach, athlete.id, "11", week11);
    const stored = await initialWeekContent(coach, athlete.id, "11", true);
    expect(stored.source).toBe("stored");
    const copy = await initialWeekContent(coach, athlete.id, "12", true);
    expect(copy.source).toBe("previous");
    // The copy keeps the coach notes and is not stored.
    expect(copy.sessions).toEqual(stored.sessions);
    expect(copy.plan.planned).toBe(false);
    expect(await listWeekPlans(coach, athlete.id)).toHaveLength(1);
    const schedule = await initialWeekContent(coach, athlete.id, "12", false);
    expect(schedule.source).toBe("schedule");
    expect(schedule.sessions).toEqual([
      { weekday: 1, slot: 1, exercises: [] },
      { weekday: 1, slot: 2, exercises: [] },
      { weekday: 3, slot: 1, exercises: [] },
      { weekday: 5, slot: 1, exercises: [] },
    ]);
    // Week 1 has no previous week.
    expect(
      (await initialWeekContent(coach, athlete.id, "1", true)).source,
    ).toBe("schedule");
  });
});

describe("getWeekProjections", () => {
  it("projects the snatch in week 11 as in the spec", async () => {
    const { coach, athlete } = await setup();
    const projections = await getWeekProjections(coach, athlete.id, "11");
    expect(projections[1]).toEqual({
      bestKg: 80,
      averageKg: 69,
      setSize: 3,
      weeklyReps: 20,
    });
  });
});

describe("duration guard", () => {
  it("refuses a duration that would remove a planned week", async () => {
    const { updateBaseData } = await import("@/domain/macrocycles");
    const { coach, athlete } = await setup();
    await saveWeekPlan(coach, athlete.id, "20", week11);
    expect(
      await fieldsOf(updateBaseData(coach, athlete.id, { durationWeeks: 18 })),
    ).toEqual({ durationWeeks: ["WEEKS_PLANNED"] });
    const longer = await updateBaseData(coach, athlete.id, {
      durationWeeks: 20,
    });
    expect(longer.durationWeeks).toBe(20);
    expect(await listWeekPlans(coach, athlete.id)).toEqual([
      { weekNumber: 20, startDate: "2027-04-12" },
    ]);
  });
});

describe("getTrainingWeeks", () => {
  it("names the current and next week and the planned weeks", async () => {
    const { coach, athlete } = await setup();
    await saveWeekPlan(coach, athlete.id, "5", week11);
    await saveWeekPlan(coach, athlete.id, "6", week11);
    expect(await getTrainingWeeks(coach, athlete.id, "2027-01-06")).toEqual({
      current: { weekNumber: 6, planned: true },
      next: { weekNumber: 7, planned: false },
      planned: [
        { weekNumber: 5, startDate: "2026-12-28" },
        { weekNumber: 6, startDate: "2027-01-04" },
      ],
    });
    expect(
      (await getTrainingWeeks(coach, athlete.id, "2026-11-20"))?.next,
    ).toEqual({ weekNumber: 1, planned: false });
  });

  it("is null without a macrocycle", async () => {
    const coach = await createUser(testDb.db);
    await startAsCoach(coach);
    const athlete = await createAthlete(coach, { name: "No Plan" });
    expect(await getTrainingWeeks(coach, athlete.id, "2027-01-06")).toBeNull();
  });
});
