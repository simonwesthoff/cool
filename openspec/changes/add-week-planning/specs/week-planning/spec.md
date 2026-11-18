# Spec Delta

## Purpose

Week plans of a macrocycle: the training sessions of a week with their
exercises, set groups and coach notes, planned by the coach in the week
editor and checked against the macrocycle planning.

## ADDED Requirements

### Requirement: Week plan content
A week plan SHALL belong to one week of an athlete's macrocycle and consist
of training sessions. Each session SHALL have a weekday (Monday–Sunday) and
a number within that day (1–3), and contain exercises from the exercise
catalog, each exercise at most once per session. Each exercise SHALL have
one or more set groups (sets 1–20, reps per set 1–30, weight 0–500 kg in
0.5 kg steps, or no weight) and an optional coach note (up to 500
characters). A week SHALL have at most 14 sessions.

#### Scenario: Ramping up in a session
- **GIVEN** the coach plans Monday with exercise 1 (snatch)
- **WHEN** they enter the set groups 2 × 3 @ 60 kg, 3 × 2 @ 70 kg and 2 × 1 @ 80 kg and save
- **THEN** the week plan stores the three set groups in this order

#### Scenario: Two sessions on one day
- **WHEN** the coach adds a second session on Monday
- **THEN** the sessions are shown as "Monday 1" and "Monday 2"; a single session on a day is shown as "Monday"

#### Scenario: Invalid set group
- **WHEN** the coach saves a set group with 0 sets or a weight of 82.3 kg
- **THEN** the week is not saved and the set group is marked with the reason

#### Scenario: Exercise without weight
- **WHEN** the coach enters 3 × 8 for exercise 33 (pull-up) without a weight
- **THEN** the set group is saved without a weight

### Requirement: Week editor
The coach of the athlete's Team SHALL edit any week of the macrocycle,
whether it is already planned, ongoing or in the future. The editor SHALL
show the week number with "Week x of y", the dates of the week, its
mesocycle and its week level, and let the coach add and remove sessions,
add, remove and reorder exercises in a session, add and remove set groups
and write coach notes. "Save" SHALL store the whole week; saving a week
without sessions SHALL make it unplanned again.

#### Scenario: Header
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the coach opens week 11
- **THEN** the editor shows "Week 11 of 21", "Feb 8 – Feb 14, 2027", the special preparation block and the week level

#### Scenario: Save the week
- **WHEN** the coach adds sessions on Monday and Thursday with exercises and set groups and chooses "Save"
- **THEN** the week plan is stored and shown again with the same content when the week is opened later

#### Scenario: Empty the week
- **GIVEN** a planned week
- **WHEN** the coach removes all sessions and saves
- **THEN** the week is no longer planned

#### Scenario: Unsaved changes
- **GIVEN** the coach changed the week without saving
- **WHEN** they choose the back link
- **THEN** a dialog asks "Save changes?" with "Save", "Discard" and "Cancel", as in the planning steps

#### Scenario: Athlete cannot edit
- **WHEN** the linked athlete opens the week editor of their own week
- **THEN** they see the "not found" page, because the weekly view for athletes comes with a later feature

### Requirement: Exercises of the mesocycle
The editor SHALL compare the exercises of the week with the exercises
chosen for the week's mesocycle in the macrocycle planning. It SHALL list
the chosen exercises that are missing from the week, and mark every
exercise on the week that is not chosen for that mesocycle. When choosing
an exercise for a session, the chosen exercises of the mesocycle SHALL be
offered first, followed by the whole catalog.

#### Scenario: Missing and unplanned exercises
- **GIVEN** week 11 in the special preparation block, which has exercises 1 (snatch) and 13 chosen
- **WHEN** the week contains exercises 1 and 20
- **THEN** the editor lists exercise 13 as missing, and marks exercise 20 as not planned for the special preparation block

#### Scenario: All exercises match
- **WHEN** the week contains exactly the chosen exercises of its mesocycle
- **THEN** the editor shows that the week matches the mesocycle

### Requirement: Projection per exercise
For every exercise of the week, the editor SHALL show the week's
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
An actual value more than 5 % above its projection SHALL be shown red with
↑, a value more than 5 % below in blue with ↓, both together with the
projected value. Values within 5 % SHALL be shown without colour. Values
without a projection or without data SHALL not be compared.

#### Scenario: Snatch in week 11
- **GIVEN** the snatch week 11 from "Projection per exercise"
- **WHEN** the editor shows it
- **THEN** heaviest weight, mHG and reps are shown without colour, and set size 2 is blue with ↓ and the projection 3

#### Scenario: Too heavy
- **WHEN** the heaviest snatch of week 11 is 85 kg
- **THEN** the heaviest weight is shown red with ↑ and the projection 80 kg

#### Scenario: Exactly 5 % off
- **WHEN** the mHG of an exercise is 72.45 kg against a projection of 69 kg
- **THEN** it is shown without colour

### Requirement: Plan next week
"Plan next week" SHALL open the week after the current week of the
macrocycle (week 1 before the start). If the week before it has a week
plan, the editor SHALL start with a copy of its sessions, exercises and set
groups, without the coach notes; otherwise it SHALL start empty. The copy
SHALL only be stored when the coach saves. An already planned next week
SHALL be offered as "Edit next week" and open unchanged.

#### Scenario: Prefill from the previous week
- **GIVEN** week 6 is the current week and has a week plan
- **WHEN** the coach chooses "Plan next week"
- **THEN** week 7 opens with week 6's sessions, exercises and set groups, without its coach notes, and is not stored until "Save"

#### Scenario: First week
- **GIVEN** a macrocycle that starts next Monday
- **WHEN** the coach chooses "Plan next week"
- **THEN** week 1 opens empty

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
- **THEN** week 6 opens with week 5's sessions, exercises and set groups

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
