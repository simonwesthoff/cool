import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
const loadMacrocycleView = vi.fn();
vi.mock("../../../macrocycle-view/load", () => ({ loadMacrocycleView }));
const requireCoachPage = vi.fn();
vi.mock("../../../current-user", () => ({ requireCoachPage }));
vi.mock("next-intl/server", () => ({
  getTranslations:
    async (ns: string) => (key: string, values?: Record<string, string>) =>
      `${ns}.${key}${values ? `:${Object.values(values).join(",")}` : ""}`,
}));
class NotFound extends Error {}
class Redirect extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));

const { CoachMacrocycleView } = await import("./page");
const params = Promise.resolve({ id: "a1" });
const coach = {
  user: { id: "u1", name: "Max", email: "m@x.invalid", image: null },
  roles: { coach: { teamId: "t1" }, athlete: null },
};
const view = {
  macrocycle: { athleteId: "a1" },
  initialValues: { exerciseNumber: 1, weeks: [] },
  exercises: [],
  today: "2027-01-06",
};

describe("coach macrocycle view page", () => {
  it("shows the view with Change planning and the way back", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna Weber" });
    loadMacrocycleView.mockResolvedValue(view);
    const element = await CoachMacrocycleView({ params });
    const [back, heading, viewElement] = element.props.children;
    expect(back.props).toEqual({
      href: "/athletes/a1",
      label: "Back.athlete:Anna Weber",
    });
    expect(heading.props.children[0].props.children).toBe("Anna Weber");
    expect(viewElement.props).toMatchObject({
      ...view,
      editHref: "/athletes/a1/macrocycle/base-data",
    });
    expect(loadMacrocycleView).toHaveBeenCalledWith(coach.user, "a1");
    expect(requireCoachPage).toHaveBeenCalledWith("/athletes/a1/macrocycle");
  });

  it("sends the coach to step 1 without a macrocycle", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna Weber" });
    loadMacrocycleView.mockResolvedValue(null);
    await expect(CoachMacrocycleView({ params })).rejects.toMatchObject({
      url: "/athletes/a1/macrocycle/base-data",
    });
  });

  it("shows not found for an athlete of another Team", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(CoachMacrocycleView({ params })).rejects.toBeInstanceOf(
      NotFound,
    );
  });

  it("sends users without a Team to the home page", async () => {
    requireCoachPage.mockRejectedValue(new Redirect("/"));
    await expect(CoachMacrocycleView({ params })).rejects.toMatchObject({
      url: "/",
    });
  });
});
