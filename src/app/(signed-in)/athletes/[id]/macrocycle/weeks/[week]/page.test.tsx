import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
const initialWeekContent = vi.fn();
const getWeekProjections = vi.fn();
vi.mock("@/domain/week-plans", () => ({
  initialWeekContent,
  getWeekProjections,
}));
vi.mock("@/domain/exercises", () => ({
  getCatalog: async () => [
    {
      number: 1,
      code: "K1",
      name: { de: "Wettkampfübungen", en: "Competition exercises" },
      exercises: [
        { number: 1, name: { de: "Reißen", en: "Snatch" }, extra: 1 },
      ],
    },
  ],
}));
const requireCoachPage = vi.fn();
vi.mock("../../../../../current-user", () => ({ requireCoachPage }));
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

const { WeekPlanEditor } = await import("./page");
const coach = {
  user: { id: "u1", name: "Max", email: "m@x.invalid", image: null },
  roles: { coach: { teamId: "t1" }, athlete: null },
};
const plan = {
  weekNumber: 12,
  durationWeeks: 21,
  startDate: "2027-02-15",
  mesocycle: "special_preparation",
  level: "medium",
  planned: false,
  sessions: [],
  check: { chosen: [1, 13], missing: [1, 13], notPlanned: [] },
};
const props = (prefill?: string) => ({
  params: Promise.resolve({ id: "a1", week: "12" }),
  searchParams: Promise.resolve(prefill ? { prefill } : {}),
});

describe("week editor page", () => {
  it("loads the week with prefill from the previous week when asked", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna Weber" });
    initialWeekContent.mockResolvedValue({
      plan,
      sessions: [{ weekday: 1, slot: 1, exercises: [] }],
      source: "previous",
    });
    getWeekProjections.mockResolvedValue({ 1: { bestKg: 80 } });
    const element = await WeekPlanEditor(props("previous") as never);
    const [back, editor] = element.props.children;
    expect(back.props).toEqual({
      href: "/athletes/a1",
      label: "Back.athlete:Anna Weber",
    });
    expect(editor.props).toMatchObject({
      athleteId: "a1",
      plan: {
        weekNumber: 12,
        durationWeeks: 21,
        startDate: "2027-02-15",
        mesocycle: "special_preparation",
        level: "medium",
        chosen: [1, 13],
      },
      initialSessions: [{ weekday: 1, slot: 1, exercises: [] }],
      projections: { 1: { bestKg: 80 } },
      catalog: [
        {
          code: "K1",
          name: { de: "Wettkampfübungen", en: "Competition exercises" },
          exercises: [{ number: 1, name: { de: "Reißen", en: "Snatch" } }],
        },
      ],
    });
    expect(initialWeekContent).toHaveBeenCalledWith(
      coach.user,
      "a1",
      "12",
      true,
    );
    expect(requireCoachPage).toHaveBeenCalledWith(
      "/athletes/a1/macrocycle/weeks/12",
    );
  });

  it("does not prefill without the parameter", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna Weber" });
    initialWeekContent.mockResolvedValue({
      plan,
      sessions: [],
      source: "schedule",
    });
    getWeekProjections.mockResolvedValue({});
    await WeekPlanEditor(props() as never);
    expect(initialWeekContent).toHaveBeenLastCalledWith(
      coach.user,
      "a1",
      "12",
      false,
    );
  });

  it("shows not found for other Teams' athletes and weeks outside the macrocycle", async () => {
    requireCoachPage.mockResolvedValue(coach);
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(WeekPlanEditor(props() as never)).rejects.toBeInstanceOf(
      NotFound,
    );
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna Weber" });
    initialWeekContent.mockRejectedValue(
      new DomainError("not_found", "WEEK_NOT_FOUND"),
    );
    getWeekProjections.mockRejectedValue(
      new DomainError("not_found", "WEEK_NOT_FOUND"),
    );
    await expect(WeekPlanEditor(props() as never)).rejects.toBeInstanceOf(
      NotFound,
    );
  });

  it("sends users without a Team (e.g. the linked athlete) to the home page", async () => {
    requireCoachPage.mockRejectedValue(new Redirect("/"));
    await expect(WeekPlanEditor(props() as never)).rejects.toMatchObject({
      url: "/",
    });
  });
});
