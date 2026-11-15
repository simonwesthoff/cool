import { describe, expect, it } from "vitest";
import { safeReturnPath, signInUrl } from "./return-path";

describe("safeReturnPath", () => {
  it.each([
    ["/", "/"],
    ["/athletes", "/athletes"],
    ["/invite/abc?x=1#top", "/invite/abc?x=1#top"],
  ])("accepts the app path %s", (input, expected) => {
    expect(safeReturnPath(input)).toBe(expected);
  });

  it.each([
    [undefined],
    [null],
    [""],
    ["athletes"],
    ["https://evil.example/"],
    ["//evil.example/path"],
    ["/\\evil.example"],
    ["/\tevil"],
    ["javascript:alert(1)"],
    ["/api/me"],
    ["/api"],
    ["/sign-in"],
    ["/sign-in?returnTo=/x"],
  ])("falls back to the home page for %s", (input) => {
    expect(safeReturnPath(input)).toBe("/");
  });
});

describe("signInUrl", () => {
  it("adds the page as return target", () => {
    expect(signInUrl("/invite/abc?x=1")).toBe(
      "/sign-in?returnTo=%2Finvite%2Fabc%3Fx%3D1",
    );
  });

  it("omits the return target for the home page", () => {
    expect(signInUrl("/")).toBe("/sign-in");
  });
});
