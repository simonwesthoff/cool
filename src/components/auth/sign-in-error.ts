export type SignInErrorKind = "cancelled" | "failed";

/**
 * Maps the `error` query parameter that the OAuth flow appends to the
 * sign-in page to the message shown. Error codes are never shown as such.
 */
export function signInErrorKind(
  error: string | null | undefined,
): SignInErrorKind | null {
  if (!error) return null;
  return error === "access_denied" ? "cancelled" : "failed";
}
