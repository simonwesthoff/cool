# Tasks

## 1. Database and test setup

- [x] 1.1 Add the `gender` enum and the `team` and `athlete` tables to `src/server/db/schema/athletes.ts`, generate the migration and apply it locally; verify `npm run db:migrate` creates both tables with the unique `coach_id` and the foreign keys
- [x] 1.2 Add PGlite with a test helper that creates an in-memory database with all migrations and is used by mocking `@/server/db`; verify a sample test can insert and read a `user_account` row

## 2. Domain layer

- [x] 2.1 Implement `basicDataSchema` (create and update variants) with the rules from design.md and extend `toFieldErrors` to pass through custom issue codes; verify unit tests for each rule (name required and trimmed, 100-character limit, future dates, career start before birth, height range, gender values, `null` clears, name cannot be cleared)
- [x] 2.2 Implement `getOrCreateTeam`, `listAthletes`, `getAthlete`, `createAthlete` and `updateAthlete` scoped by the coach's Team; verify PGlite tests for Team creation (once, also with parallel calls), create/list/get/update, sorting, and `ATHLETE_NOT_FOUND` for another Team's athlete and for a malformed id

## 3. HTTP API

- [x] 3.1 Implement `GET`/`POST /api/athletes` and `GET`/`PATCH /api/athletes/{id}` with `apiHandler` and `requireCurrentUser`; verify route tests for 200/201, 400 `VALIDATION_FAILED` with field codes, 401 and 404

## 4. Pages

- [x] 4.1 Add the `UserMenu` (small avatar, name, sign-out) to the header of signed-in pages and keep the language-switcher-only header on the sign-in page; add English and German texts; verify component tests and the translation completeness test
- [x] 4.2 Turn the home page into the athlete list (names sorted, links to the edit page, "Add athlete", empty state); add English and German texts; verify component tests for the sorted list and the empty state
- [x] 4.3 Build `AthleteForm` and the pages `/athletes/new` and `/athletes/{id}` (server-side load, `notFound()` for unknown or foreign athletes, success returns to `/`, translated field errors); add English and German texts including every field error code; verify component tests for submit, clearing a value and field error display
- [x] 4.4 Add a translated `src/app/not-found.tsx`; verify it shows in both languages for `/athletes/<unknown id>`

## 5. Project records

- [x] 5.1 Add Team, Coach, Athlete and Basic data to `openspec/glossary.md` (with German terms Team, Trainer, Athlet, Stammdaten)
- [x] 5.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md`: move Team and Athlete with their relation into "Current model", keep the athlete–user-account link and Invitation in "Draft"

## 6. Integration check

- [x] 6.1 Dev server: a new user gets an empty athlete list; add an athlete with only a name and one with all fields; invalid values show field messages; edit and clear a value; the list is sorted; a second Google account cannot open the first account's athlete (404 page); both languages
- [x] 6.2 Docker stack: rebuild, migration runs on start, and the flow from 6.1 works the same

## Workflow follow-up

- User acceptance test, then commit, archive the change and continue with feature 2 (user roles and invitations), which can now build on Team and Athlete.
