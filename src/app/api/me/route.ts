import { requireCurrentUser } from "@/domain/auth";
import { apiHandler } from "@/server/http";

/** Profile of the signed-in user. */
export const GET = apiHandler(async (request: Request) => {
  const user = await requireCurrentUser(request.headers);
  return Response.json(user, { headers: { "cache-control": "no-store" } });
});
