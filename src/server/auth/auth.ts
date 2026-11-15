import { betterAuth } from "better-auth";
import { getDb } from "@/server/db";
import { authOptions } from "./options";

function createAuth() {
  const {
    BETTER_AUTH_URL,
    BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  } = process.env;
  return betterAuth(
    authOptions(getDb(), {
      BETTER_AUTH_URL,
      BETTER_AUTH_SECRET,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
    }),
  );
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/**
 * The shared Better Auth instance. Created lazily so that building the app
 * does not need the auth environment variables.
 */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
