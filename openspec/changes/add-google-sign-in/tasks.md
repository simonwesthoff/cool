# Tasks

## 1. Google OAuth client and configuration

- [ ] 1.1 Create a Google Cloud project with an OAuth consent screen (External, Testing mode, your Google account as test user, scopes `openid`, `email`, `profile`) and a "Web application" OAuth client with the redirect URIs `https://localhost:3000/api/auth/callback/google` and `https://localhost/api/auth/callback/google` (done by the user, guided step by step); verify the client ID and secret are in the local `.env`
- [ ] 1.2 Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.example` with explanations, and pass them to the app service in `docker-compose.yml` (`BETTER_AUTH_URL` derived from `APP_DOMAIN`, required variables fail fast); verify `docker compose config` is valid and fails with a clear message when a variable is missing

## 2. Better Auth and database

- [ ] 2.1 Add Better Auth; configure it in `src/server/auth/auth.ts` (Drizzle adapter, Google provider only with profile override on sign-in and verified emails only, model names `user_account` and `oauth_account`, 30-day sessions with 1-day update age, secure cookies, rate limiting); verify a configuration unit test for providers, session lifetime and cookie attributes
- [ ] 2.2 Generate the Drizzle schema for the auth tables into `src/server/db/schema/auth.ts` and the first migration with `npm run db:generate`; verify `npm run db:migrate` creates `user_account`, `session`, `oauth_account` and `verification` in the local database
- [ ] 2.3 Mount Better Auth's handler at `src/app/api/auth/[...all]/route.ts`; verify `GET /api/auth/get-session` without a cookie returns no session and `/api/health` still answers without a session

## 3. Domain layer

- [ ] 3.1 Implement `src/domain/auth`: `getCurrentUser(headers)`, `requireCurrentUser(headers)` (throws `UNAUTHENTICATED`) and `safeReturnPath(value)`; verify unit tests for a valid session, no session, expired session, and return paths (relative path with query, absolute URL, `//host`, `/\host`, `/api/…`, `/sign-in`, empty)
- [ ] 3.2 Implement `GET /api/me` with `apiHandler` and `requireCurrentUser`; verify route tests for 200 with name, email and picture, and 401 `UNAUTHENTICATED` without a session

## 4. Page protection

- [ ] 4.1 Add `src/proxy.ts` that redirects requests without a session cookie to `/sign-in?returnTo=…`, excluding `/sign-in`, `/api/*` and static assets; verify unit tests for a protected page, a page with query string, the sign-in page, an API path and a static asset
- [ ] 4.2 Add the server-side check to protected pages (redirect to `/sign-in?returnTo=…` when `getCurrentUser` returns none) and to the sign-in page (redirect signed-in users to `safeReturnPath(returnTo)`); verify by tests or manually that an invalid session cookie still leads to the sign-in page

## 5. Sign-in page

- [ ] 5.1 Add the Better Auth React client and the "Continue with Google" button (Google branding guidelines, passes the safe return path and the error callback URL); verify a component test that clicking calls the social sign-in with provider `google` and the expected callback URLs
- [ ] 5.2 Build `/sign-in` with app name, button, language switcher and the error message (`access_denied` → "not completed", any other code → "failed"); add English and German texts; verify component tests for no error, cancelled and failed, and the translation completeness test

## 6. Home page and sign-out

- [ ] 6.1 Build the avatar component (Google picture via `next/image` with `*.googleusercontent.com` as allowed remote host; initials when there is no picture); verify component tests for both cases
- [ ] 6.2 Turn `/` into the signed-in home page with avatar, name, sign-out button and language switcher; the sign-out button calls the client's sign-out and navigates to `/sign-in`; add English and German texts; verify component tests and the translation completeness test

## 7. Documentation and project records

- [ ] 7.1 Add "User account" (German: Benutzerkonto) to `openspec/glossary.md` in a new section for app terms
- [ ] 7.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md`: add the user account to "Current model" and remove it from "Draft" where it is now built, leaving the open questions untouched
- [ ] 7.3 Update `README.md`: Google OAuth client setup, the new environment variables, and that only test users can sign in while the consent screen is in Testing mode; verify the documented steps match the configuration

## 8. Integration check

- [ ] 8.1 Dev server (`https://localhost:3000`): signed out, opening `/` shows the sign-in page; sign in with Google returns to `/` showing name and picture; reload stays signed in; cancelling at Google shows the "not completed" message; opening a deep link while signed out returns to it after sign-in; sign-out shows the sign-in page and `/` stays protected; `/api/me` returns 401 after sign-out; the session cookie has HttpOnly, Secure and SameSite=Lax; both languages look right
- [ ] 8.2 Docker stack (`https://localhost`): rebuild, migrations run on start, and the sign-in, home page and sign-out flow from 8.1 works the same; `/api/health` stays public

## Workflow follow-up

- User acceptance test on the Docker stack, then commit, archive the change and continue with feature 2 (user roles).
