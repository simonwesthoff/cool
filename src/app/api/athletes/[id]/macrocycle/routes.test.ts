import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
const getSession = vi.fn();
vi.mock("@/server/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));

const main = await import("./route");
const weeks = await import("./weeks/[week]/route");
const exercises = await import("./mesocycles/[type]/exercises/[number]/route");
const borders = await import("./mesocycles/borders/route");
const swot = await import("./swot/route");
const { startAsCoach } = await import("@/domain/roles");
const { createAthlete } = await import("@/domain/athletes");

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
  trainingFrequency: 8,
};
const swotData = {
  strengths: "Fast under the bar",
  snatchDeficits: "Turnover",
  cleanDeficits: "Catch",
  jerkDeficits: "Dip",
  otherDeficits: "None",
  experience: "6 years, 2 national championships",
  focusPoints: ["Turnover", "Squat strength"],
  injuriesAndIllnesses: "None",
};
const json = (method: string, body: unknown) =>
  new Request("https://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const ctx = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});
const as = (user: unknown) =>
  getSession.mockResolvedValue(user ? { session: {}, user } : null);

async function coachWithAthlete() {
  const coach = await createUser(testDb.db);
  await startAsCoach(coach);
  const athlete = await createAthlete(coach, { name: "Anna" });
  as(coach);
  return { coach, athlete };
}

describe("macrocycle API", () => {
  beforeEach(() => getSession.mockReset());

  it("creates (201), reads with calculated values, and refuses a second one (409)", async () => {
    const { athlete } = await coachWithAthlete();
    const id = { id: athlete.id };
    const missing = await main.GET(
      new Request("https://localhost/api"),
      ctx(id),
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: { code: "MACROCYCLE_NOT_FOUND" },
    });

    const created = await main.POST(json("POST", baseData), ctx(id));
    expect(created.status).toBe(201);
    const put = await exercises.PUT(
      json("PUT", { tags: ["SKF"], variation: "From blocks" }),
      ctx({ ...id, type: "special_preparation", number: "13" }),
    );
    expect(put.status).toBe(200);
    expect((await put.json()).mesocycles[1].exercises).toEqual([
      {
        exerciseNumber: 13,
        variation: "From blocks",
        tags: ["SKF"],
        ownReasons: [],
      },
    ]);
    const invalid = await exercises.PUT(
      json("PUT", { ownReasons: [] }),
      ctx({ ...id, type: "special_preparation", number: "14" }),
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED", fields: { reason: ["REQUIRED"] } },
    });

    const read = await (
      await main.GET(new Request("https://localhost/api"), ctx(id))
    ).json();
    expect(read.weeks[10]).toMatchObject({ intensityPct: 80 });
    expect(read.weeks[10].exercises).toEqual([
      {
        exerciseNumber: 13,
        bestKg: 86,
        averageKg: 75,
        setSize: 6,
        weeklyReps: 33,
      },
    ]);

    const again = await main.POST(json("POST", baseData), ctx(id));
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({
      error: { code: "MACROCYCLE_EXISTS" },
    });

    const removed = await exercises.DELETE(
      new Request("https://localhost/api", { method: "DELETE" }),
      ctx({ ...id, type: "special_preparation", number: "13" }),
    );
    expect(removed.status).toBe(204);
    const after = await (
      await main.GET(new Request("https://localhost/api"), ctx(id))
    ).json();
    expect(after.mesocycles[1].exercises).toEqual([]);
  });

  it("changes base data, the SWOT and week levels", async () => {
    const { athlete } = await coachWithAthlete();
    const id = { id: athlete.id };
    await main.POST(json("POST", baseData), ctx(id));
    const patched = await main.PATCH(
      json("PATCH", { snatchGoalKg: 105 }),
      ctx(id),
    );
    expect((await patched.json()).snatchGoalKg).toBe(105);
    const saved = await swot.PUT(json("PUT", swotData), ctx(id));
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      ...swotData,
      snatchGoalKg: 105,
    });
    const incomplete = await swot.PUT(
      json("PUT", { ...swotData, strengths: "" }),
      ctx(id),
    );
    expect(incomplete.status).toBe(400);
    expect(await incomplete.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED", fields: { strengths: ["REQUIRED"] } },
    });
    const high = await weeks.PUT(
      json("PUT", { level: "high" }),
      ctx({ ...id, week: "11" }),
    );
    expect((await high.json()).weeks[10]).toMatchObject({
      level: "high",
      intensityPct: 85,
    });
    const unknown = await weeks.PUT(
      json("PUT", { level: "high" }),
      ctx({ ...id, week: "abc" }),
    );
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: { code: "WEEK_NOT_FOUND" } });
  });

  it("sets the mesocycle borders (200) and rejects invalid ones (400)", async () => {
    const { athlete } = await coachWithAthlete();
    const id = { id: athlete.id };
    await main.POST(json("POST", baseData), ctx(id));
    const ok = await borders.PUT(
      json("PUT", {
        specialPreparationStart: 6,
        competitionPreparationStart: 14,
      }),
      ctx(id),
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).mesocycles[0]).toMatchObject({
      firstWeek: 1,
      lastWeek: 5,
    });
    const bad = await borders.PUT(
      json("PUT", {
        specialPreparationStart: 6,
        competitionPreparationStart: 6,
      }),
      ctx(id),
    );
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        fields: { _root: ["INVALID_BORDERS"] },
      },
    });
  });

  it("answers invalid base data with 400 and field codes", async () => {
    const { athlete } = await coachWithAthlete();
    const response = await main.POST(
      json("POST", { ...baseData, startDate: "2026-12-02" }),
      ctx({ id: athlete.id }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        fields: { startDate: ["NOT_MONDAY"] },
      },
    });
  });

  it("answers another Team (404), users without a Team (403) and no session (401)", async () => {
    const { athlete } = await coachWithAthlete();
    const id = { id: athlete.id };
    const other = await createUser(testDb.db);
    await startAsCoach(other);
    as(other);
    const foreign = await main.POST(json("POST", baseData), ctx(id));
    expect(foreign.status).toBe(404);
    expect(await foreign.json()).toEqual({
      error: { code: "ATHLETE_NOT_FOUND" },
    });

    as(await createUser(testDb.db));
    expect(
      (await main.GET(new Request("https://localhost/api"), ctx(id))).status,
    ).toBe(403);

    as(null);
    for (const response of [
      await main.GET(new Request("https://localhost/api"), ctx(id)),
      await main.POST(json("POST", baseData), ctx(id)),
      await main.PATCH(json("PATCH", {}), ctx(id)),
      await swot.PUT(json("PUT", swotData), ctx(id)),
      await weeks.PUT(
        json("PUT", { level: "high" }),
        ctx({ ...id, week: "1" }),
      ),
      await exercises.PUT(
        json("PUT", { ownReasons: ["x"] }),
        ctx({ ...id, type: "special_preparation", number: "13" }),
      ),
      await exercises.DELETE(
        new Request("https://localhost/api", { method: "DELETE" }),
        ctx({ ...id, type: "special_preparation", number: "13" }),
      ),
    ]) {
      expect(response.status).toBe(401);
    }
  });
});
