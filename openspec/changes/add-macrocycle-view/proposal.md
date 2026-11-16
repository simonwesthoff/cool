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
- **Content, top to bottom:**
  - **Exercise chart:** for one exercise, the planned best value
    ("Bestwert") and average weight ("mHG") in kg and the set size and
    weekly reps.
    - **Axes:** one plot with a kg axis on the left and a reps axis on the
      right; the x-axis shows week numbers only.
    - **Colours:** each curve in its value colour.
    - **Legend:** names each curve with its unit, and the current week.
    - **Exercise:** the only control above the chart is the exercise picker.
      Snatch by default; any catalog exercise 1–29 can be chosen, and the
      choice is not saved.
    - **Values:** calculated for every week, also where the exercise is not
      planned in the block.
    - **Markers:** grey mesocycle bands, the main competition marker, and a
      solid line at the current week.
  - **Focus points** in their order.
  - **Base data:**
    - Historical data: personal bests, body weight, body fat and muscle
      mass if entered.
    - New macrocycle plan: period, duration, main competition, entry value,
      goals, target body weight, sessions per week.
  - **Deficits** (snatch, clean, jerk, other) and injuries and illnesses.
- **App-wide colours** (user decision):
  - **Values:** best value #6f3ab1 (also the intensity in the planning
    chart), average weight #ba2db3, set size #3bc8c8, weekly reps #d7f212.
  - **Mesocycles:** three shades of grey everywhere, replacing the palette
    colours in the planning chart, its legend and the exercise table
    headers.
- **Athlete details page:** the planned macrocycle links to the view; "Plan
  macrocycle" and "Change planning" stay.
- **Read access:** the linked athlete may read the macrocycle (page and
  `GET` API); creating and changing it stays coach-only.
- **API:** a new endpoint returns an exercise's planned values for every
  week, for the exercise chart and future apps.

Out of scope:
- The intensity and volume chart on the athlete details page (feature 5).
- Intensity curve, volume and high/low markers in this view.
- Strengths, experience and the chosen exercises in the view.
- Any editing in the view, and remembering the chosen exercise.
- Weekly plans (features 9 and 10).

## Capabilities

### New Capabilities
- `macrocycle-view`: read-only view of a planned macrocycle for the coach and
  the linked athlete: the exercise chart with exercise selection and
  current-week marker, focus points, base data, deficits and injuries, and
  the API for an exercise's weekly values.

### Modified Capabilities
- `macrocycle-planning`:
  - "One macrocycle per athlete" and "Macrocycle API" now let the linked
    athlete read the macrocycle (writes stay coach-only).
  - "Intensity chart with week handles" uses grey mesocycles and a purple
    intensity curve.
  - A new requirement fixes the colours of values and mesocycles app-wide.
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
  - Colour tokens: value colours added; mesocycle bands switched to grey
    shades, which also affects the planning chart and the exercise table.
  - Texts in English and German.
- **Data:** no schema change.
- **New domain terms:**
  - Macrocycle view: the read-only page.
  - Exercise chart: the chart of one exercise's planned values per week.
  - Current week: the week of the macrocycle that contains today.
