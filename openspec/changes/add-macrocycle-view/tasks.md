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

- [x] 2.1 Move the shared chart parts out of `MacrocycleChart` into a chart frame module:
  - **Geometry:** width fit, margins, columns and `x()`.
  - **Bands and labels:** bands with label collisions.
  - **Competition:** the competition marker.
  - **Labels and tooltip:** week labels and tooltip placement.

  Verify: all existing chart tests pass unchanged.
- [x] 2.2 Build `ExerciseChart`:
  - **Curves and axes:** four curves in the value colours on a kg axis (left) and a reps axis (right); distinct line styles and point shapes; gaps for null values.
  - **Legend:** each curve with colour, line style and unit, plus "Current week".
  - **Context:** mesocycle bands, competition marker and week-number x-axis.
  - **Tooltip:** week line, block, and the four values.
  - **Current week:** a solid line at the current week; none outside the cycle.

  Verify with component tests: curve points against both scales; curve colours; legend texts; gaps; tooltip lines; current week line on 2027-01-06 (week 6), none before the start or after the end; read-only (no handles).

## 3. View and pages

- [x] 3.1 Build `MacrocycleView`:
  - **Order:** exercise selector (the only control above the chart), chart, focus points, base data summary, deficits with injuries and illnesses.
  - **Coach only:** "Change planning" when `editHref` is given.
  - **Back link:** depends on the role.

  Verify with component tests:
  - Order of the sections.
  - Selecting exercise 13 fetches its values and shows them, with a cache when switching back.
  - A failed fetch shows an alert and keeps the previous exercise.
  - No "Change planning" for the athlete; optional values left out; "Not entered yet" texts.
  - The spec examples, in English and German.
- [x] 3.2 Coach page `/athletes/{id}/macrocycle`: server-loaded macrocycle, snatch values, selector list (exercises with reference values) and `today`; redirect to step 1 without a macrocycle; "not found" for other users. Verify with page tests.
- [x] 3.3 Athlete page `/training/macrocycle`:
  - **Own macrocycle:** loaded from `roles.athlete`.
  - **Not planned yet:** "not planned yet" text.
  - **No athlete role:** redirect to `/`.

  Verify with page tests.
- [x] 3.4 Entry points:
  - **Athlete details:** the section links to the view and keeps "Change planning".
  - **"My training":** a "Macrocycle" link card when a macrocycle exists.

  Verify with component and page tests.
- [x] 3.5 Add English and German texts for all new strings:
  - **Chart:** selector label, axis titles, legend entries (incl. "Current week"), tooltip value lines.
  - **Sections:** focus points title and empty text, section titles, links, empty states.

  Verify with the message completeness test.

## 4. Project records

- [x] 4.1 Add "Macrocycle view", "Exercise chart" and "Current week" to `openspec/glossary.md`, keeping the user's uncommitted glossary edits. Verify the entries are in the table.

## 5. Integration check

- [x] 5.1 Browser check on the dev server and on the Docker build, at phone and desktop width, in light and dark mode:
  - **Coach:** opens the view from athlete details, then "Change planning" and back.
  - **Linked athlete:** opens it from "My training", read-only; their API write attempts get 404.
  - **Chart:** snatch is shown by default and switching to exercise 13 changes the curves; the current-week line is in the right week; colours match the value colours.
  - **Planning chart and exercise table:** they show grey blocks and still work.

  Review the screenshots.

## 6. Acceptance feedback

- [x] 6.1 Mesocycle colours back to the palette: GPB #6f3ab1, SPB #ba2db3, CPB #d7f212 (light and dark); remove the value colour tokens; planning chart intensity curve and points back to white with the dark halo; competition and current-week lines in the chart ink. Verify: component tests (band fills, curve style), planning and exercise table screenshots in light and dark mode.
- [x] 6.2 Exercise chart with one curve and one y-axis:
  - **Selections:** a "Value" select next to the exercise select (best value by default); switching the value needs no request.
  - **Legend and tooltip:** the legend has blocks, competition and current week; the tooltip shows week, block and the selected value.

  Verify with component tests: the curve and axis per value; kg vs reps axis; defaults; no request for a value switch; the current week line.
- [x] 6.3 View layout: as wide as the intensity step (`max-w-5xl`); below the chart only the focus points and the new macrocycle plan. Verify with component tests (sections, no historical data, deficits or injuries) and English and German texts.
- [x] 6.4 Browser check on the dev server and Docker (coach and athlete, phone and desktop, light and dark), screenshots reviewed; update the memory with the colour rule.
- [x] 6.5 One athlete page for both sides: the athlete details page uses the "My training" component (`AthleteHome`): picture, name and coach on top, then the macrocycle card (period and competition). The coach also gets the back link, "Plan macrocycle" without a macrocycle, and "Basic data"; "Change planning" stays in the macrocycle view. Verify with component and page tests and screenshots (coach and athlete, phone dark, desktop light).

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: weekly plans (features 9 and 10), then athlete details (feature 5) with the intensity and volume chart.
