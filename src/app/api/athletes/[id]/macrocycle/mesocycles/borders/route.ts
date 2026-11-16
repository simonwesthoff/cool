import { requireCurrentUser } from "@/domain/auth";
import { setMesocycleBorders } from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle/mesocycles/borders">;

/** Planning step 2: borders between the mesocycles. */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(
    await setMesocycleBorders(coach, id, await readJsonBody(request)),
    {
      headers: { "cache-control": "no-store" },
    },
  );
});
