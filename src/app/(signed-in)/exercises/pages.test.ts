import { describe, expect, it, vi } from "vitest";

vi.mock("@/domain/exercises", () => ({ getCatalog: async () => [] }));
vi.mock("../current-user", () => ({
  requirePageUser: async () => ({ id: "u1" }),
}));

const { Exercises } = await import("./page");

describe("exercises page", () => {
  it("renders the catalog for every signed-in user", async () => {
    const element = await Exercises();
    expect(element.props.groups).toEqual([]);
  });
});
