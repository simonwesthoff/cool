import { requireCurrentUser } from "@/domain/auth";
import { getWeekPlan, saveWeekPlan } from "@/domain/week-plans";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/weeks/[week]/plan">;
const noStore = { headers: { "cache-control": "no-store" } };

/** The week's plan with the mesocycle check (coach and linked athlete). */
export const GET = apiHandler(async (request: Request, context: Context) => {
  const user = await requireCurrentUser(request.headers);
  const { id, week } = await context.params;
  return Response.json(await getWeekPlan(user, id, week), noStore);
});

/** Saves the whole week (coach only); no sessions makes it unplanned. */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id, week } = await context.params;
  return Response.json(
    await saveWeekPlan(coach, id, week, await readJsonBody(request)),
    noStore,
  );
});
