/** Public base URL of the app, e.g. https://localhost:3000 (no trailing slash). */
export function appUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) throw new Error("BETTER_AUTH_URL is not set");
  return url.replace(/\/+$/, "");
}
