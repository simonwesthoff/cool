# Proposal

## Why

A macrocycle so far ends at planned weekly values per exercise; the coach
cannot yet write down what the athlete actually does in a week. Feature 10
adds the week plan: training sessions with exercises and their sets,
checked against the macrocycle planning, so the coach sees at a glance
whether a week fits the plan.

## What Changes

- **Weekly schedule in the macrocycle planning** (user decision): step 1
  no longer asks for a number of sessions per week. Instead it shows a
  week (Monday–Sunday) in which the coach picks up to three training
  sessions per day, 1–14 per week. The training frequency is the number of
  these sessions. Every new week plan starts with this schedule.
- **Week editor** for any week of the macrocycle (planned, ongoing or
  future), coach only, in two steps on one page with a stepper on top
  (user decision):
  - **Step 1 – sessions and exercises:** on desktop, the exercise list
    is on the left and the week's sessions on the right.
    - **Exercise list:** only the exercises chosen for the week's
      mesocycle, each with an icon for whether it is in the week yet.
      "Show all exercises" adds the rest of the catalog, greyed out but
      selectable (user decision).
    - **Adding exercises:** exercises are dragged onto a session, or
      added by clicking into a session, which opens the exercise
      selection.
    - **Sessions:** each session's title is its day selection, with the
      slot when a day has several sessions. Drag handles move exercises
      within the week (user decision), and more sessions can be added or
      removed.
    - **On phones:** the catalog column is hidden, and clicking into a
      session opens the selection with the same highlighting.
    - **Next:** "Continue" or the stepper leads to step 2.
  - **Step 2 – values:** the sessions column shows only day, slot and
    exercises, and a third column holds the set groups ("sets × reps @
    weight", one or more per exercise) and the coach notes. The deviation
    indicators appear only in this step: per exercise, the week's heaviest
    weight, mHG, set size and weekly reps next to the projection. Values
    more than 5 % above are red ↑, more than 5 % below are blue ↓, always
    with the projected value (user decision).
  - **Switching steps:** stays on the page. Going to step 2, only the
    sessions column slides from right to left; the catalog makes room and
    the values column appears on the right. Going back, it slides from
    left to right.
- **Block check:** the editor shows which exercises chosen for the week's
  mesocycle are missing from the week, and which exercises on the week are
  not chosen for it.
- **Entry points** on the athlete page, for whoever may plan, in a new
  "Training week" section below the macrocycle chart:
  - **Plan / Edit next week:** "Plan next week" opens the week after the
    current one (week 1 before the start). It is prefilled with the
    previous week's sessions, exercises, set groups and coach notes if
    that week is planned, and otherwise with the weekly schedule. If that
    week is already planned, the button reads "Edit next week".
  - **Plan this week:** shown for an unplanned current week, prefilled
    the same way.
  - **Planned weeks:** listed with their dates and an edit button.
- **Saving:** "Save" stores the whole week. Saving a week without sessions
  makes it unplanned again. Leaving the editor with unsaved changes asks
  "Save changes?" (Save, Discard, Cancel), as in the planning steps.
- **Duration guard:** shortening the macrocycle is refused while weeks that
  would be removed have a week plan.
- **API:**
  - **Week plans:** read, save and list them. The linked athlete can
    read; only the coach of the Team can write.
  - **BREAKING (internal API):** the macrocycle base data takes the weekly
    schedule (`sessions: [{ weekday, slot }]`) instead of
    `trainingFrequency`. Responses keep `trainingFrequency` as the count.

New domain terms:
- **Weekly schedule** (Wochenschema)
- **Week plan** (Wochenplan)
- **Set group** (Satzgruppe)
- **Coach note** (Trainerhinweis)

Out of scope:
- The athlete's view of the current week and their feedback (feature 9).
- The current-week section with a concise plan on the athlete page
  (feature 5). This change adds only the entry points.
- Copying a week other than the previous one, templates, and duplicating
  sessions.
- Per-athlete adjustments of catalog values.

## Capabilities

### New Capabilities

- `week-planning`: week plans of a macrocycle (sessions, exercises, set
  groups, coach notes), the two-step week editor with the checks against
  the macrocycle planning, prefill, access and API.

### Modified Capabilities

- `athlete-details`: adds the "Training week" entry points on the athlete
  page.
- `macrocycle-planning`: "Macrocycle base data" replaces the number of
  sessions per week with the weekly schedule and refuses a duration that
  would remove planned weeks.

## Impact

- **Database:**
  - **Weekly schedule:** a new table for the macrocycle's schedule
    replaces the `training_frequency` column. The migration turns existing
    values into a schedule (see design).
  - **Week plans:** new tables for week plans, sessions, session exercises
    and set groups.
- **Domain:**
  - **Base data:** schema and calculation for the weekly schedule.
  - **Week plans:** a new module to read, save and list them, with access
    rules.
  - **Calculations:** pure functions for the week's actual values and the
    deviation, reusing `plannedExercise`.
  - **Duration guard:** a check when the duration changes.
- **API:**
  - **Base data:** the macrocycle input changes.
  - **Week plans:** `GET`/`PUT /api/athletes/{id}/macrocycle/weeks/{week}/plan`
    and `GET /api/athletes/{id}/macrocycle/weeks/plans`.
- **UI:**
  - **Base data form:** a weekly schedule picker.
  - **Week editor:** a two-step page `/athletes/{id}/macrocycle/weeks/{week}`
    with drag & drop, an exercise selection sheet and a slide animation
    that respects reduced motion.
  - **Athlete page:** the "Training week" section in `AthleteHome`.
- **Messages:** English and German texts; glossary entries for the new
  terms.
