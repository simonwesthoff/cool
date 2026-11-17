# Design

## Context

- **Planning pages:** they live under `/athletes/{id}/macrocycle/{step}`.
  `loadPlanning` requires the coach and turns `not_found` into the "not
  found" page. There is no page at `/athletes/{id}/macrocycle` itself.
- **Domain access:** `getMacrocycle` / `findMacrocycle` use
  `requireOwnAthlete` (coach only; everyone else gets
  `ATHLETE_NOT_FOUND`).
- **Athlete role:** `getRoles` returns the linked Athlete (`athleteId`).
  `/training` is a placeholder. A user can be the coach of a Team and the
  athlete of an Athlete at the same time.
- **Calculation:** the pure module already computes an exercise's planned
  best value, average weight, set size and weekly reps per week
  (`plannedExercise` with goals, entry value, cycle progress and week
  level). `getMacrocycle` uses it only for the exercises of each week's
  mesocycle.
- **Planning chart:** `MacrocycleChart` has the mesocycle bands and labels
  with collision handling, the competition marker, the tooltip placement
  and the fit to the container width.

## Goals / Non-Goals

**Goals:**
- One view component for both the coach and the athlete page.
- All values come from the domain layer; the client only displays them.

**Non-Goals:**
- No new chart library.
- No caching beyond the page's own state.
- The planning chart's behaviour stays unchanged.

## Decisions

### Read access in the domain layer
- A new `requireViewableAthlete` lets the user through if they are the
  coach of the athlete's Team or linked to that Athlete; otherwise
  `ATHLETE_NOT_FOUND`.
- `getMacrocycle`, `findMacrocycle` and the new exercise values function
  use it. All write functions keep `requireOwnAthlete`.
- A linked athlete therefore gets the existing write answers: 403
  `NOT_A_COACH` without a Team of their own, 404 `ATHLETE_NOT_FOUND` with
  another Team.
- Alternative considered: separate athlete-only read functions. Rejected:
  two read paths for the same data.

### Exercise values per week
- New `getExerciseWeeks(user, athleteId, exerciseNumber)` returns
  `{ exerciseNumber, weeks: [{ number, bestKg, averageKg, setSize, weeklyReps }] }`
  for all weeks of the cycle. It calls `plannedExercise` with the week's
  level, independent of the mesocycle's chosen exercises.
- Unknown numbers give `EXERCISE_NOT_FOUND`. Exercises without catalog
  values give `null` values, as in the calculation spec.
- API: `GET /api/athletes/{id}/macrocycle/exercises/{number}`. Under
  `…/macrocycle/` it is nested next to the planning endpoints, but it is
  read-only and not tied to a mesocycle.
- **Selector list:** the catalog exercises that have a best value and
  reps-per-week values. Today that is exactly 1–29, and filtering by
  values keeps the rule right if the catalog changes.

### Pages and data flow
- **Coach page:** `/athletes/{id}/macrocycle`. **Athlete page:**
  `/training/macrocycle`, using `roles.athlete.athleteId`.
- Both pages load, on the server, the macrocycle, the snatch values
  (exercise 1), the selector list and `today`. They render the client
  component `MacrocycleView`. Only the coach page passes `editHref` (shows
  "Change planning").
- **Without a macrocycle:** the coach page redirects to step 1; the
  athlete page shows "Your coach has not planned a macrocycle yet".
- **Changing the exercise:** fetches the values from the API and keeps
  them per exercise in state, so switching back is instant. While loading,
  the previous curves stay dimmed. On failure an alert appears and the
  previous exercise stays selected.
- **Entry points:**
  - The athlete details section becomes a link card to the view;
    "Change planning" stays as a separate link.
  - "My training" gets a "Macrocycle" link card when a macrocycle exists.

### Shared chart frame
- The parts both charts need move from `MacrocycleChart` into a shared
  module, so the exercise chart does not copy them:
  - **Geometry:** container width measurement, margins, columns and `x()`.
  - **Bands and labels:** mesocycle bands with label collision rules.
  - **Competition:** the competition marker and its label.
  - **Labels and tooltip:** week labels and the tooltip placement.
- `MacrocycleChart` keeps its behaviour; its tests must stay green
  unchanged.

### Mesocycle colours (app-wide, changed during acceptance)
- The user withdrew the value-colour association and the grey mesocycles.
  The mesocycles get palette colours everywhere: `--band-1` #6f3ab1 (GPB),
  `--band-2` #ba2db3 (SPB), `--band-3` #d7f212 (CPB), the same in light and
  dark mode. Cyan #3bc8c8 stays in the palette, unused for now.
- **Marks on the bands:** curves and points are white with the dark chart
  halo, as before the colour change. That keeps them readable on dark purple
  and on light lime alike. The planning chart's intensity curve returns to
  this style; the value tokens are removed.
- **Lines:** the competition line, current-week line, block borders and
  gridlines use the neutral chart ink (`--chart-ink`).

### Exercise chart (changed during acceptance)
- **One value, one curve, one y-axis:** the chart draws only the selected
  value, on its own scale with a unit title ("kg" or "Reps").
  - **kg:** from a clean step below the lowest value to one above the
    highest.
  - **Reps:** from 0.
  - This also follows the `dataviz` "one axis" rule.
- **Selections above the chart:** two native `select`s in one row (wrapping
  on phones):
  - **"Exercise":** entries like "1 Snatch".
  - **"Value":** best value (kg), average weight (kg), set size, weekly
    reps.
  - **Data:** switching the value needs no request, since the API returns
    all four values per week; switching the exercise fetches as before.
- **Legend:** the mesocycles, the main competition and the current week.
  The single curve needs no legend entry; the "Value" selection names it.
- **Missing values:** weeks with `null` leave a gap in the curve.
- **Tooltip:** week from date, block abbreviation, and the selected value
  (e.g. "Best value: 80 kg").
- **Current week:** a solid 2 px line in the chart ink at the current
  week's x; "Current week" in the legend; no line outside the cycle.
  `today` is passed in from the server.
- **Width:** the view's `main` uses `max-w-5xl` like the intensity step, so
  the chart has the same width on desktop.

### Summary sections below the chart
- **Focus points:** an ordered list; "No focus points entered yet" if the
  list is empty.
- **New macrocycle plan:** a definition list with that title. The end date
  is start + 7 × weeks − 1.
- Historical data, deficits and injuries are not shown (user decision).

## Risks / Trade-offs

- [Purple and magenta mesocycles are close for colour-vision deficiencies]
  → The blocks are also told apart by their labels, border lines and the
  legend.
- [Values in weeks where the exercise is not planned could be taken as
  planned] → The mesocycle bands show the blocks. This matches the user's
  decision that the chart shows the exercise across the whole cycle.
- [Refactoring the planning chart into a shared frame could change its
  behaviour] → The existing chart tests run unchanged, plus the planning
  browser check.
- [`today` in UTC can be one day off around midnight in Central Europe] →
  It only affects the marker on Mondays around midnight; acceptable until
  user time zones exist.

## Migration Plan

No schema change and no migration. Rollback is a code revert.
