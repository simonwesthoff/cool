# Spec Delta

## ADDED Requirements

### Requirement: Feedback in the week editor
The athlete's feedback on an exercise SHALL be kept when the coach saves
the week, as long as the exercise stays in the same session (same day and
slot); it SHALL be shown read-only below the coach note in step 2 of the
week editor. Removing the exercise from that session SHALL remove its
feedback.

#### Scenario: Coach changes the sets
- **GIVEN** the athlete's feedback "Last set felt heavy" on Monday's snatch
- **WHEN** the coach changes a weight of that snatch in the week editor
- **THEN** the feedback is still there, and the editor shows it read-only below the coach note

#### Scenario: Exercise moved to another day
- **GIVEN** the feedback on Monday's snatch
- **WHEN** the coach moves the snatch to Wednesday
- **THEN** the feedback is no longer shown, because it belonged to Monday's session

## MODIFIED Requirements

### Requirement: Week plan access and API
The HTTP API SHALL let the coach of the athlete's Team save a week plan as
a whole and read it, and let the coach and the linked athlete read single
week plans (with the feedback) and the list of planned weeks. Saving SHALL
keep the feedback. Other users SHALL get 404 `ATHLETE_NOT_FOUND`; a week
outside the macrocycle 404 `WEEK_NOT_FOUND`; invalid input 400
`VALIDATION_FAILED` with field codes; the linked athlete's plan writes
SHALL be refused like all macrocycle writes.

#### Scenario: Linked athlete reads
- **GIVEN** a planned week 11
- **WHEN** the linked athlete reads week 11 through the API
- **THEN** they get the same week plan as the coach, including the feedback

#### Scenario: Week outside the macrocycle
- **WHEN** the coach saves week 22 of a 21-week macrocycle
- **THEN** the answer is 404 `WEEK_NOT_FOUND`
