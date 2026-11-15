import type { z } from "zod";
import { toFieldErrors } from "@/domain/validation";
import { HttpError } from "./errors";

export { toFieldErrors };

/** Validates a value; throws an `HttpError` 400 `VALIDATION_FAILED` on failure. */
export function validate<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(
      400,
      "VALIDATION_FAILED",
      toFieldErrors(result.error, input),
    );
  }
  return result.data;
}

/** Reads a JSON request body without validating it (domain functions do). */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "INVALID_JSON");
  }
}

/** Reads and validates a JSON request body. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "INVALID_JSON");
  }
  return validate(schema, body);
}

/** Validates URL query parameters (all values are strings). */
export function parseSearchParams<S extends z.ZodType>(
  request: Request,
  schema: S,
): z.output<S> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return validate(schema, params);
}
