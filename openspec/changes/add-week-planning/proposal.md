# Proposal

## Why

A macrocycle so far ends at planned weekly values per exercise; the coach
cannot yet write down what the athlete actually does in a week. Feature 10
adds the week plan: training sessions with exercises and their sets,
checked against the macrocycle planning, so the coach sees at a glance
whether a week fits the plan.

## What Changes

- **Week editor** for any week of the macrocycle (planned, ongoing or
  future), coach only (user decision). Main use: planning the next week.
  - **Sessions:** the coach chooses weekdays (Mon–Sun) and up to three
    training sessions per day, shown as "Monday" or "Monday 1 / Monday 2"
    (user decision).
  - **Exercises:** each session gets exercises from the exercise catalog.
    The exercises chosen for the week's mesocycle come first in the list.
  - **Set groups:** each exercise has one or more set groups "sets × reps
    @ weight", e.g. 3 × 2 @ 80 kg, to allow ramping up (user decision).
  - **Coach note:** an optional coach note per exercise.
- **Check against the macrocycle planning:**
  - **Block exercises:** the editor shows which exercises chosen for the
    week's mesocycle are missing from the week, and which exercises on the
    week are not chosen for that mesocycle.
  - **Projection:** for every exercise of the week, the editor shows the
    week's projection from the macrocycle planning next to the week's
    actual values: best value vs heaviest weight, average weight vs mHG,
    set size vs average reps per set, and weekly reps.
  - **Deviation colours:** a value more than 5 % above the projection is red
    with ↑, more than 5 % below is blue with ↓, always with the projected
    value next to it (user decision).
- **Entry points** on the athlete page, for whoever may plan, in a new
  "Training week" section below the macrocycle chart (user decision):
  - **Plan next week:** opens the week after the current one (week 1 before
    the start). It is prefilled with the previous week's sessions,
    exercises and set groups when that week is planned; otherwise it starts
    empty (user decision). If that week is already planned, the button
    reads "Edit next week".
  - **Current week:** an unplanned current week offers "Plan this week",
    prefilled the same way.
  - **Planned weeks:** listed with their dates and an edit button.
- **Saving:** "Save" stores the whole week. Saving a week without sessions
  makes it unplanned again. Leaving the editor with unsaved changes asks
  "Save changes?" (Save, Discard, Cancel), as in the planning steps.
- **Duration guard:** shortening the macrocycle is refused while weeks that
  would be removed have a week plan.
- **API:** read, save and list week plans. The linked athlete can read
  them; only the coach of the Team can write.

New domain terms:
- **Week plan** (Wochenplan)
- **Set group** (Satzgruppe)
- **Coach note** (Trainerhinweis)

Out of scope:
- The athlete's view of the current week and their feedback (feature 9).
- The current-week section with a concise plan on the athlete page
  (feature 5). This change adds only the entry points.
- Copying a week other than the previous one, templates, and moving or
  duplicating sessions.
- Per-athlete adjustments of catalog values.

## Capabilities

### New Capabilities

- `week-planning`: week plans of a macrocycle (sessions, exercises, set
  groups, coach notes), the week editor with the checks against the
  macrocycle planning, prefill from the previous week, access and API.

### Modified Capabilities

- `athlete-details`: adds the "Training week" entry points on the athlete
  page.
- `macrocycle-planning`: "Macrocycle base data" refuses a duration that
  would remove planned weeks.

## Impact

- **Database:** new tables for week plans, sessions, session exercises and
  set groups (migration).
- **Domain:**
  - **Week plans:** a new module to read, save and list them, with access
    rules.
  - **Aggregation:** pure functions for the week's actual values and the
    deviation check, reusing `plannedExercise`.
  - **Duration guard:** a check in the macrocycle domain.
- **API:** `GET`/`PUT /api/athletes/{id}/macrocycle/weeks/{week}/plan` and
  `GET /api/athletes/{id}/macrocycle/weeks/plans`.
- **UI:**
  - **Week editor:** a new page `/athletes/{id}/macrocycle/weeks/{week}`.
  - **Athlete page:** the "Training week" section in `AthleteHome`.
- **Messages:** English and German texts; glossary entries for the new
  terms.
