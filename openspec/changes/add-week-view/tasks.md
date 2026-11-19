# Tasks

## 1. Data and domain

- [x] 1.1 Add `session_exercise.feedback` and its migration. Verify: the migration applies on the dev database and in PGlite.
- [x] 1.2 Read and keep the feedback:
  - **Read model:** week plans include `feedback`.
  - **Editor saves:** `saveWeekPlan` keeps it by weekday, slot and exercise.

  Verify with PGlite tests: the feedback survives a save with changed sets; it is gone after moving the exercise to another day or removing it; the plan payload cannot set it.
- [x] 1.3 `setFeedback` (linked user only), with the codes `NOT_THE_ATHLETE`, `ATHLETE_NOT_FOUND`, `EXERCISE_NOT_IN_WEEK` and `VALIDATION_FAILED`, trimming and clearing. Verify with PGlite tests: athlete, coach who trains themselves, coach not linked, stranger, wrong exercise, 501 characters, empty clears.
- [x] 1.4 `isoWeek(date)` and `getCurrentWeek(user, athleteId, today)`:
  - **States:** before, after, week.
  - **Week:** the plan or unplanned.
  - **Coach links:** the next week's info.

  Verify with unit tests (2027-02-08 → 6, year boundaries) and PGlite tests for all states.

## 2. API

- [x] 2.1 `PUT /api/athletes/{id}/macrocycle/weeks/{week}/plan/feedback`. Verify with route tests: 200 for the athlete, 403 for the coach, 404 codes, 400, 401 without a session; GET of the plan includes the feedback.

## 3. UI

- [x] 3.1 Shared table basics (widths and the expansion of set groups into sets) used by the editor table and the new read-only `WeekViewTable`:
  - **Columns:** exercise, kg/reps, ten sets, coach note and feedback, with fixed widths totalling 60 rem.
  - **Free text:** for exercises from 30 on.
  - **Phones:** the exercise column is sticky.

  Verify with component tests (cells, read-only, no indicator columns, free text, widths).
- [x] 3.2 Feedback field: editable for the linked user with automatic saving (600 ms, sequential, status text), plain text for others. Verify with component tests: typing saves, the status, read-only for the coach, failure shown.
- [x] 3.3 `TrainingWeekSection` as the week view:
  - **Header:** start date, calendar week, "Week x of y", block and level.
  - **Coach tools:** "Edit week" / "Plan this week", and "Plan next week" / "Edit next week".
  - **States:** "No plan for this week yet", before the start, after the end.
  - **Removed:** the list of planned weeks, and the placeholder text in `AthleteHome`.

  Verify with component tests for the spec scenarios (coach, athlete, coach who trains themselves, states).
- [x] 3.4 Page loaders: the athlete details page and "My training" load the current week, with `canEdit` and `canGiveFeedback` decided in the domain. Verify with page tests.
- [x] 3.5 Week editor step 2 shows the feedback read-only below the coach note. Verify with a component test.

## 4. Texts and records

- [x] 4.1 English and German texts:
  - **Section:** the header, the states, the coach tools and the feedback column.
  - **Feedback field:** the status texts.
  - **API errors:** the error texts.

  Verify with the message completeness test.
- [x] 4.2 Add "Feedback" (Rückmeldung) to `openspec/glossary.md`, keeping the user's uncommitted edits; apply the domain model change (`SessionExercise.feedback`) to `openspec/domain-model.md`. Verify the entries.

## 5. Integration check

- [x] 5.1 Browser check on the dev server and the Docker build, at phone and desktop width, in light and dark mode:
  - **Coach:** plans the current week; the athlete page shows the tables.
  - **Athlete:** writes feedback on "My training" (saved and kept after reload).
  - **Coach reads:** sees the feedback read-only on the athlete page and in the editor.
  - **Editor save:** changing a weight keeps the feedback.
  - **States:** unplanned week, before the start.
  - **Coach tools:** they lead to the editor.

  Review the screenshots.

## 6. Acceptance feedback

- [x] 6.1 Week view tables fit the content width on desktop (column shares, no sideways scroll); no coach note column, a note indicator after the exercise name with a hover/focus tooltip; bold lines between exercises in the week view and the editor. Verify with component tests and a browser check (scroll width equals the container, tooltip visible on hover, screenshots).
- [x] 6.2 The note tooltip shows when hovering the whole exercise name cell. Verify with a browser check (hover at the cell's corner shows the tooltip).
- [x] 6.3 Minimal exercise chart (athlete page and macrocycle view): no mesocycle colours, a thin line at each block start, no y-axis or values, one smoothed pink stroke without handles or halo, a pink gradient fading downwards; a dot only on the hovered week. Verify with component tests and screenshots (light, dark, phone).
- [x] 6.4 One week chart element (`WeekChart`) for planning, macrocycle view and athlete page, with parameters for y-axis, axis titles, legend, current week, week handles and border sliders; planning in the new style with y-axis, handles and sliders; curve continues to a main competition after the start of the last week and the chart ends there; competition label shows only the name; no mesocycle colours anywhere (bands, swatches and colour tokens removed). Verify with component tests and a browser check (drag a handle and a slider, screenshots light/dark/phone).
- [x] 6.5 "Current week" label on top of the current week's line, one row above the mesocycle and competition labels (kept inside the chart at both ends). Verify with component tests and screenshots (mid-cycle, week 1 on a phone).

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: whatever the user chooses from the feature list.
