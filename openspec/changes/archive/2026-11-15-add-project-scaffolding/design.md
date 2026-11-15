# Design

## Context

The repository has no application code (see proposal.md – Why). The stack,
layering, i18n and hosting constraints are fixed by the project context:
Next.js App Router, TypeScript strict, Tailwind, PostgreSQL + Drizzle,
next-intl, Zod, Docker Compose with Caddy. Requirements are in
`specs/localization/spec.md` and `specs/service-health/spec.md`.

Observed on the development machine: Node.js 26 and npm 11 are installed;
pnpm and Docker are not.

## Goals / Non-Goals

**Goals:**
- A folder structure and request flow that every later feature follows, so
  business rules end up in the domain layer and can be reused by future
  native apps through the HTTP API.
- One command to start the full stack locally (`docker compose up`), and a
  fast dev loop without containers for the app itself (`npm run dev`).
- Automated checks (types, lint, tests, translation completeness) runnable
  with one command.

**Non-Goals:**
- Production hardening beyond what Compose needs (VPS setup, backups, log
  shipping, monitoring) – later change.
- Any authentication or authorization mechanism – next change.

## Decisions

### Package manager: npm
npm is already installed; the project is a single app, so pnpm workspaces
bring no benefit. Alternative pnpm: faster, but one more tool to install.

### Folder structure and layering

```
src/
  app/                 Next.js routes (pages, layouts, route handlers)
    api/<resource>/route.ts   thin HTTP adapters
  domain/              business rules, one folder per capability;
                       no imports from next/*, react or app/
  server/
    http/              shared route-handler helpers (Zod parsing,
                       error mapping, JSON responses)
    db/                Drizzle client, schema, migrations
  i18n/                next-intl config, locale detection
  components/          presentational React components
messages/en.json, messages/de.json
```

Request flow: route handler → parse/validate with Zod → call domain function
→ map result or domain error to an HTTP response. Pages and server actions
call domain functions through the same service functions the route handlers
use (never the database directly). An ESLint `no-restricted-imports` rule
enforces that `src/domain` does not import from `next`, `react` or
`src/app`, and that `src/app` and `src/components` do not import
`src/server/db`.

Alternative considered: separate backend service (e.g. Fastify). Rejected:
the context mandates Next.js route handlers, and one deployable is simpler.

### API error shape
All API errors use one JSON shape:
`{ "error": { "code": "VALIDATION_FAILED", "fields": { "name": ["REQUIRED"] } } }`.
Codes are stable English identifiers; clients translate them (spec:
Language of API error messages). Zod issues are mapped to field codes in
`src/server/http`.

### Internationalization: next-intl without locale routing
next-intl's "without i18n routing" setup: the locale is resolved per request
in `src/i18n/request.ts` from the `NEXT_LOCALE` cookie, else from the
`Accept-Language` header (German if preferred over English, else English).
The language switcher sets the cookie and refreshes the current route.
This satisfies "Language-neutral URLs", which matters for shared invitation
links later.

Alternative: `/en/...` and `/de/...` prefixes. Rejected: links would carry
the sender's language.

Next.js 16 is used with Cache Components enabled (the generator default and
the default in the next major version). Because the locale is request data,
the root layout renders a static `<html>` shell and wraps everything that
depends on the locale in `<Suspense>`; an inline script sets the `lang`
attribute before the content is painted. `apiHandler` re-throws Next.js
control-flow errors (`unstable_rethrow`) so build-time prerendering of
dynamic route handlers is not reported as an API error.

Translation completeness: a Vitest test compares the key sets of
`messages/en.json` and `messages/de.json` and fails listing missing keys.
TypeScript augmentation of next-intl's `Messages` type makes unknown keys a
type error. ESLint's `react/jsx-no-literals` flags hardcoded JSX text.

### Database: PostgreSQL 17, Drizzle ORM, postgres.js driver
- Schema files in `src/server/db/schema/`; this change adds none (empty
  schema), so the first migration comes with the first table.
