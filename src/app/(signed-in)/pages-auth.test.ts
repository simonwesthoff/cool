import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/server/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ cookie: "__Secure-better-auth.session_token=invalid" }),
}));
class Redirect extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));
vi.mock("@/domain/athletes", () => ({ listAthletes: async () => [] }));
const getRoles = vi.fn();
vi.mock("@/domain/roles", () => ({ getRoles }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const { Home } = await import("./page");
const { SignIn: SignInPage } = await import("../sign-in/page");

async function redirectOf(render: () => Promise<unknown>) {
  const result = await render().then(
    () => null,
    (e: unknown) => {
      if (e instanceof Redirect) return e;
      throw e;
    },
  );
  return result ? result.url : null;
}

const user = { id: "u1", name: "Ada", email: "ada@example.com", image: null };

const noRoles = { coach: null, athlete: null };
const coachRole = { coach: { teamId: "t1" }, athlete: null };
const athleteRole = {
  coach: null,
  athlete: {
    athleteId: "a1",
    athleteName: "Ada",
    teamId: "t2",
    coachName: "Max",
  },
};

describe("server-side session check", () => {
  beforeEach(() => {
    getSession.mockReset();
    getRoles.mockReset();
    getRoles.mockResolvedValue(coachRole);
  });

  it("sends the home page to sign-in when the session cookie is invalid", async () => {
    getSession.mockResolvedValue(null);
    expect(await redirectOf(() => Home())).toBe("/sign-in");
  });

  it("renders the home page for a valid session", async () => {
    getSession.mockResolvedValue({ session: {}, user });
    expect(await redirectOf(() => Home())).toBeNull();
  });

  it("sends a signed-in user from the sign-in page to the return target", async () => {
    getSession.mockResolvedValue({ session: {}, user });
    const searchParams = Promise.resolve({ returnTo: "/invite/abc" });
    expect(await redirectOf(() => SignInPage({ searchParams } as never))).toBe(
      "/invite/abc",
    );
  });

  it("ignores a foreign return target for a signed-in user", async () => {
    getSession.mockResolvedValue({ session: {}, user });
    const searchParams = Promise.resolve({ returnTo: "https://evil.example" });
    expect(await redirectOf(() => SignInPage({ searchParams } as never))).toBe(
      "/",
    );
  });

  it("shows the sign-in page to a signed-out visitor", async () => {
    getSession.mockResolvedValue(null);
    const searchParams = Promise.resolve({});
    expect(
      await redirectOf(() => SignInPage({ searchParams } as never)),
    ).toBeNull();
  });
});

describe("home page by role", () => {
  beforeEach(() => {
    getSession.mockReset();
    getSession.mockResolvedValue({ session: {}, user });
  });

  it("shows the start choice to users without a role", async () => {
    getRoles.mockResolvedValue(noRoles);
    const element = (await Home()) as { type: { name: string } };
    expect(element.type.name).toBe("StartChoice");
  });

  it("shows the athlete list to coaches", async () => {
    getRoles.mockResolvedValue(coachRole);
    const element = (await Home()) as { type: { name: string } };
    expect(element.type.name).toBe("AthleteOverview");
  });

  it("sends users who are only athletes to their athlete view", async () => {
    getRoles.mockResolvedValue(athleteRole);
    expect(await redirectOf(() => Home())).toBe("/training");
  });
});
