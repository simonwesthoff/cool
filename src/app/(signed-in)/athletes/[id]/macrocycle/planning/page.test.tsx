import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
const findMacrocycle = vi.fn();
vi.mock("@/domain/macrocycles", () => ({ findMacrocycle }));
const getCatalog = vi.fn(async () => [{ group: "K1", exercises: [] }]);
vi.mock("@/domain/exercises", () => ({ getCatalog }));
const requireCoachPage = vi.fn();
vi.mock("../../../../current-user", () => ({ requireCoachPage }));
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

const { Planning } = await import("./page");
const params = Promise.resolve({ id: "a1" });
const coach = {
  user: { id: "u1", name: "Max", email: "m@x.invalid", image: null },
  roles: { coach: { teamId: "t1" }, athlete: null },
};
const macrocycle = { athleteId: "a1", weeks: [], mesocycles: [] };
const open = (step?: string) =>
  Planning({
    params,
    searchParams: Promise.resolve(step === undefined ? {} : { step }),
  });

beforeEach(() => {
  requireCoachPage.mockReset().mockResolvedValue(coach);
  getAthlete.mockReset().mockResolvedValue({ id: "a1", name: "Anna Weber" });
  findMacrocycle.mockReset().mockResolvedValue(macrocycle);
});

describe("macrocycle planning page", () => {
  it("loads the athlete, the macrocycle and the catalog once and opens the asked step", async () => {
    const element = await open("intensity");
    expect(element.props).toMatchObject({
      athleteId: "a1",
      athleteName: "Anna Weber",
      initialStep: "intensity",
      initialMacrocycle: macrocycle,
      catalog: [{ group: "K1", exercises: [] }],
    });
    expect(element.props.defaultStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getCatalog).toHaveBeenCalledTimes(1);
    // After signing in, the coach comes back to the same step.
    expect(requireCoachPage).toHaveBeenCalledWith(
      "/athletes/a1/macrocycle/planning?step=intensity",
    );
  });

  it("opens step 1 by default and for an unknown step", async () => {
    expect((await open()).props.initialStep).toBe("base-data");
    expect((await open("results")).props.initialStep).toBe("base-data");
  });

  it("opens only step 1 without a macrocycle", async () => {
    findMacrocycle.mockResolvedValue(null);
    const element = await open("exercises");
    expect(element.props.initialStep).toBe("base-data");
    expect(element.props.initialMacrocycle).toBeNull();
  });

  it("shows not found for an athlete of another Team", async () => {
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(open("swot")).rejects.toBeInstanceOf(NotFound);
  });

  it("sends users without a Team to the home page", async () => {
    requireCoachPage.mockRejectedValue(new Redirect("/"));
    await expect(open()).rejects.toMatchObject({ url: "/" });
  });
});
