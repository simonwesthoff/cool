import { DomainError } from "@/domain/errors";
import { getAuth } from "@/server/auth";

/** The signed-in user, as far as the app needs to know. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

/**
 * Returns the user of the session sent with the request, or null when there
 * is no valid (existing, unexpired) session.
 */
export async function getCurrentUser(
  headers: Headers,
): Promise<CurrentUser | null> {
  const result = await getAuth().api.getSession({ headers });
  if (!result) return null;
  const { id, name, email, image } = result.user;
  return { id, name, email, image: image ?? null };
}

/** Like `getCurrentUser`, but throws `UNAUTHENTICATED` without a session. */
export async function requireCurrentUser(
  headers: Headers,
): Promise<CurrentUser> {
  const user = await getCurrentUser(headers);
  if (!user) throw new DomainError("unauthenticated", "UNAUTHENTICATED");
  return user;
}
