# Tasks

## 1. Database

- [ ] 1.1 Add `athlete.user_account_id` (nullable, unique, FK with `on delete set null`) and the `invitation` table to the Drizzle schema, generate the migration and apply it locally; verify the columns, unique constraints and foreign keys in PostgreSQL
- [ ] 1.2 Add the custom data migration that deletes Teams without athletes; verify with a PGlite test that empty Teams are removed and Teams with athletes stay

## 2. Roles

- [ ] 2.1 Implement `getRoles`, `startAsCoach` and `requireCoachTeam`, add the `gone` error kind (410), and switch all athlete functions from `getOrCreateTeam` to `requireCoachTeam`; verify PGlite tests for no role, coach, athlete, both roles in different Teams and in the same Team, idempotent start, and `NOT_A_COACH` without creating a Team
- [ ] 2.2 Extend `GET /api/me` with roles, add `POST /api/team`, and return 403 `NOT_A_COACH` from the athlete endpoints; verify route tests

## 3. Invitations

- [ ] 3.1 Implement token generation and hashing and the `appUrl()` helper; verify unit tests for token length/alphabet, hash stability and that the plain token is not stored
- [ ] 3.2 Implement `createInvitation`, `getInvitation`, `acceptInvitation` and `linkSelf` with the transaction rules from design.md, and add `linkedAccount` to the athlete shape; verify PGlite tests for create, replace (old link "used"), expiry with injected time, used, unknown, linked athlete cannot be invited, already-linked user keeps the link valid, parallel accepts link exactly one user, "This is me" (and its refusals), and email/picture of linked athletes
- [ ] 3.3 Add `POST /api/athletes/{id}/invitations`, `POST /api/athletes/{id}/link-self`, `GET /api/invitations/{token}` and `POST /api/invitations/{token}/accept`; verify route tests for success, 401, 403, 404, 409 and 410 with their codes

## 4. Pages

- [ ] 4.1 Home page by role (start choice, athlete list, redirect to `/training`), "Start as Coach" and the `/start/athlete` link entry with client-side validation; coach-only pages redirect users without a Team to `/`; add English and German texts; verify component tests (start choice, valid and invalid links) and page tests for the redirects
- [ ] 4.2 Invitation panel (create link, read-only field, expiry date, copy with confirmation, keyed by `bfcacheId`), "Invite" and "This is me" on the edit page, "Save and invite" on the new athlete page, and the linked-account section; add English and German texts; verify component tests
- [ ] 4.3 `/invite/{token}` page with all states (valid with Accept, already linked, expired, used, unknown) and acceptance leading to `/training`; add English and German texts; verify component tests for each state
- [ ] 4.4 `/training` athlete placeholder view and the "My Team" / "My training" switch in the header for users with both roles; add English and German texts; verify component and page tests

## 5. Project records

- [ ] 5.1 Add Invitation and Role to `openspec/glossary.md` (German: Einladung, Rolle)
- [ ] 5.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md` (everything in the draft is now built)

## 6. Integration check

- [ ] 6.1 Browser check on the dev server with two temporary test users: start as coach, add athlete with "Save and invite", copy link, second user starts as athlete, enters the link, accepts, sees the athlete view; coach sees the linked account; old link shows "no longer valid"; "This is me" gives the coach both roles and the header switch; both languages
- [ ] 6.2 Docker stack: rebuild, both migrations run on start, and the flow from 6.1 works

## Workflow follow-up

- User acceptance test with two real Google accounts, then commit, archive and continue with feature 4 (athlete overview).
