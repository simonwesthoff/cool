# Tasks

## 1. Weekly schedule

- [x] 1.1 Add the table `macrocycle_session` and the migrations. First add the table and fill it from `training_frequency` (spread over Monday–Saturday, then second and third slots from Monday), then drop the column. Verify: a migration test on PGlite converts 1, 6, 8 and 14 to the expected schedules; `npm run db:migrate` runs on the dev database.
- [x] 1.2 Domain:
  - **Input:** the base data takes `sessions: [{ weekday, slot }]` (1–14, at most 3 per day, contiguous slots).
  - **Responses:** they return `sessions` and `trainingFrequency` as the count; the summary and calculations use the count.

  Verify with PGlite tests: create and update with a schedule; field codes for no session, a 4th slot and more than 14; the count in `getMacrocycle`.
- [x] 1.3 Base data form:
  - **Picker:** the weekly schedule picker replaces the number input, with seven day columns, "+" up to 3 sessions per day, remove, and the count shown below.
  - **Accessibility:** it is keyboard reachable.

  Verify with component tests (pick, remove, the 4th slot not offered, the required error, German labels) and the base data form payload.

## 2. Week plan data and domain

- [x] 2.1 Add the tables `week_plan`, `training_session`, `session_exercise` and `set_group` with their keys, uniqueness and cascades, and the migration. Verify: migrations apply on the dev database and in the PGlite setup.
- [x] 2.2 `week-plan/calculation.ts`:
  - **Actual values:** heaviest weight, mHG, set size and weekly reps per exercise over all sessions.
  - **Deviation:** `deviation()` with the strict 5 % band.

  Verify with unit tests: the spec's week 11 snatch example (80 kg, 69.5 kg, set size 2 below, 20 reps), 85 kg above, 72.45 vs 69 within, set groups without weight, and null projections.
- [x] 2.3 Week plan domain:
  - **Read:** `getWeekPlan` (coach and linked athlete), with the mesocycle check (chosen, missing and not planned).
  - **List:** `listWeekPlans`.
  - **Save:** `saveWeekPlan` (coach only, replaces the week; an empty body deletes it).
  - **Initial content:** `initialWeekContent` (stored plan → copy of week−1 with notes when asked → weekly schedule without exercises).
  - **Errors:** `WEEK_NOT_FOUND` and `ATHLETE_NOT_FOUND`.

  Verify with PGlite tests:
  - **Save and read:** with the order kept; validation codes (0 sets, 82.3 kg, a duplicate exercise in a session, more than 14 sessions, a 4th slot); an empty save deletes.
  - **Access:** week 22 of 21; linked-athlete read and refused write; stranger.
  - **Content:** the mesocycle check with the spec example; initial content in all three cases.
- [x] 2.4 Duration guard: `updateBaseData` refuses a duration below the highest planned week with `WEEKS_PLANNED`. Verify with a PGlite test (week 20 planned: 18 is refused, 20 is allowed) and the form message.

## 3. API

- [x] 3.1 Routes:
  - **Base data:** the macrocycle routes take and return the schedule.
  - **Week plans:** `GET`/`PUT …/weeks/{week}/plan` and `GET …/weeks/plans`.

  Verify with route tests: 200 for coach and linked athlete on GET, 200/400 on PUT, 404 codes, 401 without a session, and the linked athlete's writes refused.

## 4. Week editor

- [x] 4.1 Page `/athletes/{id}/macrocycle/weeks/{week}`:
  - **Access:** coach only.
  - **Loads:** the macrocycle, the week's projections for all catalog exercises, the initial content (`?prefill=previous`) and the catalog.
  - **Back link:** to the athlete page.

  Verify with page tests: stored plan, prefill only when unplanned, the schedule otherwise, and "not found" for other users, the linked athlete and a week outside the macrocycle.
- [x] 4.2 Editor shell:
  - **Header and stepper:** "Week x of y", dates, mesocycle and level; a two-step stepper sharing the planning stepper's look.
  - **Navigation:** "Continue" and "Back" between the steps without a route change; "Save" from both steps.
  - **Unsaved changes:** the guard on the back link.

  Verify with component tests: step switching keeps the draft and never calls the router; save payload; dialog choices; no dialog when switching steps.
