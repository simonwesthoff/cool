import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth";

/** Better Auth endpoints: sign-in, OAuth callback, sign-out, session. */
export const { GET, POST } = toNextJsHandler((request) =>
  getAuth().handler(request),
);
