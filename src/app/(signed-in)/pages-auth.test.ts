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
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const { Home } = await import("./page");
const { SignIn: SignInPage } = await import("../sign-in/page");

async function redirectOf(render: () => Promise<unknown>) {
  const error = await render().catch((e: unknown) => e);
  return error instanceof Redirect ? error.url : null;
}

const user = { id: "u1", name: "Ada", email: "ada@example.com", image: null };

describe("server-side session check", () => {
  beforeEach(() => getSession.mockReset());

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
