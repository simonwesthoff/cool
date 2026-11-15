import { beforeEach, describe, expect, it, vi } from "vitest";

const sql = vi.fn<() => Promise<unknown>>();

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/server/db", () => ({ getSql: () => sql }));

const { GET } = await import("./route");

function request(): Request {
  return new Request("http://localhost/api/health");
}

describe("GET /api/health", () => {
  beforeEach(() => {
    sql.mockReset();
  });

  it("returns 200 when the database is reachable", async () => {
    sql.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("returns 503 without internal details when the database fails", async () => {
    sql.mockRejectedValue(
      new Error("password authentication failed for postgres://app:pw@db"),
    );
    const response = await GET(request());
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({
      status: "unavailable",
      database: "unavailable",
    });
    expect(text).not.toMatch(/postgres|password|version/i);
  });

  it("returns 503 after 2 seconds when the database hangs", async () => {
    vi.useFakeTimers();
    try {
      sql.mockReturnValue(new Promise(() => {}));
      const pending = GET(request());
      await vi.advanceTimersByTimeAsync(2000);
      const response = await pending;
      expect(response.status).toBe(503);
    } finally {
      vi.useRealTimers();
    }
  });
});
