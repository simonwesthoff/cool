import { requireCurrentUser } from "@/domain/auth";
import { getExerciseWeeks } from "@/domain/macrocycles";
import { apiHandler } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/exercises/[number]">;

/**
 * Macrocycle view: one exercise's planned values for every week, for the
 * coach of the athlete's Team and the user linked to the Athlete.
 */
export const GET = apiHandler(async (request: Request, context: Context) => {
  const user = await requireCurrentUser(request.headers);
  const { id, number } = await context.params;
  return Response.json(await getExerciseWeeks(user, id, number), {
    headers: { "cache-control": "no-store" },
  });
});
