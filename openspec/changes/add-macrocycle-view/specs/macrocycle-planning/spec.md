# Spec Delta

## MODIFIED Requirements

### Requirement: One macrocycle per athlete
An athlete SHALL have at most one macrocycle. Only the coach of the
athlete's Team SHALL create or change it; the coach and the user linked to
the Athlete SHALL see it.

#### Scenario: Plan an athlete without a macrocycle
- **GIVEN** an athlete of the coach's Team without a macrocycle
- **WHEN** the coach completes step 1 of the planning
- **THEN** the athlete has a macrocycle with the entered base data, an empty SWOT, default mesocycles and only medium weeks

#### Scenario: Another coach
- **WHEN** a coach opens the planning of an athlete of another Team
- **THEN** they see the "not found" page

#### Scenario: Linked athlete opens the planning
- **GIVEN** a user linked to an Athlete with a macrocycle
- **WHEN** they open one of the planning steps of their macrocycle
- **THEN** they see the "not found" page

### Requirement: Macrocycle API
The HTTP API SHALL let the coach of an athlete create and change the
athlete's macrocycle, set week levels, set the exercises of each mesocycle,
set the mesocycle borders, and read the macrocycle with mesocycles, week
levels and all calculated values per week; the user linked to the Athlete
SHALL be able to read it. Invalid input SHALL be answered with 400
`VALIDATION_FAILED` and field codes; other users with 404
`ATHLETE_NOT_FOUND`; a second macrocycle with 409 `MACROCYCLE_EXISTS`;
reading a missing one with 404 `MACROCYCLE_NOT_FOUND`.

#### Scenario: Read with calculated values
- **GIVEN** a planned macrocycle of 21 weeks with exercise 13 in the special preparation block
- **WHEN** the coach requests it
- **THEN** week 11 contains intensity 80 %, and for exercise 13 best value 86 kg, average weight 75 kg, set size 6 and 33 weekly reps

#### Scenario: Second macrocycle
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach tries to create another one
- **THEN** the response has status 409 and code `MACROCYCLE_EXISTS`

#### Scenario: Linked athlete reads
- **GIVEN** a user linked to an Athlete with a macrocycle
- **WHEN** they request the macrocycle of their Athlete
- **THEN** the response has status 200 and the same content the coach gets

#### Scenario: Linked athlete cannot change
- **GIVEN** a user linked to an Athlete with a macrocycle
- **WHEN** they try to change its base data, SWOT, week levels, borders or exercises
- **THEN** the response has status 404 and code `ATHLETE_NOT_FOUND`, and nothing changes
