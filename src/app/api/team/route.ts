import { requireCurrentUser } from "@/domain/auth";
import { startAsCoach } from "@/domain/roles";
import { apiHandler } from "@/server/http";

/** "Start as Coach": creates the user's Team (201), or returns it (200). */
export const POST = apiHandler(async (request: Request) => {
  const user = await requireCurrentUser(request.headers);
  const { team, created } = await startAsCoach(user);
  return Response.json(team, {
    status: created ? 201 : 200,
    headers: { "cache-control": "no-store" },
  });
});
