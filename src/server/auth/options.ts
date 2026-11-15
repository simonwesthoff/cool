import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "@/server/db";
import * as schema from "@/server/db/schema";

const DAY_SECONDS = 60 * 60 * 24;

/** Session stays valid for 30 days after the last use (spec: Session lifetime). */
export const SESSION_EXPIRES_IN_SECONDS = 30 * DAY_SECONDS;
/** Each use at most once a day pushes the expiry 30 days ahead. */
export const SESSION_UPDATE_AGE_SECONDS = DAY_SECONDS;

export type AuthEnv = {
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

function required(env: AuthEnv, name: keyof AuthEnv): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** Better Auth configuration: Google sign-in only, database sessions. */
export function authOptions(db: Database, env: AuthEnv) {
  return {
    baseURL: required(env, "BETTER_AUTH_URL"),
    secret: required(env, "BETTER_AUTH_SECRET"),
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: required(env, "GOOGLE_CLIENT_ID"),
        clientSecret: required(env, "GOOGLE_CLIENT_SECRET"),
        // Name and picture follow the Google profile on every sign-in.
        overrideUserInfoOnSignIn: true,
        // Only Google accounts with a verified email address get a session.
        requireEmailVerification: true,
        prompt: "select_account",
      },
    },
    user: { modelName: "userAccount" },
    account: {
      modelName: "oauthAccount",
      encryptOAuthTokens: true,
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    advanced: {
      // The app only runs over HTTPS, also locally.
      useSecureCookies: true,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
    },
    rateLimit: { enabled: true, storage: "memory" },
    telemetry: { enabled: false },
  } satisfies BetterAuthOptions;
}
