import { getAthlete, updateAthlete } from "@/domain/athletes";
import { requireCurrentUser } from "@/domain/auth";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]">;
const noStore = { "cache-control": "no-store" };

/** One athlete of the signed-in coach's Team. */
export const GET = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await getAthlete(coach, id), { headers: noStore });
});

/** Changes basic data of an athlete of the signed-in coach's Team. */
export const PATCH = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  const athlete = await updateAthlete(coach, id, await readJsonBody(request));
  return Response.json(athlete, { headers: noStore });
});
