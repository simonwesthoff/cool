import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { invitation } from "@/server/db/schema";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
afterAll(() => testDb.close());

const { createAthlete, getAthlete } = await import("@/domain/athletes");
const { getRoles, startAsCoach } = await import("@/domain/roles");
const {
  acceptInvitation,
  createInvitation,
  getInvitation,
  INVITATION_VALIDITY_MS,
  linkSelf,
} = await import("./invitations");
const { hashToken } = await import("./token");

const errorOf = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e: unknown) => e,
  );

async function coachWithAthlete(
  coachName = "Max Berg",
  athleteName = "Anna Weber",
) {
  const coach = await createUser(testDb.db, coachName);
  await startAsCoach(coach);
  const anna = await createAthlete(coach, { name: athleteName });
  return { coach, anna };
}

describe("createInvitation", () => {
  it("returns a token valid for 7 days and stores only its hash", async () => {
    const { coach, anna } = await coachWithAthlete();
    const now = new Date("2026-11-15T10:00:00Z");
    const { token, expiresAt } = await createInvitation(coach, anna.id, now);
    expect(expiresAt.getTime() - now.getTime()).toBe(INVITATION_VALIDITY_MS);

    const rows = await testDb.db
      .select()
      .from(invitation)
      .where(eq(invitation.athleteId, anna.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(rows)).not.toContain(token);
    await expect(getInvitation(token, now)).resolves.toEqual({
      status: "valid",
      coachName: "Max Berg",
      athleteName: "Anna Weber",
    });
  });

  it("replaces the previous invitation of the athlete", async () => {
    const { coach, anna } = await coachWithAthlete();
    const first = await createInvitation(coach, anna.id);
    const second = await createInvitation(coach, anna.id);
    expect((await getInvitation(first.token)).status).toBe("used");
    expect((await getInvitation(second.token)).status).toBe("valid");
    const user = await createUser(testDb.db);
    await expect(
      errorOf(acceptInvitation(user, first.token)),
    ).resolves.toMatchObject({
      code: "INVITATION_USED",
      kind: "gone",
    });
  });

  it("is refused for an athlete of another Team", async () => {
    const { anna } = await coachWithAthlete();
    const other = await createUser(testDb.db);
    await startAsCoach(other);
    await expect(
      errorOf(createInvitation(other, anna.id)),
    ).resolves.toMatchObject({
      code: "ATHLETE_NOT_FOUND",
    });
  });

  it("is refused for a linked athlete", async () => {
    const { coach, anna } = await coachWithAthlete();
    const { token } = await createInvitation(coach, anna.id);
    await acceptInvitation(await createUser(testDb.db), token);
    await expect(
      errorOf(createInvitation(coach, anna.id)),
    ).resolves.toMatchObject({
      code: "ATHLETE_ALREADY_LINKED",
      kind: "conflict",
    });
  });

  it("is refused for users without a Team", async () => {
    const { anna } = await coachWithAthlete();
    const user = await createUser(testDb.db);
    await expect(
      errorOf(createInvitation(user, anna.id)),
    ).resolves.toMatchObject({
      code: "NOT_A_COACH",
    });
  });
});

describe("getInvitation", () => {
  it("reports expiry after 7 days", async () => {
    const { coach, anna } = await coachWithAthlete();
    const created = new Date("2026-11-01T10:00:00Z");
    const { token } = await createInvitation(coach, anna.id, created);
    const justBefore = new Date(created.getTime() + INVITATION_VALIDITY_MS - 1);
    const atExpiry = new Date(created.getTime() + INVITATION_VALIDITY_MS);
    expect((await getInvitation(token, justBefore)).status).toBe("valid");
    expect((await getInvitation(token, atExpiry)).status).toBe("expired");
  });

  it("reports unknown and malformed links as INVITATION_NOT_FOUND", async () => {
    for (const token of ["a".repeat(43), "not a token"]) {
      await expect(errorOf(getInvitation(token))).resolves.toMatchObject({
        code: "INVITATION_NOT_FOUND",
        kind: "not_found",
      });
    }
  });
});

describe("acceptInvitation", () => {
  it("links the user, uses up the invitation and shows email and picture", async () => {
    const { coach, anna } = await coachWithAthlete();
    const { token } = await createInvitation(coach, anna.id);
    const athleteUser = await createUser(testDb.db, "Anna W.");
    await expect(acceptInvitation(athleteUser, token)).resolves.toEqual({
      athleteId: anna.id,
    });

    expect((await getRoles(athleteUser)).athlete).toMatchObject({
      athleteId: anna.id,
      coachName: "Max Berg",
    });
    expect((await getInvitation(token)).status).toBe("used");
    await expect(getAthlete(coach, anna.id)).resolves.toMatchObject({
      linkedAccount: { email: athleteUser.email, image: null },
    });
    const again = await createUser(testDb.db);
    await expect(
      errorOf(acceptInvitation(again, token)),
    ).resolves.toMatchObject({
      code: "INVITATION_USED",
    });
  });

  it("refuses expired invitations", async () => {
    const { coach, anna } = await coachWithAthlete();
    const created = new Date("2026-11-01T10:00:00Z");
    const { token } = await createInvitation(coach, anna.id, created);
    const later = new Date(created.getTime() + INVITATION_VALIDITY_MS + 1);
    const user = await createUser(testDb.db);
    await expect(
      errorOf(acceptInvitation(user, token, later)),
    ).resolves.toMatchObject({
      code: "INVITATION_EXPIRED",
      kind: "gone",
    });
    expect((await getRoles(user)).athlete).toBeNull();
  });

  it("refuses users already linked to an athlete and keeps the invitation valid", async () => {
    const first = await coachWithAthlete();
    const second = await coachWithAthlete("Other Coach", "Lena Hoff");
    const user = await createUser(testDb.db);
    await acceptInvitation(
      user,
      (await createInvitation(first.coach, first.anna.id)).token,
    );

    const { token } = await createInvitation(second.coach, second.anna.id);
    await expect(errorOf(acceptInvitation(user, token))).resolves.toMatchObject(
      {
        code: "ALREADY_LINKED",
        kind: "conflict",
      },
    );
    expect((await getInvitation(token)).status).toBe("valid");
  });

  it("links exactly one of two users accepting at the same time", async () => {
    const { coach, anna } = await coachWithAthlete();
    const { token } = await createInvitation(coach, anna.id);
    const [a, b] = [await createUser(testDb.db), await createUser(testDb.db)];
    const results = await Promise.allSettled([
      acceptInvitation(a, token),
      acceptInvitation(b, token),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect(
      rejected && (rejected as PromiseRejectedResult).reason,
    ).toMatchObject({
      code: "INVITATION_USED",
    });
    const linked = [await getRoles(a), await getRoles(b)].filter(
      (r) => r.athlete,
    );
    expect(linked).toHaveLength(1);
  });
});

describe("linkSelf (This is me)", () => {
  it("links the coach to an athlete of their own Team and revokes invitations", async () => {
    const { coach, anna } = await coachWithAthlete();
    const { token } = await createInvitation(coach, anna.id);
    const result = await linkSelf(coach, anna.id);
    expect(result.linkedAccount).toEqual({ email: coach.email, image: null });
    const roles = await getRoles(coach);
    expect(roles.coach).not.toBeNull();
    expect(roles.athlete).toMatchObject({ athleteId: anna.id });
    expect((await getInvitation(token)).status).toBe("used");
  });

  it("is refused when the coach is already linked to an athlete", async () => {
    const { coach, anna } = await coachWithAthlete();
    const lena = await createAthlete(coach, { name: "Lena" });
    await linkSelf(coach, anna.id);
    await expect(errorOf(linkSelf(coach, lena.id))).resolves.toMatchObject({
      code: "ALREADY_LINKED",
    });
  });

  it("is refused for a linked athlete and for another Team's athlete", async () => {
    const { coach, anna } = await coachWithAthlete();
    await acceptInvitation(
      await createUser(testDb.db),
      (await createInvitation(coach, anna.id)).token,
    );
    await expect(errorOf(linkSelf(coach, anna.id))).resolves.toMatchObject({
      code: "ATHLETE_ALREADY_LINKED",
    });
    const other = await coachWithAthlete();
    await expect(
      errorOf(linkSelf(coach, other.anna.id)),
    ).resolves.toMatchObject({
      code: "ATHLETE_NOT_FOUND",
    });
  });
});
