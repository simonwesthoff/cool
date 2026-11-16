import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
const findMacrocycle = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
vi.mock("@/domain/macrocycles", () => ({ findMacrocycle }));
vi.mock("../../../current-user", () => ({
  requireCoachPage: async () => ({ user: { id: "u1" }, roles: {} }),
}));
class NotFound extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));

const { loadPlanning, nextMonday } = await import("./shared");

describe("nextMonday", () => {
  it.each([
    ["2026-11-16", "2026-11-16"],
    ["2026-11-17", "2026-11-23"],
    ["2026-11-22", "2026-11-23"],
    ["2026-12-31", "2027-01-04"],
  ])("%s -> %s", (from, expected) => {
    expect(nextMonday(from)).toBe(expected);
  });
});

describe("loadPlanning", () => {
  it("loads athlete and macrocycle of the coach", async () => {
    getAthlete.mockResolvedValue({ id: "a1", name: "Anna" });
    findMacrocycle.mockResolvedValue(null);
    await expect(loadPlanning("a1", "/x")).resolves.toMatchObject({
      athlete: { name: "Anna" },
      macrocycle: null,
    });
  });

  it("shows not found for another Team's athlete", async () => {
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(loadPlanning("a1", "/x")).rejects.toBeInstanceOf(NotFound);
  });
});
