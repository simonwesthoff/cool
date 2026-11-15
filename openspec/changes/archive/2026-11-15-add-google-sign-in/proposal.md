# Proposal

## Why

Every later feature (roles, athletes, training plans) needs to know who is
using the app. Coaches and athletes already have Google accounts, so signing
in with Google lets them start without creating and remembering another
password. This is feature 1 of `feature_list.txt`, limited to Google for now.

## What Changes

- Users sign in with their Google account. On the first sign-in, a user
  account is created from the Google profile (name, email address, profile
  picture); on later sign-ins, name and picture are refreshed from Google.
- Every page except the sign-in page requires a signed-in user. A signed-out
  user who opens any other page is sent to the sign-in page and, after
  signing in, back to the page they originally opened (needed later for
  invitation links).
- New sign-in page with a "Continue with Google" button, the language
  switcher, and an error message when sign-in was cancelled or failed.
- The start page becomes a placeholder home page for signed-in users: their
  name, profile picture and a sign-out button. Feature 2 (user roles)
  replaces it with the coach/athlete start flow.
- Users can sign out on the current device.
- Sessions last 30 days and are extended while the app is used, so athletes
  at the gym rarely have to sign in again.
- The HTTP API identifies the user by their session. API endpoints that need
  a user answer `401` with the code `UNAUTHENTICATED` when there is none. A
  new endpoint returns the signed-in user's profile.
- All new texts in English and German.

### Out of scope

- Apple sign-in (own later change), email/password or any other method.
- User roles, teams, athletes, invitations (features 2 and 3).
- Editing the user account's profile in the app.
- Deleting a user account or exporting its data; privacy policy and legal
  notice pages (needed before going public; own change).
- Signing out other devices or listing active sessions.
- Token-based authentication for future native apps.

### New domain terms

- **User account**: the identity of a person in the app, created by signing
  in with Google. It has no role by itself.

## Capabilities

### New Capabilities

- `authentication`: Signing in with Google, user accounts created from the
  Google profile, sessions, signing out, and which pages and API endpoints
  require a signed-in user.

### Modified Capabilities

None. The health endpoint stays unauthenticated as `service-health`
already requires.

## Impact

- New dependency: Better Auth (with its Drizzle adapter).
- New database tables for user accounts, sessions and linked Google
  accounts, with the first Drizzle migration.
- New pages: sign-in page; the start page becomes the signed-in home page.
- New API: Better Auth's endpoints under `/api/auth/*` and an endpoint for
  the current user's profile.
- New configuration: Google OAuth client ID and secret, an auth secret, and
  the app's public URL, all via environment variables. A Google Cloud OAuth
  client must be created (by the user) with redirect URIs for local
  development and the Docker stack.
- Domain model: the user account moves from "Draft" to "Current model".
