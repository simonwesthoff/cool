import { unstable_rethrow } from "next/navigation";
import { toErrorResponse } from "./errors";

/**
 * Wraps a route handler so that every thrown error becomes a response in the
 * shared API error shape. Next.js control-flow errors (e.g. the signal that
 * stops prerendering at `connection()`) are re-thrown untouched.
 */
export function apiHandler<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error);
    }
  };
}
