# Proposal

## Why

Once a macrocycle is planned, the coach and the athlete need to see what it
means for the training: how the planned weights and reps of an exercise
develop week by week, what the cycle focuses on, and where it starts from.
Today the macrocycle can only be seen inside the planning steps, and the
athlete cannot see it at all.

## What Changes

- **Coach access:** a new read-only macrocycle view at the athlete's
  macrocycle (`/athletes/{id}/macrocycle`), with "Change planning" (to
  step 1) and a way back to the athlete details page.
- **Athlete access:** the same view, read-only, for the athlete linked to
  the Athlete, reached from "My training".
- **Content, top to bottom** (as wide as the intensity step in planning):
  - **Exercise chart:** one planned value of one exercise per week, as a
    single curve on one y-axis with its unit.
    - **Selections above the chart:** the exercise (catalog exercises 1–29,
      snatch by default) and the value (best value by default, average
      weight, set size, weekly reps). The choices are not saved.
    - **Values:** calculated for every week, also where the exercise is not
      planned in the block.
    - **x-axis:** week numbers only.
    - **Markers:** mesocycle bands in their colours, the main competition
      marker, and a solid line at the current week.
  - **Focus points** in their order.
  - **New macrocycle plan:** period, duration, main competition, entry
    value, goals, target body weight, sessions per week.
- **App-wide mesocycle colours** (user decision): general preparation
  #6f3ab1, special preparation #ba2db3, competition preparation #d7f212,
  in the planning chart, the exercise table and the view.
- **Athlete details page:** the planned macrocycle links to the view; "Plan
  macrocycle" and "Change planning" stay.
- **Read access:** the linked athlete may read the macrocycle (page and
  `GET` API); creating and changing it stays coach-only.
- **API:** a new endpoint returns an exercise's planned values for every
  week, for the exercise chart and future apps.

Out of scope:
- The intensity and volume chart on the athlete details page (feature 5).
- Intensity curve, volume and high/low markers in this view.
- Historical data, strengths, deficits, experience, injuries and the
  chosen exercises in the view.
- Any editing in the view, and remembering the chosen exercise.
- Weekly plans (features 9 and 10).

## Capabilities

### New Capabilities
- `macrocycle-view`: read-only view of a planned macrocycle for the coach and
  the linked athlete: the exercise chart with exercise selection and
  current-week marker, focus points and the new macrocycle plan, and the API
  for an exercise's weekly values.

### Modified Capabilities
- `macrocycle-planning`:
  - "One macrocycle per athlete" and "Macrocycle API" now let the linked
    athlete read the macrocycle (writes stay coach-only).
  - "Intensity chart with week handles" uses the new mesocycle colours.
  - A new requirement fixes the mesocycle colours app-wide.
- `athlete-details`: "Macrocycle entry point" links a planned macrocycle to
  the new view.
- `user-roles`: "Athlete view" links to the athlete's macrocycle view.

## Impact

- **Domain:**
  - Read access for the linked athlete.
  - A new function returning an exercise's planned values per week, using
    the existing calculation module.
- **API:**
  - `GET /api/athletes/{id}/macrocycle` also answers the linked athlete.
  - New: `GET /api/athletes/{id}/macrocycle/exercises/{number}`.
  - The write endpoints are unchanged.
- **Pages:**
  - New: `/athletes/{id}/macrocycle` (coach) and `/training/macrocycle`
    (athlete).
  - Changed: the athlete details macrocycle section and the "My training"
    page.
- **Components:**
  - New: exercise chart (reusing the mesocycle bands, competition marker
    and width fitting of the macrocycle chart) and a base data summary.
  - Colour tokens: mesocycle bands #6f3ab1 / #ba2db3 / #d7f212, which also
    affects the planning chart and the exercise table.
  - Texts in English and German.
- **Data:** no schema change.
- **New domain terms:**
  - Macrocycle view: the read-only page.
  - Exercise chart: the chart of one planned value of one exercise per week.
  - Current week: the week of the macrocycle that contains today.
