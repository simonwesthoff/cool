import { requireCurrentUser } from "@/domain/auth";
import { linkSelf } from "@/domain/invitations";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/link-self">;

/** "This is me": links the coach to an athlete of their own Team. */
export const POST = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await linkSelf(coach, id), {
    headers: { "cache-control": "no-store" },
  });
});
