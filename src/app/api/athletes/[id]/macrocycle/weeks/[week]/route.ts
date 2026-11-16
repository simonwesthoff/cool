import { requireCurrentUser } from "@/domain/auth";
import { setWeekLevel } from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/weeks/[week]">;

/** Planning step 2: the level (high, medium, low) of one week. */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id, week } = await context.params;
  const number = /^\d{1,2}$/.test(week) ? Number(week) : Number.NaN;
  return Response.json(
    await setWeekLevel(coach, id, number, await readJsonBody(request)),
    {
      headers: { "cache-control": "no-store" },
    },
  );
});
