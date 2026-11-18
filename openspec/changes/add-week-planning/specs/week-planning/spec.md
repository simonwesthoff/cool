# Spec Delta

## Purpose

Week plans of a macrocycle: the training sessions of a week with their
exercises, set groups and coach notes, planned by the coach in the week
editor and checked against the macrocycle planning.

## ADDED Requirements

### Requirement: Week plan content
A week plan SHALL belong to one week of an athlete's macrocycle and have
at most 14 training sessions, each with a weekday (Monday–Sunday), a slot
(1–3) and exercises from the catalog, each at most once per session. An
exercise SHALL have at most 10 sets (reps 1–30, weight 0–500 kg in 0.5 kg
steps or none) stored as set groups of equal consecutive sets, or a free
text for its sets, and an optional coach note (each up to 500 characters).

#### Scenario: Ramping up in a session
- **GIVEN** the coach plans Monday with exercise 1 (snatch)
- **WHEN** they enter the sets 60 kg × 3, 60 kg × 3, 70 kg × 2, 70 kg × 2, 70 kg × 2, 80 kg × 1, 80 kg × 1
- **THEN** the week plan stores the set groups 2 × 3 @ 60 kg, 3 × 2 @ 70 kg and 2 × 1 @ 80 kg in this order

#### Scenario: Two sessions on one day
- **WHEN** the coach adds a second session on Monday
- **THEN** the sessions are shown as "Monday 1" and "Monday 2"; a single session on a day is shown as "Monday"

#### Scenario: Invalid set
- **WHEN** the coach enters a weight of 82.3 kg or 0 reps
- **THEN** the cell is marked and the week is not saved until it is corrected

#### Scenario: More than 10 sets
- **WHEN** an exercise in a session has 10 sets
- **THEN** no further set can be added, and the API refuses more than 10 sets with `TOO_MANY`

#### Scenario: Exercise without weight
- **WHEN** the coach enters 8 reps without a weight for exercise 33 (pull-up)
- **THEN** the set is saved without a weight

### Requirement: Week editor
The coach of the athlete's Team SHALL edit any week of the macrocycle,
whether it is already planned, ongoing or in the future, in two steps on
one page with a stepper on top: 1. exercises and sessions, 2. values. The
editor SHALL show "Week x of y", the dates of the week, its mesocycle and
its week level. "Continue" and the stepper SHALL switch steps without
leaving the page.

#### Scenario: Header
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the coach opens week 11
- **THEN** the editor shows "Week 11 of 21", "Feb 8 – Feb 14, 2027", the special preparation block and the week level, and step 1 is current

#### Scenario: Athlete cannot edit
- **WHEN** the linked athlete opens the week editor of their own week
- **THEN** they cannot open it, as for all coach pages: without a Team of their own they are sent to the home page, otherwise they see the "not found" page; the weekly view for athletes comes with a later feature

### Requirement: Automatic saving
Every change in the week editor SHALL be saved on its own shortly after it
is made, so both steps always show the stored week; a week without
sessions SHALL be unplanned again.

#### Scenario: Automatic saving
- **WHEN** the coach adds a set in step 2 or moves an exercise in step 1
- **THEN** the week is saved without a save button, the editor says "All changes saved.", and the week opens later with the same content

#### Scenario: Empty the week
- **GIVEN** a planned week
- **WHEN** the coach removes all sessions
- **THEN** the week is no longer planned

#### Scenario: Saving fails
- **WHEN** a save fails
- **THEN** the editor says "Could not save." and offers "Try again"

#### Scenario: Leaving before the change is saved
- **GIVEN** a change that is not saved yet (just made, invalid or failed)
- **WHEN** the coach chooses the back link
- **THEN** a dialog asks "Save changes?" with "Save", "Discard" and "Cancel", as in the planning steps; switching between the two steps does not ask

### Requirement: Values beyond the plan
Values more than 5 % off the plan SHALL be saved like all others, because
the coach may intend them; step 2 SHALL warn how many values are off the
plan. Only invalid entries (a weight not in 0.5 kg steps or above 500 kg,
reps outside 1–30, a weight without reps) SHALL block saving.

#### Scenario: Heavier than planned
- **GIVEN** the week 11 snatch with a plan of 80 kg best value
- **WHEN** the coach enters a set with 95 kg
- **THEN** the week is saved with 95 kg, the value is shown in red, and step 2 says how many values are more than 5 % off the plan

