import { requireCurrentUser } from "@/domain/auth";
import { setSwot } from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/swot">;

/** Planning step 2: the SWOT (all fields, replaced as a whole). */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await setSwot(coach, id, await readJsonBody(request)), {
    headers: { "cache-control": "no-store" },
  });
});
