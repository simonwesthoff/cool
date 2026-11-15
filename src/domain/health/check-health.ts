import { getSql } from "@/server/db";

export type ComponentStatus = "ok" | "unavailable";

export type HealthReport = {
  status: ComponentStatus;
  database: ComponentStatus;
};

/** Maximum time the database may take to answer a health check. */
export const HEALTH_CHECK_TIMEOUT_MS = 2000;

export async function pingDatabase(): Promise<void> {
  await getSql()`select 1`;
}

function withTimeout(promise: Promise<void>, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Reports whether the app and its database are available. Never throws: an
 * unreachable or slow database is reported as `unavailable`.
 */
export async function checkHealth(
  ping: () => Promise<void> = pingDatabase,
  timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS,
): Promise<HealthReport> {
  try {
    await withTimeout(ping(), timeoutMs);
    return { status: "ok", database: "ok" };
  } catch {
    return { status: "unavailable", database: "unavailable" };
  }
}
