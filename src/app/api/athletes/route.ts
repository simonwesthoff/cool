import { createAthlete, listAthletes } from "@/domain/athletes";
import { requireCurrentUser } from "@/domain/auth";
import { apiHandler, readJsonBody } from "@/server/http";

const noStore = { "cache-control": "no-store" };

/** Athletes of the signed-in coach's Team. */
export const GET = apiHandler(async (request: Request) => {
  const coach = await requireCurrentUser(request.headers);
  const athletes = await listAthletes(coach);
  return Response.json({ athletes }, { headers: noStore });
});

/** Adds an athlete to the signed-in coach's Team. */
export const POST = apiHandler(async (request: Request) => {
  const coach = await requireCurrentUser(request.headers);
  const athlete = await createAthlete(coach, await readJsonBody(request));
  return Response.json(athlete, { status: 201, headers: noStore });
});
