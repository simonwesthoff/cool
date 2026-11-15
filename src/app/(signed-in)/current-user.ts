import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, signInUrl, type CurrentUser } from "@/domain/auth";

/**
 * The signed-in user for a page; sends signed-out visitors to the sign-in
 * page, which returns to `returnPath` afterwards.
 */
export async function requirePageUser(
  returnPath: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser(await headers());
  if (!user) redirect(signInUrl(returnPath));
  return user;
}
