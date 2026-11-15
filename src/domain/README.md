# Domain layer

All business rules and authorization live here. The HTTP API (route handlers
in `src/app/api`) and the web UI both call into this layer, so future native
apps get exactly the same behavior through the API.

Rules (enforced by ESLint `no-restricted-imports`):

- Code in `src/domain` must not import from `next`, `react`, `react-dom`,
  `next-intl` or `src/app`. It is plain TypeScript.
- Domain code may use `src/server/db` for persistence.
- `src/app` and `src/components` must not import `src/server/db`. Pages,
  server components and server actions call domain functions instead.
- Route handlers stay thin: validate input with Zod (helpers in
  `src/server/http`), call a domain function, map the result or domain error
  to an HTTP response.
- Use one folder per capability, e.g. `src/domain/health/`.
- Domain errors carry stable, language-independent error codes; clients
  translate them.
