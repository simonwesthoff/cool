import { SIGN_IN_PATH, signInUrl } from "@/domain/auth/return-path";

/** Paths that are handled without a session check by the proxy. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname.startsWith(`${SIGN_IN_PATH}/`) ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    // Static files such as /favicon.ico or /robots.txt.
    /\/[^/]+\.[a-z0-9]+$/i.test(pathname)
  );
}

/**
 * Where to send a request before rendering, or null to continue. This is an
 * optimistic check on the presence of the session cookie only; pages verify
 * the session itself.
 */
export function signInRedirect(
  url: URL,
  hasSessionCookie: boolean,
): string | null {
  if (hasSessionCookie || isPublicPath(url.pathname)) return null;
  return signInUrl(`${url.pathname}${url.search}`);
}
