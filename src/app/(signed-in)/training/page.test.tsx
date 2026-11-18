import { describe, expect, it, vi } from "vitest";

const requirePageRoles = vi.fn();
const loadMacrocycleChart = vi.fn();
const currentWeek = {
  current: { state: "before", startDate: "2026-11-30" },
  names: {},
  canGiveFeedback: true,
};
const loadCurrentWeek = vi.fn(async () => currentWeek);
vi.mock("../macrocycle-view/load", () => ({
  loadMacrocycleChart,
  loadCurrentWeek,
}));
vi.mock("../current-user", () => ({ requirePageRoles }));
const isCoachOfAthlete = vi.fn(async () => false);
vi.mock("@/domain/athletes", () => ({ isCoachOfAthlete }));
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
    loadMacrocycleChart.mockResolvedValue(null);
    const element = await Training();
    expect(element.props).toEqual({
      viewer: "athlete",
      athleteId: "a1",
      name: "Anna Weber",
      image: null,
      coachName: "Max Berg",
      canEdit: false,
      macrocycle: null,
      // The athlete sees the current week too.
      currentWeek,
    });
    expect(loadCurrentWeek).toHaveBeenCalledWith(user, "a1");
  });

  it("passes the own macrocycle chart data when one is planned", async () => {
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
    loadMacrocycleChart.mockResolvedValue({ athleteId: "a1" });
    const element = await Training();
    expect(element.props.macrocycle).toEqual({ athleteId: "a1" });
    expect(loadMacrocycleChart).toHaveBeenCalledWith(user, "a1");
  });

  it("lets a coach who trains themselves edit on My training", async () => {
    requirePageRoles.mockResolvedValue({
      user,
      roles: {
        coach: { teamId: "t1" },
        athlete: {
          athleteId: "a1",
          athleteName: "Anna Weber",
          teamId: "t1",
          coachName: "Anna Weber",
        },
      },
    });
    loadMacrocycleChart.mockResolvedValue(null);
    isCoachOfAthlete.mockResolvedValueOnce(true);
    const element = await Training();
    expect(element.props.canEdit).toBe(true);
    expect(element.props.currentWeek).toEqual(currentWeek);
    expect(isCoachOfAthlete).toHaveBeenCalledWith(user, "a1");
  });
});
