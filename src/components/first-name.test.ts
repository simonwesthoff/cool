import { describe, expect, it } from "vitest";
import { firstName } from "./first-name";

describe("firstName", () => {
  it("takes the first word of the name", () => {
    expect(firstName("Anna Weber")).toBe("Anna");
    expect(firstName("Anna")).toBe("Anna");
    expect(firstName("  Max   von Berg ")).toBe("Max");
  });
});
