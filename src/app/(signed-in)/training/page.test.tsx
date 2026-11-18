import { describe, expect, it, vi } from "vitest";

const requirePageRoles = vi.fn();
const loadMacrocycleChart = vi.fn();
const loadTrainingWeeks = vi.fn(async () => ({
  current: null,
  next: { weekNumber: 1, planned: false },
  planned: [],
}));
vi.mock("../macrocycle-view/load", () => ({
  loadMacrocycleChart,
  loadTrainingWeeks,
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
      // No week planning entry points for an athlete who may not plan.
      trainingWeeks: null,
    });
    expect(loadTrainingWeeks).not.toHaveBeenCalled();
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
    expect(element.props.trainingWeeks).toEqual({
      current: null,
      next: { weekNumber: 1, planned: false },
      planned: [],
    });
    expect(isCoachOfAthlete).toHaveBeenCalledWith(user, "a1");
  });
});
