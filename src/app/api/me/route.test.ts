import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
vi.mock("@/server/auth", () => ({
  getAuth: () => ({ api: { getSession } }),
}));

const { GET } = await import("./route");

describe("GET /api/me", () => {
  beforeEach(() => getSession.mockReset());

  it("returns the signed-in user's profile", async () => {
    getSession.mockResolvedValue({
      session: {},
      user: {
        id: "u1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        image: "https://lh3.googleusercontent.com/a/ada",
      },
    });
    const response = await GET(new Request("https://localhost/api/me"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      image: "https://lh3.googleusercontent.com/a/ada",
    });
  });

  it("returns 401 UNAUTHENTICATED without a session", async () => {
    getSession.mockResolvedValue(null);
    const response = await GET(new Request("https://localhost/api/me"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
