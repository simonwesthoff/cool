/**
 * Error raised by domain functions for expected failures.
 *
 * `code` is a stable, language-independent identifier (e.g. `ATHLETE_NOT_FOUND`)
 * that clients translate. `kind` lets the HTTP layer choose a status code
 * without the domain layer knowing about HTTP.
 */
export type DomainErrorKind =
  "invalid" | "unauthenticated" | "forbidden" | "not_found" | "conflict";

export class DomainError extends Error {
  constructor(
    readonly kind: DomainErrorKind,
    readonly code: string,
  ) {
    super(code);
    this.name = "DomainError";
  }
}
