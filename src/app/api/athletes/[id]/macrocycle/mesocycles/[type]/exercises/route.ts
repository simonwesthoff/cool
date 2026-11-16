import { requireCurrentUser } from "@/domain/auth";
import { setMesocycleExercises } from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context =
  RouteContext<"/api/athletes/[id]/macrocycle/mesocycles/[type]/exercises">;

/** Planning step 3: the exercises of one mesocycle. */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id, type } = await context.params;
  return Response.json(
    await setMesocycleExercises(coach, id, type, await readJsonBody(request)),
    { headers: { "cache-control": "no-store" } },
  );
});
