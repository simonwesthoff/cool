import { requireCurrentUser } from "@/domain/auth";
import {
  createMacrocycle,
  getMacrocycle,
  updateBaseData,
} from "@/domain/macrocycles";
import { apiHandler, readJsonBody } from "@/server/http";

type Context = RouteContext<"/api/athletes/[id]/macrocycle">;
const noStore = { "cache-control": "no-store" };

/** The athlete's macrocycle with all calculated weekly values. */
export const GET = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(await getMacrocycle(coach, id), { headers: noStore });
});

/** Planning step 1 for a new macrocycle. */
export const POST = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  const created = await createMacrocycle(
    coach,
    id,
    await readJsonBody(request),
  );
  return Response.json(created, { status: 201, headers: noStore });
});

/** Planning step 1 for an existing macrocycle. */
export const PATCH = apiHandler(async (request: Request, context: Context) => {
  const coach = await requireCurrentUser(request.headers);
  const { id } = await context.params;
  return Response.json(
    await updateBaseData(coach, id, await readJsonBody(request)),
    {
      headers: noStore,
    },
  );
});