### Requirement: Finish week planning
Step 2 SHALL offer "Finish week planning", which saves any change not yet
saved and opens the athlete page. With an invalid entry the editor SHALL
stay open and say which fields to check.

#### Scenario: Finish the week
- **WHEN** the coach chooses "Finish week planning" right after a change
- **THEN** the change is saved and the athlete page opens

#### Scenario: Invalid entry
- **GIVEN** a weight of 82.3 kg
- **WHEN** the coach chooses "Finish week planning"
- **THEN** the editor stays open and asks to check the marked fields

### Requirement: Step 1 sessions and exercises
Step 1 SHALL show the week's sessions, each titled by its day selection
(with the slot when a day has several sessions), and their exercises. The
coach SHALL change a session's day, add and remove sessions, and add and
remove exercises. On wide screens the exercise
list SHALL be shown left of the sessions; exercises SHALL be added by
dragging them onto a session or by clicking into a session, which opens
the exercise selection.

#### Scenario: Drag an exercise onto a session
- **GIVEN** the editor on a desktop screen in step 1
- **WHEN** the coach drags exercise 13 from the catalog onto "Monday"
- **THEN** exercise 13 is added at the end of Monday's exercises

#### Scenario: Add by clicking on a desktop
- **WHEN** the coach clicks into "Wednesday" and picks exercise 20 in the selection
- **THEN** exercise 20 is added to Wednesday

#### Scenario: Change the day of a session
- **WHEN** the coach changes the day selection in the title of "Thursday" to Friday
- **THEN** the session and its exercises are shown as "Friday"

#### Scenario: Default sessions
- **GIVEN** a macrocycle whose weekly schedule has sessions on Monday (2), Wednesday and Friday, and an unplanned week without a planned previous week
- **WHEN** the coach opens the week
- **THEN** step 1 shows the sessions "Monday 1", "Monday 2", "Wednesday" and "Friday" without exercises, and more sessions can be added

### Requirement: Moving exercises
Exercises SHALL be moved by drag handles within a session and into other
sessions of the week; with a handle focused, the arrow keys SHALL move an
exercise up or down in its session.

#### Scenario: Move an exercise with its handle
- **GIVEN** Monday with exercises 1 and 13, and Wednesday without exercises
- **WHEN** the coach drags exercise 13 by its handle onto exercise 1, and then exercise 1 onto Wednesday
- **THEN** Monday has exercise 13 and Wednesday exercise 1; with the handle focused, the arrow keys move an exercise up or down

### Requirement: Step 1 on phones
On phones, step 1 SHALL hide the catalog column, and clicking into a
session SHALL open the exercise selection.

#### Scenario: Add by clicking on a phone
- **GIVEN** the editor on a phone in step 1, without the catalog column
- **WHEN** the coach clicks into "Thursday" and picks exercise 1 in the selection
- **THEN** exercise 1 is added to Thursday

### Requirement: Step 2 values
Step 2 SHALL show a compact table per session over the whole width. Each
exercise SHALL take two rows: its name and coach note span both, the ten
set columns hold the weight in the first row and the reps in the second,
and there are no buttons to add or remove sets; typing into an empty cell
adds the set. A weight without reps SHALL be marked as incomplete. On
phones the table SHALL scroll sideways with the exercise names kept in
view.

#### Scenario: Sets of the snatch on Monday
- **GIVEN** Monday's snatch with 2 × 3 @ 60 kg, 3 × 2 @ 70 kg and 2 × 1 @ 80 kg
- **WHEN** the coach opens step 2
- **THEN** Monday's table shows the snatch in two rows with the sets 60/3, 60/3, 70/2, 70/2, 70/2, 80/1, 80/1 in the first seven of ten set columns

#### Scenario: Add a set by typing
- **WHEN** the coach types 70 kg and 2 reps into the empty eighth set cells of the snatch
- **THEN** the snatch has eight sets and the change is saved

### Requirement: Exercises without values
Exercises from number 30 on (general strength exercises without reference
values) SHALL have a free text field for their sets and reps in step 2
instead of set columns, and no indicators; their coach note stays.

#### Scenario: Pull-up as free text
- **GIVEN** exercise 33 (pull-up) on Monday
- **WHEN** the coach enters "3 × 10, slow" in step 2
- **THEN** the text is saved with the exercise, and no weights, reps or indicators are shown for it

### Requirement: Indicator layout
Each session table SHALL have the columns "Best value", "mHG", "Set size"
and "Reps" ("Bestwert", "mHG", "Satzgröße", "Wdh."). For every exercise
with values, the first row SHALL hold the week's actual values ("Actual",
"Ist") and the second row the planned values ("Plan").

