import { requireCurrentUser } from "@/domain/auth";
import { acceptInvitation } from "@/domain/invitations";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/invitations/[token]/accept">;

/** Accepts an invitation: links the signed-in user to the invited athlete. */
export const POST = apiHandler(async (request: Request, context: Context) => {
  const user = await requireCurrentUser(request.headers);
  const { token } = await context.params;
  return Response.json(await acceptInvitation(user, token), {
    headers: { "cache-control": "no-store" },
  });
});
