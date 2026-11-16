import { requireCurrentUser } from "@/domain/auth";
import {
  removeMesocycleExercise,
  setMesocycleExercise,
} from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context =
  RouteContext<"/api/athletes/[id]/macrocycle/mesocycles/[type]/exercises/[number]">;

/** Planning step 3: choose one exercise for a mesocycle (reason, variation). */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id, type, number } = await context.params;
  return Response.json(
    await setMesocycleExercise(
      coach,
      id,
      type,
      number,
      await readJsonBody(request),
    ),
    { headers: { "cache-control": "no-store" } },
  );
});

/** Planning step 3: remove one exercise from a mesocycle. */
export const DELETE = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id, type, number } = await context.params;
  await removeMesocycleExercise(coach, id, type, number);
  return new Response(null, { status: 204 });
});
