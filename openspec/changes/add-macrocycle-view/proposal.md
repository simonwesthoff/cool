# Proposal

## Why

Once a macrocycle is planned, the coach and the athlete need to see it at a
glance: the athlete's starting point, the plan towards the main competition,
and how intensity and volume develop week by week. Today the macrocycle can
only be seen inside the planning steps, and the athlete cannot see it at all.

## What Changes

- New read-only macrocycle view for the coach, at the athlete's macrocycle
  (`/athletes/{id}/macrocycle`), with "Change planning" (to step 1) and back
  to the athlete details page.
- The same view, read-only, for the athlete linked to the Athlete, reached
  from "My training".
- Content of the view:
  - Base data, in the planning step 1 sections:
    - Historical data: personal bests, body weight, body fat and muscle mass
      if entered.
    - New macrocycle plan: period, duration, main competition, entry value,
      goals, target body weight, sessions per week.
  - Deficits (snatch, clean, jerk, other) and injuries and illnesses, as
    listed in feature 7.
  - The macrocycle chart, not editable:
    - Intensity curve with week levels (▲/▼) on the mesocycle bands, with the
      main competition marker and tooltips as in planning.
    - The volume per week as bars below the intensity, on the same week axis
      (two parts of one chart, each with its own scale; no second y-axis in
      one plot).
    - A marker for the current week, with "Week n of N" above the chart.
- The athlete details page links the planned macrocycle to the view; "Plan
  macrocycle" and "Change planning" stay.
- Reading the macrocycle (page and `GET` API) is allowed for the linked
  athlete too; creating and changing it stays coach-only.

Out of scope:
- The macrocycle chart section on the athlete details page (feature 5).
- Strengths, experience, focus points and the chosen exercises in the view
  (not requested for now).
- Any editing in the view.
- Weekly plans (features 9 and 10).

## Capabilities

### New Capabilities
- `macrocycle-view`: read-only view of a planned macrocycle (base data,
  deficits, injuries, chart with intensity, volume and current-week marker)
  for the coach and the linked athlete.

### Modified Capabilities
- `macrocycle-planning`: "One macrocycle per athlete" and "Macrocycle API" now
  let the linked athlete read the macrocycle (writes stay coach-only).
- `athlete-details`: "Macrocycle entry point" links a planned macrocycle to
  the new view.
- `user-roles`: "Athlete view" links to the athlete's macrocycle view.

## Impact

- **Domain:** read access for the linked athlete (`getMacrocycle` accepts
  the coach of the Team or the athlete linked to the Athlete).
- **API:** `GET /api/athletes/{id}/macrocycle` also answers the linked athlete;
  write endpoints are unchanged.
- **Pages:**
  - New: `/athletes/{id}/macrocycle` (coach) and `/training/macrocycle`
    (athlete).
  - Changed: the athlete details macrocycle section and the "My training"
    page.
- **Components:**
  - Macrocycle chart: optional volume part and current-week marker; reused
    read-only.
  - New: base data summary.
  - Texts in English and German.
- **Data:** no schema change.
- **New domain terms:**
  - Macrocycle view: the read-only page.
  - Current week: the week of the macrocycle that contains today.
