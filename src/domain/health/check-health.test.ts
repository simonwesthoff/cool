import { describe, expect, it } from "vitest";
import { checkHealth, HEALTH_CHECK_TIMEOUT_MS } from "./check-health";

describe("checkHealth", () => {
  it("reports ok when the database answers", async () => {
    await expect(checkHealth(async () => {})).resolves.toEqual({
      status: "ok",
      database: "ok",
    });
  });

  it("reports unavailable when the database fails", async () => {
    await expect(
      checkHealth(async () => {
        throw new Error("ECONNREFUSED");
      }),
    ).resolves.toEqual({ status: "unavailable", database: "unavailable" });
  });

  it("reports unavailable when the database does not answer in time", async () => {
    const started = Date.now();
    const report = await checkHealth(() => new Promise<void>(() => {}), 50);
    expect(report.database).toBe("unavailable");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("uses a 2 second timeout by default", () => {
    expect(HEALTH_CHECK_TIMEOUT_MS).toBe(2000);
  });
});