- [x] 4.3 Step 1:
  - **Desktop:** the catalog column (all exercises, the mesocycle's highlighted) left of the session cards.
  - **Sessions:** day and slot change, add and remove a session, add, remove and reorder exercises.
  - **Adding exercises:** drag & drop from the catalog onto a session; clicking into a session opens the selection sheet (highlighted the same way).
  - **Phones:** the catalog column hidden.

  Verify with component tests:
  - **Adding:** a drop event adds the exercise; the click path adds it.
  - **Editing:** a day change; highlighting in both lists; labels "Monday" / "Monday 1"; no indicators in step 1.
- [x] 4.4 Step 2:
  - **Layout:** the sessions column (day, slot and exercises only) and the values column with set groups ("sets × reps @ kg", add and remove) and coach notes, aligned per exercise.
  - **Indicators:** the week totals with the projection and red ↑ / blue ↓ per exercise.
  - **Mesocycle check:** missing and not-planned exercises.
  - **Phones:** set groups below each exercise.

  Verify with component tests: the spec's week 11 example (colours, arrows, projected values), live update while typing, values without a projection not compared, and German texts.
- [x] 4.5 Step animation: on desktop, only the sessions column slides right→left to step 2 and back left→right; the catalog and values columns fade; `prefers-reduced-motion` switches instantly. Verify with component tests (classes and transforms per step, reduced-motion class) and a browser recording/screenshots of both directions.

## 5. Entry points

- [x] 5.1 "Training week" section in `AthleteHome` (only with `canEdit` and a macrocycle):
  - **Next week:** "Plan next week" with prefill, "Edit next week" when it is planned; none after the last week.
  - **Current week:** "Plan this week" when it is unplanned.
  - **Planned weeks:** listed with dates and edit buttons.

  Shown on the athlete details page and on "My training". Verify with component and page tests for the spec scenarios, including the linked athlete without the section.

## 6. Texts and records

- [x] 6.1 English and German texts for all new strings:
  - **Schedule picker:** days and slots.
  - **Editor:** header and stepper, catalog column, selection sheet, session labels, set group fields, coach note.
  - **Checks:** mesocycle check, totals and deviation hints.
  - **Entry points, errors and dialog.**

  Verify with the message completeness test.
- [x] 6.2 Add "Weekly schedule", "Week plan", "Set group" and "Coach note" to `openspec/glossary.md`, keeping the user's uncommitted edits. Verify the entries are in the table.
- [x] 6.3 Apply the "Domain model changes" to `openspec/domain-model.md` (schedule instead of frequency, week plan entities, notes). Verify the diagram and notes.

## 7. Integration check

- [x] 7.1 Browser check on the dev server and the Docker build, at phone and desktop width, in light and dark mode:
  - **Schedule:** set a weekly schedule in the base data.
  - **First week:** plan week 1 from "Plan next week" (schedule sessions, no exercises).
  - **Exercises:** drag and click exercises into sessions, and change a day.
  - **Values:** continue to step 2 (slide), enter the week 11 snatch example and check the colours; go back (slide back).
  - **Prefill:** plan the next week prefilled with the notes.
  - **Editing:** edit a planned week from the list.
  - **Unsaved changes:** the dialog on the back link.
  - **Duration guard:** shortening below a planned week is refused.
  - **Linked athlete:** sees no section and gets "not found" for the editor.

  Review the screenshots.

## 8. Acceptance feedback

- [x] 8.1 Exercise list: only the mesocycle's exercises with an "in the week" icon, no search and no highlight note, "Show all exercises" at the end (others greyed out, still selectable). Session cards: the day selection is the title (slot badge with several sessions); drag handles move exercises within a session and into other sessions (arrow keys on the handle); no "drag here" note. Verify with component tests (list and status, show all, handle moves within and across sessions, keyboard, title select) and the browser flow on the dev server (desktop and phone) with screenshots.
- [x] 8.2 No block check text below the stepper, no drag hint, no "not planned" text under exercises; an icon at the right of each session exercise not planned for the mesocycle. Verify with component tests (icon only for not planned exercises, texts gone) and a screenshot.
- [x] 8.3 First step "Exercises & sessions"; column titles Exercises, Sessions, Weights (moving with the columns); variation of the mesocycle's exercise in brackets after its name (domain returns the variations). Verify with component and PGlite tests and screenshots of both steps.

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: feature 9 (current week's plan view for the athlete, with feedback), then feature 5 (athlete details).
