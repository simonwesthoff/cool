import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { signInRedirect } from "./page-guard";

/** Sends signed-out visitors to the sign-in page before rendering. */
export function proxy(request: NextRequest) {
  const target = signInRedirect(
    request.nextUrl,
    getSessionCookie(request) !== null,
  );
  return target
    ? NextResponse.redirect(new URL(target, request.url))
    : NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
