import { requireCurrentUser } from "@/domain/auth";
import { getInvitation } from "@/domain/invitations";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/invitations/[token]">;

/** State of an invitation, with coach and athlete names. */
export const GET = apiHandler(async (request: Request, context: Context) => {
  await requireCurrentUser(request.headers);
  const { token } = await context.params;
  return Response.json(await getInvitation(token), {
    headers: { "cache-control": "no-store" },
  });
});
