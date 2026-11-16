import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
const findMacrocycle = vi.fn();
vi.mock("@/domain/macrocycles", () => ({ findMacrocycle }));
const requireCoachPage = vi.fn();
vi.mock("../../current-user", () => ({ requireCoachPage }));
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

const { AthleteDetails } = await import("./page");
const params = Promise.resolve({ id: "a1" });
const coach = {
  user: { id: "u1", name: "Max", email: "m@x.invalid", image: null },
  roles: { coach: { teamId: "t1" }, athlete: null },
};

describe("athlete details page", () => {
  it("renders the header for the coach's athlete", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockResolvedValue({
      id: "a1",
      name: "Anna Weber",
      linkedAccount: null,
    });
    findMacrocycle.mockResolvedValue(null);
    const element = await AthleteDetails({ params });
    const [header, section] = element.props.children;
    expect(header.props.athlete).toMatchObject({ name: "Anna Weber" });
    expect(section.props).toEqual({ athleteId: "a1", macrocycle: null });
    expect(getAthlete).toHaveBeenCalledWith(coach.user, "a1");
    expect(findMacrocycle).toHaveBeenCalledWith(coach.user, "a1");
  });

  it("shows not found for an athlete of another Team", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(AthleteDetails({ params })).rejects.toBeInstanceOf(NotFound);
  });

  it("sends users without a Team to the home page", async () => {
    requireCoachPage.mockRejectedValue(new Redirect("/"));
    await expect(AthleteDetails({ params })).rejects.toMatchObject({
      url: "/",
    });
  });
});
