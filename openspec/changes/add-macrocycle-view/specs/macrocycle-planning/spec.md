# Spec Delta

## ADDED Requirements

### Requirement: Colours of values and mesocycles
Wherever the app shows them, the planned values SHALL have fixed colours:
best value #6f3ab1, average weight #ba2db3, set size #3bc8c8, weekly reps
#d7f212. The mesocycles SHALL be shown in three shades of grey, from light
(general preparation) to dark (competition preparation) in light mode and
correspondingly in dark mode; they SHALL NOT use the value colours.

#### Scenario: Mesocycles in grey
- **WHEN** the coach looks at the intensity chart or the exercise table of a 21-week macrocycle
- **THEN** the general, special and competition preparation blocks are shown in three different shades of grey, with labels naming them

#### Scenario: Values in their colours
- **WHEN** a chart shows the best value, average weight, set size or weekly reps of an exercise
- **THEN** they are drawn in #6f3ab1, #ba2db3, #3bc8c8 and #d7f212

## MODIFIED Requirements

### Requirement: Intensity chart with week handles
Step 3 SHALL show the macrocycle chart fitting the screen width: weeks on
the x-axis ("Week"), each week's number and point at the start of its
area, the intensity ("Intensity") as a curve with one handle per week, and
the mesocycle backgrounds in their shades of grey. Each handle SHALL move
one 5 % step up (high week) or down (low week) by dragging or tapping; in
between it is medium.

#### Scenario: Make a week high
- **GIVEN** week 11 at 80 % intensity
- **WHEN** the coach drags its handle up
- **THEN** the handle snaps to 85 %, the week is marked high, and the change is saved

#### Scenario: Back to medium
- **GIVEN** a high week
- **WHEN** the coach drags its handle down by one step
- **THEN** the week is medium again

#### Scenario: No more than one step
- **GIVEN** a high week
- **WHEN** the coach tries to drag its handle further up
- **THEN** it stays at one step above the curve

#### Scenario: Whole cycle on a phone
- **GIVEN** a 52-week macrocycle
- **WHEN** the coach opens step 3 on a phone
- **THEN** all 52 weeks are visible without scrolling sideways

#### Scenario: No volume in the planning chart
- **GIVEN** exercises are chosen for the mesocycles
- **WHEN** the coach looks at the chart in step 3
- **THEN** the chart and its tooltips show the intensity only, no volume

#### Scenario: Mesocycle colours
- **WHEN** the coach looks at the chart of a 21-week macrocycle
- **THEN** weeks 1–3, 4–13 and 14–21 have three different grey backgrounds, from light to dark, with a legend and labels naming the three mesocycles

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart
- **THEN** the point and the number of week 4 are exactly on the border where the special preparation background begins

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
