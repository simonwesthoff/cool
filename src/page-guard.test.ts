import { describe, expect, it } from "vitest";
import { signInRedirect } from "./page-guard";

const url = (path: string) => new URL(path, "https://localhost:3000");

describe("signInRedirect", () => {
  it("sends a signed-out visitor of a page to the sign-in page", () => {
    expect(signInRedirect(url("/athletes"), false)).toBe(
      "/sign-in?returnTo=%2Fathletes",
    );
  });

  it("keeps the query string of the requested page", () => {
    expect(signInRedirect(url("/invite/abc?code=1"), false)).toBe(
      "/sign-in?returnTo=%2Finvite%2Fabc%3Fcode%3D1",
    );
  });

  it("sends the home page to the sign-in page without a return target", () => {
    expect(signInRedirect(url("/"), false)).toBe("/sign-in");
  });

  it("lets requests with a session cookie through", () => {
    expect(signInRedirect(url("/athletes"), true)).toBeNull();
  });

  it.each([
    "/sign-in",
    "/sign-in?error=access_denied",
    "/api/me",
    "/api/health",
  ])("does not redirect %s", (path) => {
    expect(signInRedirect(url(path), false)).toBeNull();
  });

  it.each(["/favicon.ico", "/robots.txt", "/_next/static/chunk.js"])(
    "does not redirect the static asset %s",
    (path) => {
      expect(signInRedirect(url(path), false)).toBeNull();
    },
  );
});
