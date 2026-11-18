import { requireCurrentUser } from "@/domain/auth";
import { listWeekPlans } from "@/domain/week-plans";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/weeks/plans">;

/** The planned weeks of the athlete's macrocycle (coach and linked athlete). */
export const GET = apiHandler(async (request: Request, context: Context) => {
  const user = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await listWeekPlans(user, id), {
    headers: { "cache-control": "no-store" },
  });
});
