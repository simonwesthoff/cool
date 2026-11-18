## Why

The four macrocycle planning steps are shown as a row of pill links, which
reads like tabs rather than a process, and the athlete's name sits as a
small line above the generic title "Macrocycle planning". The coach wants a
stepper that shows the order and progress of the steps, and the athlete's
name in the title.

## What Changes

- **Stepper** (user decision): the four steps (1 Base data, 2 SWOT,
  3 Intensity, 4 Exercises) become a horizontal stepper. It has numbered
  circles joined by a line, the label below each circle, the current step
  filled, earlier steps with a check mark, and later steps outlined.
  - **Navigation:** reachable steps stay links.
  - **Before the macrocycle exists:** steps 2–4 stay disabled.
  - **Phones:** the stepper fits at 390 px without wrapping.
- **Unsaved changes** (user decision): choosing another step while step 1
  or 2 has unsaved input asks in a small dialog: save, discard or cancel.
  Steps 3 and 4 save every change at once, so they never ask.
- **Polish:** the hover highlight of a step is drawn behind the connector
  line, the dialog's buttons share one row in equal widths, and the user
  menu has a fixed width in which every part spans the full width (name and
  truncated email, language switch, sign out).
- **Title:** "<first name>'s macrocycle planning" ("Makrozyklusplanung für
  <first name>" in German) replaces the small name line and the generic
  title. The first name is the first word of the athlete's name.

- **Change planning by permission** (user decision): the macrocycle view
  shows "Change planning" exactly when the user leads the athlete's Team,
  whether it is opened from "My training" or from the athlete details page
  (a coach who trains themselves sees it on both).

- **Editing on "My training"** (user decision): the athlete page shows the
  edit icon and "Plan macrocycle" by the same permission, so a coach who
  trains themselves can edit on their own "My training".
- **View title:** the macrocycle view's title becomes "<first name>'s
  macrocycle" ("Makrozyklus von <first name>"), replacing the name line.

Out of scope: changes to the steps themselves, the back link, and the
macrocycle view's title.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `macrocycle-planning`: "Planning in four steps" describes the stepper and
  the title with the athlete's first name.
- `macrocycle-view`: "Macrocycle view access" decides "Change planning" by
  permission on both entry points; "Layout of the view" adds the title.
- `user-roles`: "Athlete view" shows the edit icon and "Plan macrocycle"
  by permission.

## Impact

- **UI:** `StepIndicator` becomes a stepper with the unsaved-changes dialog
  (`UnsavedChangesProvider` in the macrocycle layout, guard in
  `BaseDataForm`); `PlanningHeader` shows the new
  title. New helper `firstName`.
- **Messages:** `Macrocycle.title` takes `{name}`; new stepper texts for
  screen readers (completed and current step), in English and German.
- **Domain:** new `isCoachOfAthlete(user, athleteId)` and
  `canPlanMacrocycle` (same rule as all writes); the view loader passes the
  edit link, "My training" passes `canEdit`.
- **No changes:** API and database.
