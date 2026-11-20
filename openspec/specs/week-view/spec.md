# week-view Specification

## Purpose

The plan of the athlete's current week on the athlete page, read-only for
everyone, with the athlete's feedback per exercise as the only editable
field.

## Requirements

### Requirement: Current week on the athlete page
The athlete page SHALL show the current week of the macrocycle (the week
that contains today), both on the athlete details page and on "My
training": its start date, calendar week, "Week x of y", mesocycle and
week level, and one table per session. No other week SHALL be shown there.

#### Scenario: Header of the current week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 and today is Wednesday 2027-02-10
- **WHEN** the athlete opens "My training"
- **THEN** the section shows "Week 11 of 21", "from Feb 8, 2027", calendar week 6, the special preparation block and the week level

#### Scenario: Coach and athlete see the same week
- **WHEN** the coach opens the athlete details page and the athlete opens "My training" on the same day
- **THEN** both see the same week with the same sessions, exercises, sets, coach notes and feedback

### Requirement: Week tables
Each session SHALL be a read-only table like the week editor's "Sets &
weights" table: each exercise two rows high, a narrow exercise cell with
the category marks and the number (the name on hover), as many set columns
as the most sets of any exercise that week, with the weight above the reps
(or the free text from exercise 30 on), then "Coach comment" and
"Feedback", with bold lines between exercises and no indicator columns. On
wide screens the table SHALL fit the content width.

#### Scenario: Snatch on Monday
- **GIVEN** the current week has the snatch on Monday with 2 × 3 @ 60 kg and 1 × 1 @ 80 kg and the coach note "Fast turnover", and no exercise of the week has more sets
- **WHEN** the athlete looks at the current week
- **THEN** Monday's table shows a cyan dot and "1" for the snatch ("1 Snatch" on hover), three set columns with 60/3, 60/3, 80/1, "Fast turnover" in the coach comment, and a feedback field

#### Scenario: Desktop width
- **WHEN** the athlete opens "My training" on a desktop screen
- **THEN** the week tables fit the content width and cannot be scrolled sideways

#### Scenario: Set columns of the week
- **GIVEN** Monday's longest exercise has 4 sets and Thursday's clean has 7
- **WHEN** the athlete looks at the week
- **THEN** both tables have 7 set columns

### Requirement: No vertical scrolling of week tables
On phones a session's table MAY scroll sideways but SHALL never scroll
vertically; the exercise name's tooltip SHALL open above the page without
making the table taller or being covered by other cells.

#### Scenario: Tap the note on a phone
- **GIVEN** a coach note on Monday's snatch
- **WHEN** the athlete looks at Monday's table on a phone
- **THEN** the note is shown in full in the coach comment, and Monday's table cannot be scrolled vertically

### Requirement: Feedback per exercise
The user linked to the Athlete (also a coach who trains themselves) SHALL
write a free-text feedback of up to 500 characters for every exercise of a
session; it SHALL be saved automatically shortly after typing. Everyone
else SHALL see the feedback read-only. The feedback is the only editable
field of the week view.

#### Scenario: Athlete writes feedback
- **WHEN** the athlete types "Last set felt heavy" into the feedback of Monday's snatch
- **THEN** it is saved without a save button and shown again when the page is opened later

#### Scenario: Coach reads feedback
- **GIVEN** the athlete's feedback "Last set felt heavy" on Monday's snatch
- **WHEN** the coach opens the athlete details page
- **THEN** the coach sees the feedback and cannot change it

### Requirement: Week view states
Without a plan for the current week the section SHALL say "No plan for
this week yet". Before the macrocycle starts it SHALL say when it starts;
after it ends it SHALL say that it has ended. Without a macrocycle there
SHALL be no section.

#### Scenario: Current week not planned
- **GIVEN** week 6 is the current week and has no week plan
- **WHEN** the athlete opens "My training"
- **THEN** the section says "No plan for this week yet"

#### Scenario: Before the start
- **GIVEN** a macrocycle that starts on Monday 2026-11-30 and today is 2026-11-20
- **WHEN** the athlete opens "My training"
- **THEN** the section says that the macrocycle starts on Nov 30, 2026

### Requirement: Feedback API
The HTTP API SHALL let the user linked to the Athlete set the feedback of
one exercise in a session of a planned week, identified by weekday, slot
and exercise number. The coach SHALL get 403 `NOT_THE_ATHLETE` unless
they are linked to the Athlete; other users 404 `ATHLETE_NOT_FOUND`; an
exercise that is not in that session 404 `EXERCISE_NOT_IN_WEEK`; feedback
over 500 characters 400 `VALIDATION_FAILED`.

#### Scenario: Coach tries to write feedback
- **WHEN** the coach of the athlete's Team, who is not linked to the Athlete, sets feedback through the API
- **THEN** the answer is 403 `NOT_THE_ATHLETE` and nothing changes

#### Scenario: Exercise not in the session
- **WHEN** the athlete sets feedback for exercise 13 on Monday, but Monday has no exercise 13
- **THEN** the answer is 404 `EXERCISE_NOT_IN_WEEK`

### Requirement: Category marks in the week view
The training week's tables SHALL show each exercise's category marks (see
the exercise catalog) before its number, for the coach and the athlete.

#### Scenario: Athlete's week
- **GIVEN** the current week has exercises 1 and 33 on Monday
- **WHEN** the athlete looks at the training week
- **THEN** the snatch has a cyan dot before its number and the pull-up none

### Requirement: Coach comment in the week view
Each session table of the training week SHALL have a "Coach comment"
column between the last set and the feedback. It SHALL show the
mesocycle's variation of the exercise as "Variation: <variation>" and the
coach's note on the next line, each only if there is one.

#### Scenario: Variation and note
- **GIVEN** the snatch has the variation "From the hang" and the coach note "Fast turnover"
- **WHEN** the athlete looks at the training week
- **THEN** the snatch's coach comment reads "Variation: From the hang" and, below it, "Fast turnover"

#### Scenario: Neither
- **WHEN** an exercise has no variation and no coach note
- **THEN** its coach comment cell is empty
