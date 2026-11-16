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
- A linked athlete therefore gets `ATHLETE_NOT_FOUND` on writes, the same
  answer as any other user.
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

### Colour association (app-wide)
- **Value tokens** in `globals.css`: `--value-best` #6f3ab1,
  `--value-average` #ba2db3, `--value-set-size` #3bc8c8,
  `--value-weekly-reps` #d7f212. They are the same in light and dark mode.
- **Mesocycle tokens:** `--band-1..3` become grey, with contrast to the
  surface growing towards competition preparation.
  - **Light mode:** #e4e4e7, #d4d4d8, #a1a1aa.
  - **Dark mode:** #27272a, #3f3f46, #52525b.
  - This also changes the planning chart, its legend swatches and the
    exercise table header swatches, which already use these tokens.
- **Planning chart marks:** the intensity curve and handles stay white with
  the dark halo. They are not one of the four values and remain readable on
  every grey. The `dataviz` validator checks this during implementation.
- **Value curves on grey bands:** each curve gets a 1 px outline in the
  surface's opposite (dark in light mode, light in dark mode). Lime and
  cyan need it on light greys, purple on dark greys. The validator decides
  the final outline strength.
- **Memory:** the colour rule is recorded as a user preference for all
  later screens (weekly plans, athlete details).

### Exercise chart
- **Axes:** one plot with two y-scales, as the user decided.
  - **Left axis "kg":** from a clean step below the lowest weight to a
    clean step above the highest.
  - **Right axis "Reps":** from 0 to a clean step above the highest weekly
    reps.
  - Gridlines follow the left axis only.
  - The x-axis shows week numbers (as in planning, block starts always
    numbered) and has no title.
- **Dual-axis mitigation:** the `dataviz` guidance advises against two
  y-axes; the user chose them. To keep the units apart:
  - Each curve is in its value colour (see Colour association).
  - kg curves are solid: best value with round points, average weight with
    square points.
  - Reps curves are dashed: set size with triangle points, weekly reps
    with diamond points.
  - The line style and point shape also keep purple and magenta apart for
    colour-blind readers.
  - The legend shows each line style with its marker and unit, e.g.
    "Best value (kg)".
  - Axis titles name the unit.
- **Missing values:** weeks with `null` values leave a gap in that curve.
- **Tooltip:** hovering a week shows its three planning-style lines (week
  from date, block abbreviation) plus the four values, e.g. "Best value:
  80 kg". The week hit areas are full columns, as in planning.
- **Current week:** a solid 2 px line in the text colour (black in light
  mode, white in dark mode) at the current week's x, the same position as
  that week's points. It appears in the legend as "Current week".
  - It differs from the dashed competition line and the thin grey block
    borders.
  - `today` (YYYY-MM-DD, UTC, from `today()`) is passed in from the
    server, so tests can fix the date.
  - Before the start and after the end there is no line.
- **Above the chart:** only the exercise selector (native `select` with
  "1 Snatch" style entries).

### Summary sections below the chart
- **Focus points:** an ordered list; "No focus points entered yet" if the
  list is empty.
- **Base data:** definition lists with the planning step 1 section titles
  ("Historical data", "New macrocycle plan"). Body fat and muscle mass are
  left out when empty. The end date is start + 7 × weeks − 1.
- **Deficits:** a box like the deficits above the exercise table, followed
  by injuries and illnesses. Empty texts read "Not entered yet".

## Risks / Trade-offs

- [Purple and magenta are close for colour-vision deficiencies, and lime
  and cyan are light on light greys] → Line style and point shape per
  curve, outlines on the curves, and a validator run on both surfaces.
- [Two y-axes invite misreading kg against reps] → Distinct line styles
  and markers per unit, unit names in the legend and axis titles, and
  values in the tooltip. The user chose this layout over stacked plots.
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
