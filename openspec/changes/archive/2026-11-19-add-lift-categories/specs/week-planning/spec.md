## ADDED Requirements

### Requirement: Category marks in the week editor
The week editor SHALL show each exercise's category marks (see the
exercise catalog) before its name: in step 1 in the exercise list and on
the session cards, in step 2 in the exercise cell of each session table.

#### Scenario: Clean already planned on Monday
- **GIVEN** exercise 4 "Umsetzen" on Monday's session card
- **WHEN** the coach looks at step 1
- **THEN** exercise 4 shows a purple dot on Monday's card and in the exercise list, so a clean movement is visibly planned for Monday

#### Scenario: Marks in step 2
- **GIVEN** exercises 1 and 3 in Monday's session
- **WHEN** the coach opens step 2
- **THEN** the snatch has a cyan dot and the clean and jerk one purple-to-magenta dot in their exercise cells