#### Scenario: Heaviest weight of the snatch
- **GIVEN** the week 11 snatch with its heaviest set at 80 kg and an mHG of 69.5 kg
- **WHEN** the coach looks at Monday's table
- **THEN** the "Actual" row shows 80 kg under "Best value" and 69.5 kg under "mHG", and the "Plan" row 80 kg and 69 kg

### Requirement: Step animation
When switching to step 2, only the sessions column SHALL slide from right
to left and then take the whole width: the catalog makes room. When
switching back, it SHALL slide from left to right. With reduced motion the
switch SHALL happen without animation.

#### Scenario: Switch to step 2
- **GIVEN** the editor on a desktop screen in step 1
- **WHEN** the coach chooses "Continue"
- **THEN** the sessions column moves from the right to the left side, the catalog is no longer shown, the session tables use the whole width, and the page is not reloaded

#### Scenario: Back to step 1
- **WHEN** the coach chooses step 1 in the stepper
- **THEN** the sessions column moves back to the right and the catalog is shown again, with all entered values kept

#### Scenario: Reduced motion
- **GIVEN** the system setting to reduce motion
- **WHEN** the coach switches steps
- **THEN** the columns change without sliding

### Requirement: Exercises of the mesocycle
The editor SHALL compare the exercises of the week with the exercises
chosen for the week's mesocycle in the macrocycle planning: chosen
exercises not yet in the week are shown by their status icon in the
exercise list, and every exercise of a session that is not chosen for the
mesocycle SHALL get an icon at the right of its row saying so. There SHALL
be no separate text listing missing or not planned exercises. The API
SHALL return the chosen, missing and not planned exercises with the week.

#### Scenario: Not planned exercise in a session
- **GIVEN** week 11 in the special preparation block, which has exercises 1 (snatch) and 13 chosen
- **WHEN** Monday contains exercises 1 and 20
- **THEN** the row of exercise 20 shows the "not planned for the special preparation block" icon, exercise 1 none, and the exercise list shows exercise 13 as not in the week yet

#### Scenario: Check in the API
- **WHEN** the week with exercises 1 and 20 is read through the API
- **THEN** it reports exercise 13 as missing and exercise 20 as not planned

### Requirement: Exercise list of the week
The exercise list (catalog column and exercise selection) SHALL list only
the exercises chosen for the week's mesocycle, each with an icon showing
whether it is already in the week. A button at the end of the list SHALL
show all catalog exercises; then the exercises not chosen for the
mesocycle SHALL be greyed out but still be selectable.

#### Scenario: Block exercises with their status
- **GIVEN** week 11 in the special preparation block with exercises 1 and 13 chosen, and exercise 1 in the week
- **WHEN** the coach looks at the exercise list
- **THEN** it lists only exercises 1 and 13; exercise 1 has the icon for "in the week", exercise 13 the icon for "not in the week yet"

#### Scenario: Show all exercises
- **WHEN** the coach chooses "Show all exercises"
- **THEN** all catalog exercises are listed, those not chosen for the special preparation block greyed out, and choosing one still adds it

### Requirement: Column titles and variations
The editor's columns SHALL have the titles "Exercises" and "Sessions" in
step 1 and "Weights" in step 2 ("Übungen", "Einheiten", "Gewichte"); the
titles move with their columns. The first step SHALL be called "Exercises &
sessions". An exercise chosen for the week's mesocycle with a variation
SHALL be named with the variation in brackets everywhere in the editor.

#### Scenario: Titles per step
- **WHEN** the coach is in step 1 on a desktop screen
- **THEN** the columns are titled "Exercises" and "Sessions"; in step 2 the one column is titled "Weights"

#### Scenario: Variation in brackets
- **GIVEN** exercise 13 chosen for the special preparation block with the variation "From blocks"
- **WHEN** the coach plans week 11
- **THEN** the exercise list, the session and step 2 show "13 Snatch pull (From blocks)"

### Requirement: Projection per exercise
In step 2, for every exercise of the week, the values column SHALL show the week's
projection from the macrocycle planning next to the week's actual values,
summed over all sessions of the week:
- **Best value:** compared with the heaviest weight.
- **Average weight:** compared with the mHG, the average weight over all
  reps with a weight.
- **Set size:** compared with the average reps per set.
- **Weekly reps:** compared with the sum of all reps.

