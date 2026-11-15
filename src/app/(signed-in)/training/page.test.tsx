import { describe, expect, it, vi } from "vitest";

const requirePageRoles = vi.fn();
vi.mock("../current-user", () => ({ requirePageRoles }));
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
vi.mock("next-intl/server", () => ({
  getTranslations:
    async () => (key: string, values?: Record<string, string>) =>
      values ? `${key}:${Object.values(values).join(",")}` : key,
}));

const { Training } = await import("./page");
const user = { id: "u1", name: "Anna", email: "a@b.c", image: null };

describe("athlete view", () => {
  it("sends users without the athlete role to the home page", async () => {
    requirePageRoles.mockResolvedValue({
      user,
      roles: { coach: null, athlete: null },
    });
    await expect(Training()).rejects.toMatchObject({ url: "/" });
  });

  it("shows the athlete's name and coach", async () => {
    requirePageRoles.mockResolvedValue({
      user,
      roles: {
        coach: null,
        athlete: {
          athleteId: "a1",
          athleteName: "Anna Weber",
          teamId: "t1",
          coachName: "Max Berg",
        },
      },
    });
    const element = await Training();
    const text = JSON.stringify(element);
    expect(text).toContain("Anna Weber");
    expect(text).toContain("coach:Max Berg");
  });
});
