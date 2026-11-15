import type { z } from "zod";
import { HttpError, type FieldErrors } from "./errors";

function valueAtPath(input: unknown, path: readonly PropertyKey[]): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}

function fieldCode(issue: z.core.$ZodIssue, input: unknown): string {
  switch (issue.code) {
    case "invalid_type":
      return valueAtPath(input, issue.path) === undefined
        ? "REQUIRED"
        : "INVALID_TYPE";
    case "too_small":
      return "TOO_SMALL";
    case "too_big":
      return "TOO_BIG";
    case "invalid_format":
      return "INVALID_FORMAT";
    case "invalid_value":
      return "INVALID_VALUE";
    case "unrecognized_keys":
      return "UNKNOWN_FIELD";
    default:
      return "INVALID";
  }
}

/** Maps Zod issues to field error codes keyed by dotted path. */
export function toFieldErrors(error: z.ZodError, input: unknown): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const path =
      issue.code === "unrecognized_keys"
        ? issue.keys.map((key) => [...issue.path, key].join("."))
        : [issue.path.map(String).join(".") || "_root"];
    for (const key of path) {
      const codes = (fields[key] ??= []);
      const code = fieldCode(issue, input);
      if (!codes.includes(code)) codes.push(code);
    }
  }
  return fields;
}

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
