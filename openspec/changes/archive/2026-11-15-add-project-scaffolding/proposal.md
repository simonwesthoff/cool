# Proposal

## Why

The repository contains only planning documents; there is no application yet.
Every feature in `feature_list.txt`, starting with sign-in, needs a running
web app, a database, a server-side domain layer with an HTTP API, and English
and German UI text. Building this foundation once, in its own change, keeps
the following feature changes focused on their feature.

## What Changes

- Create the Next.js (App Router) application with TypeScript (strict) and
  Tailwind CSS, mobile-first.
- Establish the layering required by the platform constraints: a server-side
  domain layer, exposed via HTTP API route handlers; UI code only calls into
  that layer.
- Add Zod validation at the API boundary, with a consistent error response
  shape.
- Connect PostgreSQL through Drizzle ORM with a migration workflow (no domain
  tables yet).
- Add next-intl with English and German message catalogs; the UI language
  follows the browser and can be switched by the user.
- Add a minimal start page (app name and language switcher) so the stack is
  visibly working.
- Add a health endpoint that reports whether the app and the database are
  reachable.
- Add Docker Compose with the app, PostgreSQL and a Caddy reverse proxy with
  HTTPS, configured only through environment variables, so it runs the same
  way locally and later on the VPS.
- Serve every browser connection over HTTPS, also on `localhost` (dev
  server and Docker Compose stack); plain HTTP only redirects to HTTPS.
  Production uses publicly trusted certificates; locally, self-signed
  certificates are accepted with a browser warning.
- Add developer tooling: linting, formatting, type checking, and a test runner
  for unit and API tests.

### Out of scope

- Sign-in and user accounts (next change: Google sign-in).
- Any domain entity (Team, Athlete, Invitation, training planning).
- Deployment to the Ionos VPS, DNS, and automated off-VPS PostgreSQL backups
  (separate later change).
- CI pipelines.
- Native mobile apps, offline mode.

### New domain terms

None.

## Capabilities

### New Capabilities

- `localization`: The UI is available in English and German; how the
  language is chosen, switched and remembered; no untranslated text.
- `transport-security`: Browser connections use HTTPS only, locally and in
  production; publicly trusted certificates in production.
- `service-health`: A health endpoint that reports the availability of the
  app and its database, used by Docker Compose and later monitoring.

### Modified Capabilities

None.

## Impact

- New code: the whole application skeleton (Next.js app, domain layer
  folder, API route handlers, database module, i18n setup, tests).
- New dependencies: next, react, typescript, tailwindcss, drizzle-orm,
  drizzle-kit, postgres driver, next-intl, zod, test runner, linter and
  formatter.
- New infrastructure files: `Dockerfile`, `docker-compose.yml`, `Caddyfile`,
  `.env.example`.
- No domain model changes.
