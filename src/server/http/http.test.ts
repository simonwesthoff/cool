import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DomainError } from "@/domain/errors";
import { apiHandler, parseJsonBody } from "./index";

const schema = z.strictObject({
  name: z.string().min(1),
  heightCm: z.number().int().positive().optional(),
});

const route = apiHandler(async (request: Request) => {
  const body = await parseJsonBody(request, schema);
  return Response.json({ received: body });
});

function post(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("API boundary helpers", () => {
  it("passes a valid body to the handler", async () => {
    const response = await route(post(JSON.stringify({ name: "Ada" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: { name: "Ada" } });
  });

  it("returns VALIDATION_FAILED with field codes", async () => {
    const response = await route(
      post(JSON.stringify({ heightCm: -3, nickname: "x" })),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        fields: {
          name: ["REQUIRED"],
          heightCm: ["TOO_SMALL"],
          nickname: ["UNKNOWN_FIELD"],
        },
      },
    });
  });

  it("returns INVALID_JSON for a malformed body", async () => {
    const response = await route(post("{not json"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_JSON" } });
  });

  it("maps domain errors to their status and code", async () => {
    const failing = apiHandler(async () => {
      throw new DomainError("not_found", "ATHLETE_NOT_FOUND");
    });
    const response = await failing(post("{}"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "ATHLETE_NOT_FOUND" },
    });
  });

  it("hides details of unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = apiHandler(async () => {
      throw new Error("connection string postgres://secret@db");
    });
    const response = await failing(post("{}"));
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ error: { code: "INTERNAL_ERROR" } });
    expect(text).not.toContain("secret");
  });
});
