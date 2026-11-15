# Tasks

## 1. Application skeleton

- [x] 1.1 Create the Next.js App Router app with TypeScript (strict), Tailwind CSS, `src/` directory and npm; set `output: "standalone"` and an `engines` field for the current Node LTS; verify `npm run build` succeeds
- [x] 1.2 Create the folders `src/domain`, `src/server/http`, `src/server/db`, `src/i18n`, `src/components` with a short README in `src/domain` describing the layering rules; verify the structure matches design.md
- [x] 1.3 Configure ESLint (Next.js config, `no-restricted-imports` layering rules, `react/jsx-no-literals`) and Prettier; verify `npm run lint` passes and a deliberate forbidden import from `src/domain` to `next/server` is reported
- [x] 1.4 Set up Vitest and the `npm run check` script (typecheck, lint, test); verify `npm run check` passes with a sample test

## 2. API boundary

- [x] 2.1 Implement `src/server/http` helpers: Zod body/query parsing, the shared error shape with stable codes and field codes, and mapping of unknown errors to `INTERNAL_ERROR` without leaking details; verify unit tests for a valid body, a validation failure (code + fields) and an unexpected error

## 3. Database

- [x] 3.1 Add Drizzle ORM, drizzle-kit and postgres.js; create the database client in `src/server/db` reading `DATABASE_URL`, an empty schema module and `drizzle.config.ts`; verify `npm run typecheck` passes
- [x] 3.2 Add `npm run db:generate` and the `db:migrate` script using Drizzle's migrator; verify `db:migrate` runs without error against a local PostgreSQL with zero migrations

## 4. Health endpoint

- [x] 4.1 Implement `GET /api/health` with `SELECT 1` and a 2-second timeout returning 200 or 503 per `specs/service-health/spec.md`; verify tests for database reachable, database failing and database hanging longer than 2 seconds, and that the response contains no internal details

## 5. Localization

- [x] 5.1 Set up next-intl without locale routing: locale resolution from the `NEXT_LOCALE` cookie, else `Accept-Language` (German if preferred over English, else English); verify unit tests for cookie precedence, German preferred, English preferred and unsupported languages
- [x] 5.2 Create `messages/en.json` and `messages/de.json` and the next-intl `Messages` type augmentation; add the translation completeness test; verify it fails when a key is removed from one file and passes otherwise
- [x] 5.3 Build the language switcher component that sets the cookie and refreshes the current route; add English and German texts for its labels; verify a component test that switching keeps the current path
- [x] 5.4 Build the minimal start page (app name, short tagline, language switcher) with English and German texts and a mobile-first layout; verify manually at phone width and desktop width in both languages

## 6. Containers

- [x] 6.1 Install Docker Desktop or OrbStack on the development machine (prerequisite, done by the user); verify `docker compose version` works
- [x] 6.2 Write the multi-stage `Dockerfile` (deps, build, runtime on the pinned Node LTS image, runs `db:migrate` then the standalone server as a non-root user); verify `docker build .` succeeds
- [x] 6.3 Write `docker-compose.yml` (app, db with volume and healthcheck, caddy with certificate volumes), the app healthcheck calling `/api/health`, and an opt-in `docker-compose.dev.yml` that publishes PostgreSQL to the host; verify `docker compose config` is valid
- [x] 6.4 Write the `Caddyfile` using `{$APP_DOMAIN}` and reverse-proxying to `app:3000`; create `.env.example` documenting every variable; verify no environment-specific value is hardcoded in the Compose files or Caddyfile

- [x] 6.5 Add `npm run certs` (self-signed certificate via openssl for `localhost`, `127.0.0.1`, `::1` into gitignored `certs/`) and switch `npm run dev` to HTTPS with that certificate bound to `localhost`; verify `https://localhost:3000` serves the app and nothing answers over plain HTTP on that port
- [x] 6.6 Add `TLS_MODE` (`local` = `tls internal` | `public`) to the Caddyfile via imported snippets, add HSTS only for `public`, and document `TLS_MODE` in `.env.example`; verify with `TLS_MODE=local` that `https://localhost` presents a certificate from Caddy's local CA without HSTS and `http://localhost` only redirects, and that `caddy validate` passes for `TLS_MODE=public`

## 7. Documentation and integration check

- [x] 7.1 Write `README.md`: prerequisites, creating the local certificate and accepting the browser warning, local dev with `npm run dev`, full stack with `docker compose up`, database scripts, `npm run check`; verify the commands run as written
- [x] 7.2 End-to-end check: with `APP_DOMAIN=localhost`, run `docker compose up`; verify `https://localhost` shows the start page after accepting the certificate warning in the browser language, the switcher changes and remembers the language, `https://localhost/api/health` returns 200, and stopping `db` makes it return 503

## Workflow follow-up

- No new domain terms and no domain model changes; `openspec/glossary.md` and `openspec/domain-model.md` stay unchanged.
- Archive the change after review, then propose the next change: Google sign-in (feature 1).
