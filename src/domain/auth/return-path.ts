export const SIGN_IN_PATH = "/sign-in";
export const HOME_PATH = "/";

/**
 * Returns `value` if it is a page of this app to return to after signing in,
 * otherwise the home page. Only same-origin relative paths are accepted, so
 * a crafted link cannot send the user to another site.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return HOME_PATH;
  // "//host" and "/\host" are treated as other origins by browsers.
  if (value.startsWith("//") || value.startsWith("/\\")) return HOME_PATH;
  // Control characters (e.g. tabs or newlines) can hide a different target.
  if (/[\u0000-\u001f\u007f]/.test(value)) return HOME_PATH;

  let url: URL;
  try {
    url = new URL(value, "https://app.invalid");
  } catch {
    return HOME_PATH;
  }
  if (url.origin !== "https://app.invalid") return HOME_PATH;
  const path = url.pathname;
  if (path === "/api" || path.startsWith("/api/")) return HOME_PATH;
  if (path === SIGN_IN_PATH || path.startsWith(`${SIGN_IN_PATH}/`)) {
    return HOME_PATH;
  }
  return `${path}${url.search}${url.hash}`;
}

/** URL of the sign-in page that returns to `path` afterwards. */
export function signInUrl(path: string): string {
  const target = safeReturnPath(path);
  return target === HOME_PATH
    ? SIGN_IN_PATH
    : `${SIGN_IN_PATH}?returnTo=${encodeURIComponent(target)}`;
}
