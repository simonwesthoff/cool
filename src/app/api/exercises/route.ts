import { requireCurrentUser } from "@/domain/auth";
import { getCatalog } from "@/domain/exercises";
import { apiHandler } from "@/server/http";

/** The exercise catalog with German and English texts. */
export const GET = apiHandler(async (request: Request) => {
  await requireCurrentUser(request.headers);
  const groups = await getCatalog();
  return Response.json(
    { groups },
    { headers: { "cache-control": "private, max-age=3600" } },
  );
});
