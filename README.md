# cool

**cool** (Competitive Olympic Weightlifting) is a web app where Olympic weightlifting coaches plan training for their athletes,
and athletes see and log their training. Planning documents (specs, glossary,
domain model) live in [`openspec/`](openspec/).

## Prerequisites

- Node.js 26 (LTS) and npm
- Docker with Docker Compose (Docker Desktop or OrbStack on macOS)

## Setup

```sh
npm ci
cp .env.example .env   # then set a real POSTGRES_PASSWORD (and DATABASE_URL)
```

### HTTPS

The app is only ever served over HTTPS, also on `localhost`. Create the
self-signed certificate for the dev server once (it is valid for a year;
run it again when it expires):

```sh
npm run certs     # creates certs/localhost.pem and certs/localhost-key.pem
```

The certificates are not trusted by your browser, so it shows a warning the
first time you open `https://localhost:3000` (dev server) and
`https://localhost` (Docker stack). Accept it to continue; the connection is
still encrypted. The `certs/` folder is gitignored.

### Sign-in with Google (one-time)

Sign-in uses Google only. Create an OAuth client in the
[Google Cloud Console](https://console.cloud.google.com/):

1. Create a project, e.g. "cool".
2. **Google Auth Platform → Branding / Audience**: set up the consent screen
   (app name, support email), user type **External**, and keep the
   publishing status **Testing**. Add every Google account that should be
   able to sign in under **Test users**. While the app is in Testing mode,
   only these accounts can sign in.
3. **Data access**: the scopes `openid`, `.../auth/userinfo.email` and
   `.../auth/userinfo.profile` are enough.
4. **Clients → Create client**, type **Web application**, with these
   authorized redirect URIs:
   - `https://localhost:3000/api/auth/callback/google` (`npm run dev`)
   - `https://localhost/api/auth/callback/google` (Docker Compose)
5. Copy the client ID and secret into `.env` as `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, and set `BETTER_AUTH_SECRET` to a random value:

   ```sh
   openssl rand -base64 32
   ```

`BETTER_AUTH_URL` in `.env` is the dev server's URL
(`https://localhost:3000`); Docker Compose sets it to `https://$APP_DOMAIN`
itself. Docker Compose refuses to start while one of these variables is
missing.

## Local development

Start only PostgreSQL in Docker, published on `localhost`:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
npm run db:migrate
npm run dev
```

The app runs on <https://localhost:3000>. The health check is at
<https://localhost:3000/api/health>. The dev server only accepts HTTPS and
only listens on `localhost`.

## Full stack (as in production)

```sh
docker compose up --build
```

This starts the app, PostgreSQL and Caddy, and serves the app on
<https://localhost>. The container applies pending database migrations
before it starts. Plain `http://` requests are redirected to HTTPS.

HTTPS is configured with `TLS_MODE` in `.env`:

- `local`: Caddy uses a certificate from its own local certificate
  authority (browser warning, see above).
- `public` (VPS): set `APP_DOMAIN` to the real domain; Caddy obtains a
  Let's Encrypt certificate and sends an HSTS header. No other file changes
  are needed.

## Database

- Table definitions: `src/server/db/schema/`
- `npm run db:generate` creates a SQL migration from schema changes in
  `src/server/db/migrations/`. Commit it.
- `npm run db:migrate` applies pending migrations to `DATABASE_URL`.

## Checks

```sh
npm run check   # typecheck, lint, formatting, tests
```

Other scripts: `npm run test:watch`, `npm run format`, `npm run build`.

## Project conventions

- Business rules and authorization live in `src/domain` and are exposed via
  the HTTP API in `src/app/api`; see [`src/domain/README.md`](src/domain/README.md).
- Every user-facing text lives in `messages/en.json` and `messages/de.json`.
  The tests fail if a text is missing in one language.
- API errors use one JSON shape with stable codes:
  `{ "error": { "code": "VALIDATION_FAILED", "fields": { "name": ["REQUIRED"] } } }`.
