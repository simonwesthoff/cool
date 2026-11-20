## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Category marks in the week view
The training week's tables SHALL show each exercise's category marks (see
the exercise catalog) before its number, for the coach and the athlete.

#### Scenario: Athlete's week
- **GIVEN** the current week has exercises 1 and 33 on Monday
- **WHEN** the athlete looks at the training week
- **THEN** the snatch has a cyan dot before its number and the pull-up none

## REMOVED Requirements

### Requirement: Coach note indicator
**Reason**: The coach's note is shown in full in the new "Coach comment" column, so the indicator and its tooltip are no longer needed.
**Migration**: See "Coach comment in the week view".
