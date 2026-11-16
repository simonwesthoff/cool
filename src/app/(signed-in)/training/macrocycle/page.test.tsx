import { describe, expect, it, vi } from "vitest";

const loadMacrocycleView = vi.fn();
vi.mock("../../macrocycle-view/load", () => ({ loadMacrocycleView }));
const requirePageRoles = vi.fn();
vi.mock("../../current-user", () => ({ requirePageRoles }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
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

const { AthleteMacrocycle } = await import("./page");
const user = { id: "u2", name: "Anna", email: "a@x.invalid", image: null };
const athlete = {
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
};
const view = {
  macrocycle: { athleteId: "a1" },
  initialValues: { exerciseNumber: 1, weeks: [] },
  exercises: [],
  today: "2027-01-06",
};

describe("athlete macrocycle page", () => {
  it("shows the own macrocycle read-only, without Change planning", async () => {
    requirePageRoles.mockResolvedValue(athlete);
    loadMacrocycleView.mockResolvedValue(view);
    const element = await AthleteMacrocycle();
    const [, viewElement] = element.props.children;
    expect(viewElement.props).toEqual({
      ...view,
      back: { href: "/training", label: "backTraining" },
    });
    expect(viewElement.props.editHref).toBeUndefined();
    expect(loadMacrocycleView).toHaveBeenCalledWith(user, "a1");
  });

  it("says that no macrocycle is planned yet", async () => {
    requirePageRoles.mockResolvedValue(athlete);
    loadMacrocycleView.mockResolvedValue(null);
    const element = await AthleteMacrocycle();
    const [, message] = element.props.children;
    expect(message.props.children).toBe("notPlanned");
  });

  it("sends users without the athlete role to the home page", async () => {
    requirePageRoles.mockResolvedValue({
      user,
      roles: { coach: { teamId: "t1" }, athlete: null },
    });
    await expect(AthleteMacrocycle()).rejects.toMatchObject({ url: "/" });
  });
});