#### Scenario: Actual values of the snatch in week 11
- **GIVEN** a 21-week macrocycle from 2026-11-30 with entry value 60 % and a snatch goal of 100 kg, so week 11 projects 80 kg best value, 69 kg average weight, set size 3 and 20 weekly reps for the snatch
- **WHEN** the week has the snatch on Monday with 2 × 3 @ 60 kg, 3 × 2 @ 70 kg, 2 × 1 @ 80 kg and on Thursday with 3 × 2 @ 75 kg
- **THEN** the editor shows heaviest weight 80 kg, mHG 69.5 kg, set size 2 and 20 reps next to the projected 80 kg, 69 kg, 3 and 20

#### Scenario: Exercise without catalog values
- **WHEN** the week contains an exercise without a best value or reps in the catalog
- **THEN** its actual values are shown without a projection

### Requirement: Deviation from the projection
An actual value more than 5 % above its projection SHALL be shown in red,
a value more than 5 % below in blue, next to the planned value, without
arrows (user decision); screen readers SHALL hear "more than 5 % above/below
the plan". Values within 5 % SHALL be shown without colour. Values
without a projection or without data SHALL not be compared. The
indicators SHALL be shown only in step 2.

#### Scenario: Snatch in week 11
- **GIVEN** the snatch week 11 from "Projection per exercise"
- **WHEN** the editor shows it
- **THEN** heaviest weight, mHG and reps are shown without colour, and set size 2 is blue next to the plan 3

#### Scenario: Too heavy
- **WHEN** the heaviest snatch of week 11 is 85 kg
- **THEN** the heaviest weight 85 kg is shown in red next to the plan 80 kg, without an arrow

#### Scenario: Not in step 1
- **WHEN** the coach is in step 1
- **THEN** no deviation indicators are shown

#### Scenario: Exactly 5 % off
- **WHEN** the mHG of an exercise is 72.45 kg against a projection of 69 kg
- **THEN** it is shown without colour

### Requirement: Plan next week
"Plan next week" SHALL open the week after the current week of the
macrocycle (week 1 before the start). If the week before it has a week
plan, the editor SHALL start with a copy of its sessions, exercises, set
groups and coach notes; otherwise it SHALL start with the sessions of the
macrocycle's weekly schedule, without exercises. The copy
SHALL only be stored when the coach saves. An already planned next week
SHALL be offered as "Edit next week" and open unchanged.

#### Scenario: Prefill from the previous week
- **GIVEN** week 6 is the current week and has a week plan
- **WHEN** the coach chooses "Plan next week"
- **THEN** week 7 opens with week 6's sessions, exercises, set groups and coach notes, and is not stored until "Save"

#### Scenario: First week
- **GIVEN** a macrocycle that starts next Monday
- **WHEN** the coach chooses "Plan next week"
- **THEN** week 1 opens with the sessions of the weekly schedule and no exercises

#### Scenario: Next week already planned
- **GIVEN** week 7 is the next week and has a week plan
- **THEN** the entry point reads "Edit next week" and opens week 7 as stored

#### Scenario: After the last week
- **GIVEN** the current week is the last week of the macrocycle
- **THEN** there is no "Plan next week"

### Requirement: Plan this week
An unplanned current week SHALL offer "Plan this week", which opens the
current week prefilled from the week before it in the same way as "Plan
next week".

#### Scenario: Current week not planned
- **GIVEN** week 6 is the current week, has no week plan, and week 5 has one
- **WHEN** the coach chooses "Plan this week"
- **THEN** week 6 opens with week 5's sessions, exercises, set groups and coach notes

### Requirement: Week plan access and API
The HTTP API SHALL let the coach of the athlete's Team save a week plan as
a whole and read it, and let the coach and the linked athlete read single
week plans and the list of planned weeks. Other users SHALL get 404
`ATHLETE_NOT_FOUND`; a week outside the macrocycle SHALL get 404
`WEEK_NOT_FOUND`; invalid input SHALL get 400 `VALIDATION_FAILED` with
field codes; the linked athlete's writes SHALL be refused like all other
macrocycle writes.

#### Scenario: Linked athlete reads
- **GIVEN** a planned week 11
- **WHEN** the linked athlete reads week 11 through the API
- **THEN** they get the same week plan as the coach

#### Scenario: Week outside the macrocycle
- **WHEN** the coach saves week 22 of a 21-week macrocycle
- **THEN** the answer is 404 `WEEK_NOT_FOUND`
