import { connection } from "next/server";
import { checkHealth } from "@/domain/health";
import { apiHandler } from "@/server/http";

/** Health check for Docker Compose and monitoring. Unauthenticated. */
export const GET = apiHandler(async () => {
  // Always evaluate at request time, never at build time.
  await connection();
  const report = await checkHealth();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
});
