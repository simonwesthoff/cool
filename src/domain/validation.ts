import type { z } from "zod";
import { DomainError } from "./errors";

/** Field-level error codes, keyed by dotted field path. */
export type FieldErrors = Record<string, string[]>;

/** Invalid input to a domain function, with a code per affected field. */
export class DomainValidationError extends DomainError {
  constructor(readonly fields: FieldErrors) {
    super("invalid", "VALIDATION_FAILED");
    this.name = "DomainValidationError";
  }
}

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
    case "custom": {
      // Domain rules attach a stable code: `{ params: { code: "IN_FUTURE" } }`.
      const code = (issue.params as { code?: unknown } | undefined)?.code;
      return typeof code === "string" ? code : "INVALID";
    }
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

/** Validates domain input; throws `DomainValidationError` on failure. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new DomainValidationError(toFieldErrors(result.error, input));
  }
  return result.data;
}
