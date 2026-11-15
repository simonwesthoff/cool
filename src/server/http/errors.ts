import { DomainError, type DomainErrorKind } from "@/domain/errors";
import { DomainValidationError, type FieldErrors } from "@/domain/validation";

export type { FieldErrors };

/** The single JSON shape of every API error response. */
export type ApiErrorBody = {
  error: {
    code: string;
    fields?: FieldErrors;
  };
};

/** An error that maps directly to an HTTP error response. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fields?: FieldErrors,
  ) {
    super(code);
    this.name = "HttpError";
  }
}

const statusByKind: Record<DomainErrorKind, number> = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  gone: 410,
};

export function errorResponse(
  status: number,
  code: string,
  fields?: FieldErrors,
): Response {
  const body: ApiErrorBody = { error: fields ? { code, fields } : { code } };
  return Response.json(body, { status });
}

/**
 * Converts any thrown value into an API error response. Unexpected errors are
 * logged on the server and returned as `INTERNAL_ERROR` without details.
 */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.code, error.fields);
  }
  if (error instanceof DomainValidationError) {
    return errorResponse(400, error.code, error.fields);
  }
  if (error instanceof DomainError) {
    return errorResponse(statusByKind[error.kind], error.code);
  }
  console.error(error);
  return errorResponse(500, "INTERNAL_ERROR");
}
