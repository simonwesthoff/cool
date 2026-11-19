# Proposal

## Why

The coach can plan weeks, but neither the athlete nor the coach can see the
week the athlete is training in, and the athlete has no way to tell the
coach how it went. Features 9 (current week's plan view) and 5 (athlete
details) meet on the athlete page (user decision): its "Training week"
section becomes the full plan of the current week, with the athlete's
feedback per exercise.

## What Changes

- **Current week on the athlete page** (athlete details for the coach,
  "My training" for the athlete): the "Training week" section shows only
  the current week (user decision: no browsing).
  - **Header:** start date, calendar week, "Week x of y", mesocycle and week
    level.
  - **Tables:** one table per session, like the week editor's "Sets &
    weights" table.
    - **Layout:** fixed widths; each exercise is two rows high, with ten
      set columns (weight above reps), a free text for exercises from 30
      on, and the coach note.
    - **Read-only:** the plan can't be changed here.
    - **Columns:** without best value, mHG, set size, reps and the coach
      note, with a new "Feedback" column instead. A coach note shows as an
      indicator after the exercise name with the note as a tooltip (user
      decision).
    - **Width:** on desktop the tables fit the content width without
      scrolling sideways; bold lines separate exercises (also in the
      editor).
  - **No current week:** an unplanned current week says "No plan for this
    week yet"; before the macrocycle starts or after it ends, a short text
    replaces the week.
- **Feedback** (user decision): free text per exercise in a session, the
  only editable field, and only for the user linked to the Athlete (also a
  coach who trains themselves).
  - **Saving:** automatic.
  - **Coach:** reads it on the athlete page and in the week editor
    (read-only).
  - **Editor saves:** feedback survives the week editor's saves; it stays
    with the same exercise in the same session.
- **Coach tools in the section** (user decision): "Edit week" (current
  week) or "Plan this week" when it is unplanned, and "Plan next week" /
  "Edit next week". The list of planned weeks is dropped.
- **API:** the linked athlete writes the feedback of an exercise; the coach
  cannot. The week plan responses include the feedback.
- **"My training":** the placeholder text "Your training plan will appear
  here." goes, because the plan is now there.

New domain term:
- **Feedback** (Rückmeldung): the athlete's note on an exercise of a
  training session.

Out of scope:
- **Other weeks:** browsing weeks in the view.
- **Logging:** marking sessions done, or entering actually lifted weights.
- **Notifications:** none for new feedback.
- **Athlete details content:** further content beyond the macrocycle chart
  and the current week.

## Capabilities

### New Capabilities

- `week-view`: the current week's plan on the athlete page (header, tables,
  states without a plan) and the athlete's feedback per exercise.

### Modified Capabilities

- `athlete-details`: "Training week entry points" becomes the current week
  with the coach tools; the list of planned weeks goes.
- `user-roles`: "Athlete view" shows the current week and loses the
  placeholder text.
- `week-planning`: week plans carry feedback that survives editor saves and
  is shown read-only in the editor; "Week plan access and API" adds the
  feedback write for the linked athlete.

## Impact

- **Database:** a `feedback` column on `session_exercise` (migration).
- **Domain:**
  - **Week plans:** `saveWeekPlan` keeps the feedback by (weekday, slot,
    exercise); the read model includes the feedback.
  - **New:** `setFeedback` (linked athlete only); `getCurrentWeek` for the
    athlete page.
  - **Calendar:** a calendar week helper (ISO 8601).
- **API:** `PUT /api/athletes/{id}/macrocycle/weeks/{week}/plan/feedback`.
- **UI:**
  - **Athlete page:** `TrainingWeekSection` becomes the week view (new
    read-only table component sharing the editor table's widths).
  - **Week editor:** shows the feedback read-only.
- **Messages:** English and German; a glossary entry for "Feedback".

## Acceptance feedback: minimal exercise chart

- The exercise chart on the athlete page and in the macrocycle view drops
  the mesocycle colours and the y-axis: a thin line at each block start,
  one smoothed pink curve (#ba2db3) with a gradient fading downwards
  (user decision). The planning chart keeps its bands for now.

