import { requireCurrentUser } from "@/domain/auth";
import { createInvitation, invitationPath } from "@/domain/invitations";
import { appUrl } from "@/server/config";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/invitations">;

/** Creates an invitation link for an unlinked athlete of the coach's Team. */
export const POST = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  const { token, expiresAt } = await createInvitation(coach, id);
  return Response.json(
    { url: `${appUrl()}${invitationPath(token)}`, expiresAt },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
});
