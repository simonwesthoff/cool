# Design

## Context

- **Planning pages:** they live under `/athletes/{id}/macrocycle/{step}`.
  `loadPlanning` requires the coach (`requireCoachPage`) and turns
  `not_found` into the "not found" page. There is no page at
  `/athletes/{id}/macrocycle` itself yet.
- **Domain access:** `getMacrocycle` / `findMacrocycle` call
  `requireOwnAthlete`, so only the coach of the athlete's Team gets
  through. Everyone else gets `ATHLETE_NOT_FOUND`.
- **Athlete role:** `getRoles` returns the linked Athlete (`athleteId`,
  names) for the athlete role. The athlete's page `/training` is a
  placeholder. A user can be the coach of a Team and the athlete of an
  Athlete at the same time.
- **Chart:** `MacrocycleChart` already works read-only when
  `onLevelChange` and `onBordersChange` are left out. It has the mesocycle
  bands and labels, the main competition marker, the week tooltip and the
  fit to the container width.
- **Data:** the week view already carries `volume` (sum of the weekly
  reps; `null` without exercises).

## Goals / Non-Goals

**Goals:**
- One view component, used by the coach and the athlete pages.
- Read access through the domain layer, so the API and future native apps
  get the same rule.

**Non-Goals:**
- No caching or real-time updates; the page reads the macrocycle per
  request like the planning pages.
- No new chart library.

## Decisions

### Read access in the domain layer
- `getMacrocycle(user, athleteId)` and `findMacrocycle` use a new
  `requireViewableAthlete`. It lets the user through if they are the coach
  of the athlete's Team or linked to that Athlete; otherwise
  `ATHLETE_NOT_FOUND`, as today.
- All write functions keep `requireOwnAthlete` (coach only). A linked
  athlete calling them therefore gets `ATHLETE_NOT_FOUND`, the same answer
  as any other user. This is consistent with the existing "not found for
  others" rule and reveals nothing.
- Alternative considered: a separate `getOwnMacrocycle(user)` for athletes.
  Rejected: two read paths for the same data, and the API would need a
  second endpoint.

### Pages and routes
- **Coach:** `/athletes/{id}/macrocycle` (new `page.tsx` next to the step
  folders). It loads through a `loadView` helper: `requireCurrentUser`
  page variant plus `getAthlete` for the coach header data. Without a
  macrocycle it redirects to `/base-data`.
- **Athlete:** `/training/macrocycle`. It uses `roles.athlete.athleteId`
  and `findMacrocycle`. Without a macrocycle it shows "Your coach has not
  planned a macrocycle yet"; without the athlete role it redirects to `/`.
- **Shared component:** both pages render `MacrocycleView` (client
  component). The coach page passes `editHref`, which shows "Change
  planning"; the athlete page does not pass it. Back links: the coach gets
  "Back to the athlete", the athlete gets "Back to My training".
- **Athlete details:** the planned-state section becomes a link card to
  the view (period and competition as now). "Change planning" stays as a
  separate link.
- **"My training":** gets a "Macrocycle" link card when a macrocycle
  exists.
- Alternative considered: one route `/athletes/{id}/macrocycle` for both
  roles. Rejected: athletes navigate under `/training` (bottom tab "My
  training"), and coaches would see athlete navigation in their tab bar.

### Base data summary
- `MacrocycleSummary`: definition lists (`dl`) with the same section titles
  as planning step 1: "Historical data" and "New macrocycle plan".
- A third box holds the deficits and the injuries and illnesses, styled
  like the deficits above the exercise table (bold title, text).
- Optional values (body fat, muscle mass) are left out when empty. Empty
  SWOT texts read "Not entered yet".
- **Formatting:** dates use `dateStyle: "medium"`. Weights and the entry
  value use the existing number and percent formatting.
- **End date:** start + 7 × weeks − 1 (the Sunday of the last week).

### Volume part of the chart
- `MacrocycleChart` gets an optional `showVolume` prop. With it, the same
  SVG gets a second plot below the x-axis week numbers:
  - **Size and scale:** 96 px high, with its own y-scale (0 to the largest
    weekly volume, rounded up to a clean step) and the axis title
    "Volume".
  - **Bars:** one bar per week starting at the week's x (like the points),
    `column − 2` px wide (2 px surface gap), with 4 px rounded tops.
  - **Colour:** neutral zinc (as the old planning bars). The palette
    colours stay reserved for the mesocycles.
  - **Gridlines:** the same recessive gridlines as the intensity plot.
- Weeks with `volume === null` get no bar. If no week has a volume, the
  plot shows the text "No exercises chosen yet" instead of bars.
- **Tooltip:** the week hit areas cover both plots. The tooltip stays the
  three-line planning tooltip (the user removed the volume from it). The
  volume can be read from the bar and the axis.
- This follows the `dataviz` rule "no dual axis": two stacked plots on one
  week axis, each with its own scale. The planning chart keeps
  `showVolume` off.

### Current week marker
- **Today:** the server passes `today` (YYYY-MM-DD, UTC, from the existing
  `today()`) to the view, so tests can fix the date.
- **Week number:** week n = floor(days since start / 7) + 1, valid for
  1 ≤ n ≤ N.
- **Chart marker:** a light column highlight (white at 20 % over the band)
  for that week's column across both plots, plus a small "Now" label in the
  label row above the plot. Mesocycle labels it would overlap give way, as
  for the competition label. When the competition label and "Now" would
  overlap, "Now" moves to the other side of its column.
- **Text above the chart:** "Week n of N". Before the start: "Starts on
  <date>". After the end: "Ended on <date>". In both cases the chart has no
  marker.
- Alternative considered: a solid vertical line. Rejected: it competes
  with the dashed competition line and the white mesocycle borders, and a
  column highlight reads as "this week".

## Risks / Trade-offs

- [Linked athletes now read the full macrocycle, including the coach's
  reasons for the exercises] → Wanted for transparency, and it is the
  athlete's own plan. The view itself does not show exercises yet.
- [`today` in UTC can be one day off around midnight in Central Europe] →
  It only matters on Mondays around midnight for the marker; acceptable.
  This is a known limitation until user time zones exist.
- [The chart gets taller on phones] → The volume plot is 96 px; the whole
  chart stays within one phone screen height.

## Migration Plan

No schema change and no migration. Rollback is a code revert.
