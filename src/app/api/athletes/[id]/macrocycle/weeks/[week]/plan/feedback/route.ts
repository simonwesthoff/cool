import { requireCurrentUser } from "@/domain/auth";
import { setFeedback } from "@/domain/week-plans";
import { apiHandler, readJsonBody } from "@/server/http";

type Context =
  RouteContext<"/api/athletes/[id]/macrocycle/weeks/[week]/plan/feedback">;

/** The athlete's feedback on one exercise of a session (linked user only). */
export const PUT = apiHandler(async (request: Request, context: Context) => {
  const user = await requireCurrentUser(request.headers);
  const { id, week } = await context.params;
  return Response.json(
    await setFeedback(user, id, week, await readJsonBody(request)),
    { headers: { "cache-control": "no-store" } },
  );
});
