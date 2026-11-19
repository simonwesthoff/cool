import { requireCurrentUser } from "@/domain/auth";
import { setCurve } from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/curve">;

/** Planning step 3, curve mode: entry value and inner anchors. */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await setCurve(coach, id, await readJsonBody(request)), {
    headers: { "cache-control": "no-store" },
  });
});
