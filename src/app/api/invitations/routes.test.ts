import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, createUser } from "@/test/db";

const testDb = await createTestDb();
vi.mock("@/server/db", () => ({ getDb: () => testDb.db }));
const getSession = vi.fn();
vi.mock("@/server/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.stubEnv("BETTER_AUTH_URL", "https://cool.example.com");

const createRoute = await import("../athletes/[id]/invitations/route");
const linkSelfRoute = await import("../athletes/[id]/link-self/route");
const infoRoute = await import("./[token]/route");
const acceptRoute = await import("./[token]/accept/route");
const { startAsCoach } = await import("@/domain/roles");
const { createAthlete } = await import("@/domain/athletes");
const { INVITATION_VALIDITY_MS } = await import("@/domain/invitations");

const post = (url: string) => new Request(url, { method: "POST" });
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });
const tokenCtx = (token: string) => ({ params: Promise.resolve({ token }) });

async function as(user: { id: string; name: string; email: string }) {
  getSession.mockResolvedValue({ session: {}, user: { ...user, image: null } });
}

async function setup() {
  const coach = await createUser(testDb.db, "Max Berg");
  await startAsCoach(coach);
  const anna = await createAthlete(coach, { name: "Anna Weber" });
  await as(coach);
  const response = await createRoute.POST(
    post("https://x/api"),
    idCtx(anna.id),
  );
  const body = await response.json();
  return {
    coach,
    anna,
    response,
    body,
    token: String(body.url).split("/").pop()!,
  };
}

describe("invitation API", () => {
  beforeEach(() => {
    getSession.mockReset();
    vi.useRealTimers();
  });

  it("creates an invitation link (201) with expiry", async () => {
    const { response, body } = await setup();
    expect(response.status).toBe(201);
    expect(body.url).toMatch(
      /^https:\/\/cool\.example\.com\/invite\/[A-Za-z0-9_-]{43}$/,
    );
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("shows and accepts a valid invitation", async () => {
    const { token, anna } = await setup();
    await as(await createUser(testDb.db));
    const info = await infoRoute.GET(new Request("https://x"), tokenCtx(token));
    expect(await info.json()).toEqual({
      status: "valid",
      coachName: "Max Berg",
      athleteName: "Anna Weber",
    });
    const accepted = await acceptRoute.POST(post("https://x"), tokenCtx(token));
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ athleteId: anna.id });

    await as(await createUser(testDb.db));
    const again = await acceptRoute.POST(post("https://x"), tokenCtx(token));
    expect(again.status).toBe(410);
    expect(await again.json()).toEqual({ error: { code: "INVITATION_USED" } });
  });

  it("answers an expired invitation with 410 INVITATION_EXPIRED", async () => {
    const { token } = await setup();
    vi.useFakeTimers({ now: Date.now() + INVITATION_VALIDITY_MS + 1000 });
    await as(await createUser(testDb.db));
    const response = await acceptRoute.POST(post("https://x"), tokenCtx(token));
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: { code: "INVITATION_EXPIRED" },
    });
  });

  it("answers an unknown invitation with 404", async () => {
    await as(await createUser(testDb.db));
    const response = await infoRoute.GET(
      new Request("https://x"),
      tokenCtx("a".repeat(43)),
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "INVITATION_NOT_FOUND" },
    });
  });

  it("answers another Team's athlete with 404 and a linked athlete with 409", async () => {
    const { anna, coach, token } = await setup();
    const other = await createUser(testDb.db);
    await startAsCoach(other);
    await as(other);
    const foreign = await createRoute.POST(post("https://x"), idCtx(anna.id));
    expect(foreign.status).toBe(404);
    expect(await foreign.json()).toEqual({
      error: { code: "ATHLETE_NOT_FOUND" },
    });

    await as(await createUser(testDb.db));
    await acceptRoute.POST(post("https://x"), tokenCtx(token));
    await as(coach);
    const linked = await createRoute.POST(post("https://x"), idCtx(anna.id));
    expect(linked.status).toBe(409);
    expect(await linked.json()).toEqual({
      error: { code: "ATHLETE_ALREADY_LINKED" },
    });
  });

  it("links the coach with This is me (200) and refuses a second time (409)", async () => {
    const { coach, anna } = await setup();
    const lena = await createAthlete(coach, { name: "Lena" });
    await as(coach);
    const first = await linkSelfRoute.POST(post("https://x"), idCtx(anna.id));
    expect(first.status).toBe(200);
    expect((await first.json()).linkedAccount).toEqual({
      email: coach.email,
      image: null,
    });
    const second = await linkSelfRoute.POST(post("https://x"), idCtx(lena.id));
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ error: { code: "ALREADY_LINKED" } });
  });

  it("answers users without a Team with 403 and requests without a session with 401", async () => {
    const { anna, token } = await setup();
    await as(await createUser(testDb.db));
    const forbidden = await createRoute.POST(post("https://x"), idCtx(anna.id));
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: { code: "NOT_A_COACH" } });

    getSession.mockResolvedValue(null);
    for (const response of [
      await createRoute.POST(post("https://x"), idCtx(anna.id)),
      await linkSelfRoute.POST(post("https://x"), idCtx(anna.id)),
      await infoRoute.GET(new Request("https://x"), tokenCtx(token)),
      await acceptRoute.POST(post("https://x"), tokenCtx(token)),
    ]) {
      expect(response.status).toBe(401);
    }
  });
});
