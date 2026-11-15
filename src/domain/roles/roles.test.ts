import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { athlete, team } from "@/server/db/schema";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { getRoles, startAsCoach } = await import("./roles");

async function addAthlete(teamId: string, name: string, userId?: string) {
  const [row] = await testDb.db
    .insert(athlete)
    .values({ teamId, name, userAccountId: userId ?? null })
    .returning();
  return row!;
}

describe("getRoles", () => {
  it("has no role for a new user", async () => {
    const user = await createUser(testDb.db);
    await expect(getRoles(user)).resolves.toEqual({
      coach: null,
      athlete: null,
    });
  });

  it("is coach of the Team the user leads", async () => {
    const user = await createUser(testDb.db);
    const { team: own } = await startAsCoach(user);
    await expect(getRoles(user)).resolves.toEqual({
      coach: { teamId: own.id },
      athlete: null,
    });
  });

  it("is athlete of the Team of the linked Athlete, with the coach's name", async () => {
    const coach = await createUser(testDb.db, "Max Berg");
    const { team: coachTeam } = await startAsCoach(coach);
    const user = await createUser(testDb.db);
    const anna = await addAthlete(coachTeam.id, "Anna Weber", user.id);
    await expect(getRoles(user)).resolves.toEqual({
      coach: null,
      athlete: {
        athleteId: anna.id,
        athleteName: "Anna Weber",
        teamId: coachTeam.id,
        coachName: "Max Berg",
      },
    });
  });

  it("can be coach of one Team and athlete in another", async () => {
    const national = await createUser(testDb.db, "National Coach");
    const { team: nationalTeam } = await startAsCoach(national);
    const user = await createUser(testDb.db);
    const { team: own } = await startAsCoach(user);
    await addAthlete(nationalTeam.id, "Club Coach", user.id);
    const roles = await getRoles(user);
    expect(roles.coach).toEqual({ teamId: own.id });
    expect(roles.athlete).toMatchObject({
      teamId: nationalTeam.id,
      coachName: "National Coach",
    });
  });

  it("can be coach and athlete in the same Team", async () => {
    const user = await createUser(testDb.db, "Self Coach");
    const { team: own } = await startAsCoach(user);
    await addAthlete(own.id, "Self Coach", user.id);
    const roles = await getRoles(user);
    expect(roles.coach).toEqual({ teamId: own.id });
    expect(roles.athlete).toMatchObject({
      teamId: own.id,
      coachName: "Self Coach",
    });
  });

  it("does not create a Team", async () => {
    const user = await createUser(testDb.db);
    await getRoles(user);
    const rows = await testDb.db
      .select()
      .from(team)
      .where(eq(team.coachId, user.id));
    expect(rows).toEqual([]);
  });
});

describe("startAsCoach", () => {
  it("creates the Team once", async () => {
    const user = await createUser(testDb.db);
    const first = await startAsCoach(user);
    const second = await startAsCoach(user);
    expect(first.created).toBe(true);
    expect(second).toEqual({ team: first.team, created: false });
  });

  it("creates one Team even with parallel calls", async () => {
    const user = await createUser(testDb.db);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => startAsCoach(user)),
    );
    expect(new Set(results.map((r) => r.team.id)).size).toBe(1);
    expect(results.filter((r) => r.created)).toHaveLength(1);
  });
});
