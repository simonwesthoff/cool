import { describe, expect, it } from "vitest";
import { firstName } from "./first-name";

describe("firstName", () => {
  it.each([
    ["Ada Lovelace", "Ada"],
    ["Anna-Lena Weber", "Anna-Lena"],
    ["  Max   von Berg ", "Max"],
    ["Cher", "Cher"],
  ])("%s -> %s", (name, expected) => {
    expect(firstName(name)).toBe(expected);
  });
});
