import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, signInUrl, type CurrentUser } from "@/domain/auth";
import { getRoles, type Roles } from "@/domain/roles";

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

/** The signed-in user with their roles (see `requirePageUser`). */
export async function requirePageRoles(
  returnPath: string,
): Promise<{ user: CurrentUser; roles: Roles }> {
  const user = await requirePageUser(returnPath);
  return { user, roles: await getRoles(user) };
}

/** Like `requirePageRoles`, but sends users who lead no Team to `/`. */
export async function requireCoachPage(
  returnPath: string,
): Promise<{ user: CurrentUser; roles: Roles }> {
  const result = await requirePageRoles(returnPath);
  if (!result.roles.coach) redirect("/");
  return result;
}