- `drizzle-kit generate` creates SQL migrations committed to
  `src/server/db/migrations/`. Migrations are applied by a small
  `migrate` script (Drizzle's migrator) that the app container runs before
  starting the server, and that developers run with `npm run db:migrate`.
- Alternative `drizzle-kit push`: rejected for anything beyond throwaway
  experiments, because it leaves no reviewable migration history.

### Health endpoint
`GET /api/health` runs `SELECT 1` with a 2-second timeout and returns
`{ "status": "ok", "database": "ok" }` (200) or
`{ "status": "unavailable", "database": "unavailable" }` (503). It is
excluded from future authentication. The Compose healthcheck of the app
service calls it.

### Docker Compose
- Services: `app` (multi-stage Dockerfile, Next.js `output: "standalone"`),
  `db` (`postgres:17`, named volume, own healthcheck), `caddy`
  (`caddy:2`, ports 80/443, volumes for certificates).
- `app` waits for `db` healthy; `caddy` proxies to `app:3000`.
- The Caddy site address comes from `APP_DOMAIN`; TLS is chosen by
  `TLS_MODE` (see "HTTPS everywhere"). Same Caddyfile in both environments.
- All environment-specific values (`APP_DOMAIN`, `DATABASE_URL`,
  `POSTGRES_PASSWORD`, …) come from `.env`; `.env.example` documents them.
  Only `db` is reachable by `app`; PostgreSQL is not published to the host
  except via an opt-in dev override file for local tooling.

### HTTPS everywhere (spec: transport-security)
- **Dev server**: `npm run certs` creates a self-signed certificate for
  `localhost`, `127.0.0.1` and `::1` with `openssl` (part of macOS) into
  `certs/` (gitignored, valid one year). `npm run dev` runs
  `next dev --experimental-https` with that certificate, bound to
  `localhost` only. There is no plain HTTP dev port. Passing our own
  certificate keeps Next.js from downloading and installing mkcert.
- **Caddy**: the Caddyfile imports a snippet selected by `TLS_MODE`:
  `local` uses `tls internal` (Caddy's own local CA, kept in the
  `caddy_data` volume); `public` uses automatic Let's Encrypt certificates
  and adds `Strict-Transport-Security: max-age=31536000`. HSTS is not sent
  on `localhost` because it would force HTTPS on every other local project.
- Local certificates are not trusted by the browser; the developer accepts
  the warning (decision by the user: no extra trust-store tooling for now).
- Port 80 stays open only for Caddy's automatic HTTP→HTTPS redirect (and
  ACME challenges on the VPS); it never serves content.
- TLS terminates at Caddy. The hop from Caddy to the app and from the app to
  PostgreSQL runs inside the private Docker network and is not reachable from
  outside; PostgreSQL is only published on the host's loopback interface in
  the opt-in dev override.
- Alternative: mkcert, a local CA installed into the trust store, removes
  the warning. Rejected for now; it can be added later without changing
  the specs.

### Tooling
- ESLint (Next.js config + rules above) and Prettier.
- Vitest for unit and API tests. Route handlers are tested by calling the
  exported handler functions with `Request` objects; the database is
  replaced by a fake in unit tests. Tests against a real database are added
  when the first table exists.
- `npm run check` runs typecheck, lint and tests.

## Risks / Trade-offs

- [Docker is not installed on the development machine] → Install Docker
  Desktop (or OrbStack) before the Compose tasks; the app itself can be
  developed with `npm run dev` against a local PostgreSQL in the meantime.
- [Clicking through certificate warnings becomes a habit] → Only ever on
  `localhost`; production always has a publicly trusted certificate.
- [Node 26 locally vs. image version] → Pin the Docker base image to the
  current Node LTS and add an `engines` field; the app must not rely on
  features newer than that LTS.
- [`react/jsx-no-literals` is noisy for symbols like "·"] → Allow a small
  list of non-linguistic strings in its config.
- [Cookie-based locale makes pages per-request dynamic] → Acceptable: the
  app is behind sign-in and personalized anyway.

## Migration Plan

Greenfield; nothing to migrate. Rollback is removing the commit.
