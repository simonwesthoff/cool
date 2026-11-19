import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
const getSession = vi.fn();
vi.mock("@/server/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));

const { GET } = await import("./route");

describe("GET /api/exercises", () => {
  beforeEach(() => getSession.mockReset());

  it("returns 9 groups with 45 exercises in both languages", async () => {
    getSession.mockResolvedValue({
      session: {},
      user: await createUser(testDb.db),
    });
    const response = await GET(new Request("https://localhost/api/exercises"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, max-age=3600");
    const { groups } = await response.json();
    expect(groups).toHaveLength(9);
    const exercises = groups.flatMap(
      (g: { exercises: unknown[] }) => g.exercises,
    );
    expect(exercises).toHaveLength(45);
    expect(exercises[3].name).toEqual({ de: "Umsetzen", en: "Clean" });
    // Lift categories with each exercise.
    expect(exercises[11].liftCategories).toEqual(["jerk"]);
    expect(exercises[2].liftCategories).toEqual(["clean", "jerk"]);
    expect(exercises[30].liftCategories).toEqual([]);
  });

  it("needs a session", async () => {
    getSession.mockResolvedValue(null);
    const response = await GET(new Request("https://localhost/api/exercises"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
