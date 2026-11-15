import { requireCurrentUser } from "@/domain/auth";
import { getRoles } from "@/domain/roles";
import { apiHandler } from "@/server/http";

/** Profile and roles of the signed-in user. */
export const GET = apiHandler(async (request: Request) => {
  const user = await requireCurrentUser(request.headers);
  const roles = await getRoles(user);
  return Response.json(
    { ...user, roles },
    { headers: { "cache-control": "no-store" } },
  );
});
