# Tasks

## 1. Domain and API

- [x] 1.1 Add `requireViewableAthlete` (coach of the Team or linked user) and use it in `getMacrocycle` and `findMacrocycle`; all write functions keep coach-only access. Verify with PGlite tests: linked athlete reads (same content as the coach); linked athlete gets `NOT_A_COACH` (no own Team) or `ATHLETE_NOT_FOUND` (other Team) for base data, SWOT, week level, borders and exercise changes; unrelated user gets `ATHLETE_NOT_FOUND`; a user who is coach and athlete of different Teams sees both.
- [x] 1.2 Add `getExerciseWeeks(user, athleteId, exerciseNumber)` with the planned values of every week, independent of the mesocycles' chosen exercises. Verify with PGlite tests:
  - Snatch, week 11 of 21: 80 kg, 69 kg, set size 3, 20 weekly reps.
  - A high week.
  - Exercise 31: all values null.
  - `EXERCISE_NOT_FOUND`, `MACROCYCLE_NOT_FOUND`, and `ATHLETE_NOT_FOUND` for other users.
- [x] 1.3 Allow the linked athlete on `GET /api/athletes/{id}/macrocycle` and add `GET /api/athletes/{id}/macrocycle/exercises/{number}`. Verify with route tests: 200 for coach and linked athlete, 404 codes, 401 without a session, 403/404 for the linked athlete's write requests.

## 2. Chart

- [x] 2.0 Load the `dataviz` skill, then add the value colour tokens and switch the mesocycle tokens to the grey shades (light and dark mode); run the validator for the value colours against both surfaces and the grey bands, and set the curve outline accordingly. Colour the planning chart's intensity curve and week points in the best value colour. Verify the planning chart (purple intensity on grey blocks), its legend and the exercise table headers show grey blocks (component tests for the fills, screenshots in light and dark mode).

- [ ] 2.1 Move the shared chart parts out of `MacrocycleChart` into a chart frame module:
  - **Geometry:** width fit, margins, columns and `x()`.
  - **Bands and labels:** bands with label collisions.
  - **Competition:** the competition marker.
  - **Labels and tooltip:** week labels and tooltip placement.

  Verify: all existing chart tests pass unchanged.
- [ ] 2.2 Build `ExerciseChart`:
  - **Curves and axes:** four curves in the value colours on a kg axis (left) and a reps axis (right); distinct line styles and point shapes; gaps for null values.
  - **Legend:** each curve with colour, line style and unit, plus "Current week".
  - **Context:** mesocycle bands, competition marker and week-number x-axis.
  - **Tooltip:** week line, block, and the four values.
  - **Current week:** a solid line at the current week; none outside the cycle.

  Verify with component tests: curve points against both scales; curve colours; legend texts; gaps; tooltip lines; current week line on 2027-01-06 (week 6), none before the start or after the end; read-only (no handles).

## 3. View and pages

- [ ] 3.1 Build `MacrocycleView`:
  - **Order:** exercise selector (the only control above the chart), chart, focus points, base data summary, deficits with injuries and illnesses.
  - **Coach only:** "Change planning" when `editHref` is given.
  - **Back link:** depends on the role.

  Verify with component tests:
  - Order of the sections.
  - Selecting exercise 13 fetches its values and shows them, with a cache when switching back.
  - A failed fetch shows an alert and keeps the previous exercise.
  - No "Change planning" for the athlete; optional values left out; "Not entered yet" texts.
  - The spec examples, in English and German.
- [ ] 3.2 Coach page `/athletes/{id}/macrocycle`: server-loaded macrocycle, snatch values, selector list (exercises with reference values) and `today`; redirect to step 1 without a macrocycle; "not found" for other users. Verify with page tests.
- [ ] 3.3 Athlete page `/training/macrocycle`:
  - **Own macrocycle:** loaded from `roles.athlete`.
  - **Not planned yet:** "not planned yet" text.
  - **No athlete role:** redirect to `/`.

  Verify with page tests.
- [ ] 3.4 Entry points:
  - **Athlete details:** the section links to the view and keeps "Change planning".
  - **"My training":** a "Macrocycle" link card when a macrocycle exists.

  Verify with component and page tests.
- [ ] 3.5 Add English and German texts for all new strings:
  - **Chart:** selector label, axis titles, legend entries (incl. "Current week"), tooltip value lines.
  - **Sections:** focus points title and empty text, section titles, links, empty states.

  Verify with the message completeness test.

## 4. Project records

- [ ] 4.1 Add "Macrocycle view", "Exercise chart" and "Current week" to `openspec/glossary.md`, keeping the user's uncommitted glossary edits. Verify the entries are in the table.

## 5. Integration check

- [ ] 5.1 Browser check on the dev server and on the Docker build, at phone and desktop width, in light and dark mode:
  - **Coach:** opens the view from athlete details, then "Change planning" and back.
  - **Linked athlete:** opens it from "My training", read-only; their API write attempts get 404.
  - **Chart:** snatch is shown by default and switching to exercise 13 changes the curves; the current-week line is in the right week; colours match the value colours.
  - **Planning chart and exercise table:** they show grey blocks and still work.

  Review the screenshots.

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: weekly plans (features 9 and 10), then athlete details (feature 5) with the intensity and volume chart.
