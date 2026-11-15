import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));

const getSession = vi.fn();
vi.mock("@/server/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));

const collection = await import("./route");
const item = await import("./[id]/route");

const base = "https://localhost/api/athletes";
const json = (method: string, body: unknown, url = base) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function signInAs() {
  const user = await createUser(testDb.db);
  getSession.mockResolvedValue({ session: {}, user });
  return user;
}

describe("athletes API", () => {
  beforeEach(() => getSession.mockReset());

  it("creates (201), lists and reads athletes", async () => {
    await signInAs();
    const created = await collection.POST(json("POST", { name: "Anna" }));
    expect(created.status).toBe(201);
    const athlete = await created.json();
    expect(athlete).toMatchObject({ id: expect.any(String), name: "Anna" });

    const list = await collection.GET(new Request(base));
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual({ athletes: [athlete] });

    const one = await item.GET(
      new Request(`${base}/${athlete.id}`),
      ctx(athlete.id),
    );
    expect(await one.json()).toEqual(athlete);
  });

  it("updates an athlete (200)", async () => {
    await signInAs();
    const athlete = await (
      await collection.POST(json("POST", { name: "Anna", heightCm: 165 }))
    ).json();
    const response = await item.PATCH(
      json("PATCH", { heightCm: 167 }, `${base}/${athlete.id}`),
      ctx(athlete.id),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...athlete, heightCm: 167 });
  });

  it("answers invalid input with 400 VALIDATION_FAILED and field codes", async () => {
    await signInAs();
    const response = await collection.POST(
      json("POST", { name: "Anna", heightCm: 300 }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        fields: { heightCm: ["OUT_OF_RANGE"] },
      },
    });
  });

  it("answers malformed JSON with 400 INVALID_JSON", async () => {
    await signInAs();
    const response = await collection.POST(
      new Request(base, { method: "POST", body: "{" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_JSON" } });
  });

  it("answers another Team's athlete with 404 ATHLETE_NOT_FOUND", async () => {
    await signInAs();
    const athlete = await (
      await collection.POST(json("POST", { name: "Anna" }))
    ).json();
    await signInAs();
    for (const response of [
      await item.GET(new Request(`${base}/${athlete.id}`), ctx(athlete.id)),
      await item.PATCH(
        json("PATCH", { name: "X" }, `${base}/${athlete.id}`),
        ctx(athlete.id),
      ),
    ]) {
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: { code: "ATHLETE_NOT_FOUND" },
      });
    }
  });

  it("answers requests without a session with 401", async () => {
    getSession.mockResolvedValue(null);
    const id = "00000000-0000-4000-8000-000000000000";
    for (const response of [
      await collection.GET(new Request(base)),
      await collection.POST(json("POST", { name: "Anna" })),
      await item.GET(new Request(`${base}/${id}`), ctx(id)),
      await item.PATCH(json("PATCH", { name: "A" }, `${base}/${id}`), ctx(id)),
    ]) {
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: { code: "UNAUTHENTICATED" },
      });
    }
  });
});
