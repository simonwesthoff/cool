# Tasks

## 1. Data and domain

- [ ] 1.1 Add the tables `week_plan`, `training_session`, `session_exercise` and `set_group` with their keys, uniqueness and cascades, and generate the migration. Verify: `npm run db:migrate` on the dev database and the PGlite test setup apply it; the schema test lists the tables.
- [ ] 1.2 Add `week-plan/calculation.ts`:
  - **Actual values:** heaviest weight, mHG, set size and weekly reps per exercise over all sessions.
  - **Deviation:** `deviation(actual, projected)` with the strict 5 % band.

  Verify with unit tests: the spec's week 11 snatch example (80 kg, 69.5 kg, set size 2, 20 reps; set size below, the rest within), 85 kg above, 72.45 vs 69 within, set groups without weight, and null projections.
- [ ] 1.3 Add the week plan domain:
  - **Read:** `getWeekPlan(user, athleteId, week)` (coach and linked athlete), with the mesocycle check (missing and not-planned exercises).
  - **List:** `listWeekPlans` with the numbers and start dates of the planned weeks.
  - **Save:** `saveWeekPlan` (coach only), which validates and replaces the week; an empty body deletes the plan.
  - **Errors:** `WEEK_NOT_FOUND` and `ATHLETE_NOT_FOUND`.
  - **Prefill:** `prefillFromPreviousWeek`, a copy of week−1 without notes.

  Verify with PGlite tests: save and read back with order kept; validation codes for sets 0 and a weight of 82.3 kg; duplicate exercise in a session; more than 14 sessions; an empty save deletes; week 22 of 21; linked-athlete read and refused write; stranger; mesocycle check with the spec example; prefill with and without a previous plan.
- [ ] 1.4 Duration guard: `updateBaseData` refuses a duration below the highest planned week with `WEEKS_PLANNED` on `durationWeeks`. Verify with a PGlite test (21 weeks with week 20 planned → 18 is refused, 20 is allowed) and the base data form showing the message.

## 2. API

- [ ] 2.1 Add the routes:
  - **Week plan:** `GET`/`PUT /api/athletes/{id}/macrocycle/weeks/{week}/plan`.
  - **List:** `GET /api/athletes/{id}/macrocycle/weeks/plans`.

  Verify with route tests: 200 for coach and linked athlete on GET, 200/400 on PUT, 404 codes, 401 without a session, and the linked athlete's PUT refused.

## 3. Week editor

- [ ] 3.1 Page `/athletes/{id}/macrocycle/weeks/{week}` (coach only):
  - **Loads:** the macrocycle, the week's projections for all catalog exercises, the stored plan or the prefill with `?prefill=previous`, and the catalog list.
  - **Back link:** to the athlete page.

  Verify with page tests: stored plan, prefill only when unplanned, "not found" for other users and the linked athlete, and a week outside the macrocycle.
- [ ] 3.2 Client editor:
  - **Header:** "Week x of y", dates, mesocycle and level.
  - **Sessions:** weekday and number (labels "Monday" / "Monday 1").
  - **Exercises:** an exercise picker with the mesocycle's exercises first, then the catalog; add, remove and reorder.
  - **Set groups:** "sets × reps @ kg" with add and remove.
  - **Coach note:** per exercise.
  - **Saving:** "Save" with field errors.

  Verify with component tests: build the spec's week, save the payload, remove all sessions, field errors, and German labels.
- [ ] 3.3 Checks in the editor:
  - **Mesocycle check:** missing and not-planned exercises.
  - **Projection table:** projection vs actual values per exercise, with red ↑ / blue ↓ and the projected value.

  Verify with component tests using the spec examples, and that values without a projection are not compared.
- [ ] 3.4 Unsaved changes: the editor registers the guard; the back link asks "Save changes?" like the stepper (Save, Discard, Cancel). Verify with component tests for all three choices and no dialog without changes.

## 4. Entry points

- [ ] 4.1 "Training week" section in `AthleteHome` (only with `canEdit` and a macrocycle):
  - **Next week:** "Plan next week" with prefill, or "Edit next week" when it is planned; no button after the last week.
  - **Current week:** "Plan this week" when it is unplanned.
  - **Planned weeks:** listed with dates and edit buttons.

  Loaded on the athlete details page and on "My training". Verify with component and page tests for the spec scenarios, including the linked athlete without the section.

## 5. Texts and records

- [ ] 5.1 English and German texts for all new strings:
  - **Editor:** header, weekdays, session labels, set group fields, coach note.
  - **Checks:** mesocycle check, projection table and deviation hints.
  - **Entry points and dialog:** entry points, errors and the dialog.

  Verify with the message completeness test.
- [ ] 5.2 Add "Week plan", "Set group" and "Coach note" to `openspec/glossary.md`, keeping the user's uncommitted edits. Verify the entries are in the table.
- [ ] 5.3 Apply the "Domain model changes" to `openspec/domain-model.md` (current model and notes). Verify the diagram contains WeekPlan, TrainingSession, SessionExercise and SetGroup.

## 6. Integration check

- [ ] 6.1 Browser check on the dev server and the Docker build, at phone and desktop width, in light and dark mode:
  - **First week:** plan it empty from "Plan next week".
  - **Snatch example:** build the week 11 example and check the colours.
  - **Prefill:** plan the following week prefilled.
  - **Editing:** edit a planned week from the list.
  - **Unsaved changes:** the dialog on the back link.
  - **Duration guard:** shortening below a planned week is refused.
  - **Linked athlete:** sees no section and gets "not found" for the editor.

  Review the screenshots.

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: feature 9 (current week's plan view for the athlete, with feedback), then feature 5 (athlete details).
