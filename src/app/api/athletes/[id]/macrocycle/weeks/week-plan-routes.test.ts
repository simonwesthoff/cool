import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
const getSession = vi.fn();
vi.mock("@/server/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));

const plan = await import("./[week]/plan/route");
const plans = await import("./plans/route");
const feedback = await import("./[week]/plan/feedback/route");
const { athlete: athleteTable } = await import("@/server/db/schema");
const { eq } = await import("drizzle-orm");
const { startAsCoach } = await import("@/domain/roles");
const { createAthlete } = await import("@/domain/athletes");
const { createMacrocycle } = await import("@/domain/macrocycles");

const json = (method: string, body: unknown) =>
  new Request("https://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const get = () => new Request("https://localhost/api");
const ctx = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});
const as = (user: unknown) =>
  getSession.mockResolvedValue(user ? { session: {}, user } : null);

const week = {
  sessions: [
    {
      weekday: 1,
      slot: 1,
      exercises: [
        {
          exerciseNumber: 1,
          note: "Fast turnover",
          setGroups: [{ sets: 3, reps: 2, weightKg: 80 }],
        },
      ],
    },
  ],
};

async function setup() {
  const coach = await createUser(testDb.db);
  await startAsCoach(coach);
  const athlete = await createAthlete(coach, { name: "Anna" });
  await createMacrocycle(coach, athlete.id, {
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
    sessions: [{ weekday: 1, slot: 1 }],
  });
  as(coach);
  return { coach, athlete };
}

describe("week plan API", () => {
  beforeEach(() => getSession.mockReset());

  it("saves and reads a week, and lists the planned weeks", async () => {
    const { athlete } = await setup();
    const id = athlete.id;
    const saved = await plan.PUT(json("PUT", week), ctx({ id, week: "11" }));
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      weekNumber: 11,
      planned: true,
      sessions: week.sessions,
    });
    const read = await plan.GET(get(), ctx({ id, week: "11" }));
    expect(read.status).toBe(200);
    expect(read.headers.get("cache-control")).toBe("no-store");
    expect((await read.json()).sessions).toMatchObject(week.sessions);
    const list = await plans.GET(get(), ctx({ id }));
    expect(await list.json()).toEqual([
      { weekNumber: 11, startDate: "2027-02-08" },
    ]);
  });

  it("answers validation errors with 400 and field codes", async () => {
    const { athlete } = await setup();
    const response = await plan.PUT(
      json("PUT", {
        sessions: [
          {
            weekday: 1,
            slot: 1,
            exercises: [
              {
                exerciseNumber: 1,
                setGroups: [{ sets: 0, reps: 2, weightKg: 80 }],
              },
            ],
          },
        ],
      }),
      ctx({ id: athlete.id, week: "11" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "VALIDATION_FAILED",
        fields: { "sessions.0.exercises.0.setGroups.0.sets": ["OUT_OF_RANGE"] },
      },
    });
  });

  it("answers 404 for weeks outside the macrocycle and for strangers, 401 without a session", async () => {
    const { athlete } = await setup();
    const outside = await plan.PUT(
      json("PUT", week),
      ctx({ id: athlete.id, week: "22" }),
    );
    expect(outside.status).toBe(404);
    expect(await outside.json()).toEqual({
      error: { code: "WEEK_NOT_FOUND" },
    });
    as(await createUser(testDb.db));
    const stranger = await plan.GET(get(), ctx({ id: athlete.id, week: "1" }));
    expect(stranger.status).toBe(404);
    expect(await stranger.json()).toEqual({
      error: { code: "ATHLETE_NOT_FOUND" },
    });
    as(null);
    expect((await plans.GET(get(), ctx({ id: athlete.id }))).status).toBe(401);
  });

  it("lets the linked athlete read, but not save", async () => {
    const { coach, athlete } = await setup();
    await plan.PUT(json("PUT", week), ctx({ id: athlete.id, week: "11" }));
    const linked = await createUser(testDb.db);
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: linked.id })
      .where(eq(athleteTable.id, athlete.id));
    as(linked);
    const read = await plan.GET(get(), ctx({ id: athlete.id, week: "11" }));
    expect(read.status).toBe(200);
    expect((await read.json()).sessions).toMatchObject(week.sessions);
    expect((await plans.GET(get(), ctx({ id: athlete.id }))).status).toBe(200);
    const write = await plan.PUT(
      json("PUT", { sessions: [] }),
      ctx({ id: athlete.id, week: "11" }),
    );
    expect(write.status).toBe(403);
    expect(await write.json()).toEqual({ error: { code: "NOT_A_COACH" } });
    void coach;
  });

  it("lets only the linked athlete write feedback, which GET returns", async () => {
    const { athlete } = await setup();
    const id = athlete.id;
    await plan.PUT(json("PUT", week), ctx({ id, week: "11" }));
    const body = { weekday: 1, slot: 1, exerciseNumber: 1, feedback: "Heavy" };
    // The coach of the Team is not the athlete.
    const asCoach = await feedback.PUT(
      json("PUT", body),
      ctx({ id, week: "11" }),
    );
    expect(asCoach.status).toBe(403);
    expect(await asCoach.json()).toEqual({
      error: { code: "NOT_THE_ATHLETE" },
    });
    const linked = await createUser(testDb.db);
    await testDb.db
      .update(athleteTable)
      .set({ userAccountId: linked.id })
      .where(eq(athleteTable.id, id));
    as(linked);
    const ok = await feedback.PUT(json("PUT", body), ctx({ id, week: "11" }));
    expect(ok.status).toBe(200);
    const read = await plan.GET(get(), ctx({ id, week: "11" }));
    expect((await read.json()).sessions[0].exercises[0].feedback).toBe("Heavy");
    const missing = await feedback.PUT(
      json("PUT", { ...body, exerciseNumber: 13 }),
      ctx({ id, week: "11" }),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "EXERCISE_NOT_IN_WEEK" },
    });
    const tooLong = await feedback.PUT(
      json("PUT", { ...body, feedback: "x".repeat(501) }),
      ctx({ id, week: "11" }),
    );
    expect(tooLong.status).toBe(400);
    as(null);
    expect(
      (await feedback.PUT(json("PUT", body), ctx({ id, week: "11" }))).status,
    ).toBe(401);
  });
});
