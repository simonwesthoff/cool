import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";
import { DomainValidationError } from "@/domain/validation";
import { team } from "@/server/db/schema";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const {
  createAthlete,
  getAthlete,
  getOrCreateTeam,
  listAthletes,
  updateAthlete,
} = await import("./athletes");

async function errorOf(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: unknown) => error,
  );
}

describe("Team", () => {
  it("is created once per coach", async () => {
    const coach = await createUser(testDb.db);
    const first = await getOrCreateTeam(coach);
    const second = await getOrCreateTeam(coach);
    expect(second.id).toBe(first.id);
  });

  it("is created once even with parallel first calls", async () => {
    const coach = await createUser(testDb.db);
    const teams = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateTeam(coach)),
    );
    expect(new Set(teams.map((t) => t.id)).size).toBe(1);
    const rows = await testDb.db
      .select()
      .from(team)
      .where(eq(team.coachId, coach.id));
    expect(rows).toHaveLength(1);
  });

  it("starts without athletes", async () => {
    const coach = await createUser(testDb.db);
    await expect(listAthletes(coach)).resolves.toEqual([]);
  });
});

describe("athletes", () => {
  it("are created with only a name and listed", async () => {
    const coach = await createUser(testDb.db);
    const created = await createAthlete(coach, { name: "Max Berg" });
    expect(created).toEqual({
      id: expect.any(String),
      name: "Max Berg",
      dateOfBirth: null,
      gender: null,
      careerStartDate: null,
      heightCm: null,
    });
    await expect(listAthletes(coach)).resolves.toEqual([created]);
  });

  it("are created with all basic data", async () => {
    const coach = await createUser(testDb.db);
    const input = {
      name: "Anna Weber",
      dateOfBirth: "2005-03-01",
      gender: "female",
      careerStartDate: "2015-09-01",
      heightCm: 165,
    };
    const created = await createAthlete(coach, input);
    expect(created).toEqual({ id: expect.any(String), ...input });
    await expect(getAthlete(coach, created.id)).resolves.toEqual(created);
  });

  it("are listed sorted by name", async () => {
    const coach = await createUser(testDb.db);
    for (const name of ["Max Berg", "Anna Weber", "Lena Hoff"]) {
      await createAthlete(coach, { name });
    }
    const names = (await listAthletes(coach)).map((a) => a.name);
    expect(names).toEqual(["Anna Weber", "Lena Hoff", "Max Berg"]);
  });

  it("are not created with invalid data", async () => {
    const coach = await createUser(testDb.db);
    const error = await errorOf(
      createAthlete(coach, {
        name: "A",
        dateOfBirth: "2005-03-01",
        careerStartDate: "2004-01-01",
      }),
    );
    expect(error).toBeInstanceOf(DomainValidationError);
    expect((error as DomainValidationError).fields).toEqual({
      careerStartDate: ["BEFORE_DATE_OF_BIRTH"],
    });
    await expect(listAthletes(coach)).resolves.toEqual([]);
  });

  it("are updated, keeping other values", async () => {
    const coach = await createUser(testDb.db);
    const created = await createAthlete(coach, {
      name: "Anna",
      dateOfBirth: "2005-03-01",
      heightCm: 165,
    });
    const updated = await updateAthlete(coach, created.id, { heightCm: 167 });
    expect(updated).toEqual({ ...created, heightCm: 167 });
  });

  it("can have optional values cleared", async () => {
    const coach = await createUser(testDb.db);
    const created = await createAthlete(coach, {
      name: "Anna",
      dateOfBirth: "2005-03-01",
    });
    const updated = await updateAthlete(coach, created.id, {
      dateOfBirth: null,
    });
    expect(updated.dateOfBirth).toBeNull();
  });

  it("check the career start against the stored date of birth", async () => {
    const coach = await createUser(testDb.db);
    const created = await createAthlete(coach, {
      name: "Anna",
      dateOfBirth: "2005-03-01",
    });
    const error = await errorOf(
      updateAthlete(coach, created.id, { careerStartDate: "2004-01-01" }),
    );
    expect((error as DomainValidationError).fields).toEqual({
      careerStartDate: ["BEFORE_DATE_OF_BIRTH"],
    });
  });
});

describe("access to another Team", () => {
  it("is answered with ATHLETE_NOT_FOUND and changes nothing", async () => {
    const coachA = await createUser(testDb.db);
    const coachB = await createUser(testDb.db);
    const athleteOfA = await createAthlete(coachA, { name: "Anna" });

    for (const attempt of [
      getAthlete(coachB, athleteOfA.id),
      updateAthlete(coachB, athleteOfA.id, { name: "Hacked" }),
    ]) {
      const error = await errorOf(attempt);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toMatchObject({ code: "ATHLETE_NOT_FOUND" });
    }
    await expect(listAthletes(coachB)).resolves.toEqual([]);
    await expect(getAthlete(coachA, athleteOfA.id)).resolves.toMatchObject({
      name: "Anna",
    });
  });

  it("is ATHLETE_NOT_FOUND for a malformed or unknown id", async () => {
    const coach = await createUser(testDb.db);
    for (const id of ["not-a-uuid", "00000000-0000-4000-8000-000000000000"]) {
      await expect(errorOf(getAthlete(coach, id))).resolves.toMatchObject({
        code: "ATHLETE_NOT_FOUND",
      });
    }
  });
});
