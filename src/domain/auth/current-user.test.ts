import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getSession = vi.fn();
vi.mock("@/server/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));

const { getCurrentUser, requireCurrentUser } = await import("./current-user");

const user = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  image: "https://lh3.googleusercontent.com/a/ada",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getCurrentUser", () => {
  beforeEach(() => getSession.mockReset());

  it("returns the user of a valid session", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user });
    const headers = new Headers({
      cookie: "__Secure-better-auth.session_token=t",
    });
    await expect(getCurrentUser(headers)).resolves.toEqual({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: "https://lh3.googleusercontent.com/a/ada",
    });
    expect(getSession).toHaveBeenCalledWith({ headers });
  });

  it("returns null without a session", async () => {
    getSession.mockResolvedValue(null);
    await expect(getCurrentUser(new Headers())).resolves.toBeNull();
  });

  it("returns null for an expired session (Better Auth reports none)", async () => {
    getSession.mockResolvedValue(null);
    const headers = new Headers({
      cookie: "__Secure-better-auth.session_token=old",
    });
    await expect(getCurrentUser(headers)).resolves.toBeNull();
  });

  it("returns null as image when Google has no picture", async () => {
    getSession.mockResolvedValue({
      session: {},
      user: { ...user, image: undefined },
    });
    await expect(getCurrentUser(new Headers())).resolves.toMatchObject({
      image: null,
    });
  });
});

describe("requireCurrentUser", () => {
  beforeEach(() => getSession.mockReset());

  it("throws UNAUTHENTICATED without a session", async () => {
    getSession.mockResolvedValue(null);
    const error = await requireCurrentUser(new Headers()).catch((e) => e);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({
      kind: "unauthenticated",
      code: "UNAUTHENTICATED",
    });
  });

  it("returns the user with a session", async () => {
    getSession.mockResolvedValue({ session: {}, user });
    await expect(requireCurrentUser(new Headers())).resolves.toMatchObject({
      id: "u1",
    });
  });
});
