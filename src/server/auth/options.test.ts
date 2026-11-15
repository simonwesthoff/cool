import { describe, expect, it } from "vitest";
import type { Database } from "@/server/db";
import { authOptions } from "./options";

const env = {
  BETTER_AUTH_URL: "https://localhost:3000",
  BETTER_AUTH_SECRET: "x".repeat(32),
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
};

const options = authOptions({} as Database, env);

describe("auth options", () => {
  it("offers Google as the only sign-in method", () => {
    expect(Object.keys(options.socialProviders)).toEqual(["google"]);
    expect(options.emailAndPassword.enabled).toBe(false);
  });

  it("updates name and picture from Google and requires a verified email", () => {
    expect(options.socialProviders.google.overrideUserInfoOnSignIn).toBe(true);
    expect(options.socialProviders.google.requireEmailVerification).toBe(true);
  });

  it("keeps sessions for 30 days after the last use", () => {
    expect(options.session.expiresIn).toBe(30 * 24 * 60 * 60);
    expect(options.session.updateAge).toBe(24 * 60 * 60);
  });

  it("uses HttpOnly, Secure, SameSite=Lax cookies", () => {
    expect(options.advanced.useSecureCookies).toBe(true);
    expect(options.advanced.defaultCookieAttributes).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  });

  it("uses the project's table names", () => {
    expect(options.user.modelName).toBe("userAccount");
    expect(options.account.modelName).toBe("oauthAccount");
  });

  it("fails fast when a variable is missing", () => {
    expect(() =>
      authOptions({} as Database, { ...env, GOOGLE_CLIENT_SECRET: "" }),
    ).toThrow("GOOGLE_CLIENT_SECRET is not set");
  });
});
