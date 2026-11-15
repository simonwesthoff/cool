import { describe, expect, it, vi } from "vitest";
import { DomainError } from "@/domain/errors";

const getAthlete = vi.fn();
vi.mock("@/domain/athletes", () => ({ getAthlete }));
vi.mock("../../current-user", () => ({
  requirePageUser: async () => ({
    id: "u1",
    name: "A",
    email: "a@b.c",
    image: null,
  }),
}));
class NotFound extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));

const { EditAthlete } = await import("./page");
const params = Promise.resolve({ id: "x" });

describe("edit athlete page", () => {
  it("shows the not-found page for an athlete of another Team", async () => {
    getAthlete.mockRejectedValue(
      new DomainError("not_found", "ATHLETE_NOT_FOUND"),
    );
    await expect(EditAthlete({ params })).rejects.toBeInstanceOf(NotFound);
  });

  it("passes other errors on", async () => {
    getAthlete.mockRejectedValue(new Error("database down"));
    await expect(EditAthlete({ params })).rejects.toThrow("database down");
  });

  it("renders the form for the coach's athlete", async () => {
    getAthlete.mockResolvedValue({ id: "x", name: "Anna" });
    const element = await EditAthlete({ params });
    expect(element.props.athlete).toEqual({ id: "x", name: "Anna" });
  });
});
