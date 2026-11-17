import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations:
    async (ns: string) => (key: string, values?: Record<string, string>) =>
      `${ns}.${key}${values ? `:${Object.values(values).join(",")}` : ""}`,
}));

const { PlanningHeader } = await import("./planning-header");

describe("PlanningHeader", () => {
  it("leads back to the macrocycle view once a macrocycle exists", async () => {
    const element = await PlanningHeader({
      athleteId: "a1",
      athleteName: "Anna Weber",
      step: "swot",
      hasMacrocycle: true,
    });
    const [back] = element.props.children;
    expect(back.props).toEqual({
      href: "/athletes/a1/macrocycle",
      label: "Back.macrocycle",
    });
  });

  it("leads back to the athlete before the macrocycle exists", async () => {
    const element = await PlanningHeader({
      athleteId: "a1",
      athleteName: "Anna Weber",
      step: "base-data",
      hasMacrocycle: false,
    });
    const [back] = element.props.children;
    expect(back.props).toEqual({
      href: "/athletes/a1",
      label: "Back.athlete:Anna Weber",
    });
  });
});
