import { describe, expect, it, vi } from "vitest";

const requirePageRoles = vi.fn();
const findMacrocycle = vi.fn();
vi.mock("@/domain/macrocycles", () => ({ findMacrocycle }));
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
    findMacrocycle.mockResolvedValue(null);
    const element = await Training();
    expect(element.props).toEqual({
      viewer: "athlete",
      athleteId: "a1",
      name: "Anna Weber",
      image: null,
      coachName: "Max Berg",
      macrocycle: null,
    });
  });

  it("passes the own macrocycle when one is planned", async () => {
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
    findMacrocycle.mockResolvedValue({ athleteId: "a1" });
    const element = await Training();
    expect(element.props.macrocycle).toEqual({ athleteId: "a1" });
    expect(findMacrocycle).toHaveBeenCalledWith(user, "a1");
  });
});
