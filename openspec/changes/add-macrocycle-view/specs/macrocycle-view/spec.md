# Spec Delta

## Purpose

Shows a planned macrocycle read-only to the coach of the athlete's Team and
to the athlete linked to it: how the planned values of an exercise develop
week by week, the focus points, the starting point and the plan towards the
main competition.

## ADDED Requirements

### Requirement: Macrocycle view access
The coach of the athlete's Team SHALL open the macrocycle view from the
athlete details page; the athlete linked to the Athlete SHALL open the same
view from "My training". Other users SHALL get the "not found" page. Without
a macrocycle, the coach SHALL be sent to step 1 of the planning, and the
athlete SHALL see that no macrocycle is planned yet.

#### Scenario: Coach opens the view
- **GIVEN** an athlete of the coach's Team with a planned macrocycle
- **WHEN** the coach opens the macrocycle from the athlete details page
- **THEN** they see the macrocycle view with "Change planning" and a way back to the athlete details page

#### Scenario: Athlete opens the view
- **GIVEN** a user linked to an Athlete with a planned macrocycle
- **WHEN** they open the macrocycle from "My training"
- **THEN** they see the same view without "Change planning" and without any other way to change the macrocycle

#### Scenario: Another user
- **WHEN** a user who is neither the coach of the athlete's Team nor linked to the Athlete opens the view
- **THEN** they see the "not found" page

#### Scenario: Not planned yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the view, or the linked athlete opens their macrocycle
- **THEN** the coach is sent to step 1 of the planning, and the athlete sees that their coach has not planned a macrocycle yet

### Requirement: Layout of the view
The view SHALL show, from top to bottom: the exercise chart, the focus
points in their order, the base data, and the deficits with the injuries
and illnesses.

#### Scenario: Order
- **WHEN** the coach opens the view
- **THEN** the exercise chart is at the top, followed by the focus points, the base data and the deficits

### Requirement: Exercise chart
The view SHALL show a read-only chart of one exercise's planned best value
and average weight (kg, left axis) and set size and weekly reps (reps,
right axis) for every week, calculated as in planning even in weeks whose
mesocycle does not use the exercise. A legend SHALL name each curve with
its unit; the x-axis SHALL show only week numbers. The mesocycle bands and
the main competition marker SHALL be shown as in planning.

#### Scenario: Snatch by default
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the coach opens the view
- **THEN** the chart shows exercise 1 (snatch), and week 11 has best value 80 kg, average weight 69 kg, set size 3 and 20 weekly reps

#### Scenario: Legend
- **WHEN** the view is shown
- **THEN** the legend names "Best value (kg)", "Average weight (kg)", "Set size (reps)" and "Weekly reps (reps)" with the line style of each curve

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags inside the chart
- **THEN** nothing changes and nothing is saved

### Requirement: Exercise selection
Above the chart, the coach and the athlete SHALL be able to choose the
exercise shown, from the catalog exercises 1 to 29 (those with reference
values), listed with number and name. The chart SHALL then show that
exercise's values; the choice SHALL NOT be saved.

#### Scenario: Choose another exercise
- **WHEN** the athlete chooses exercise 13 (snatch pull)
- **THEN** the chart shows the planned values of exercise 13 for every week

#### Scenario: Not saved
- **GIVEN** the coach chose exercise 13 in the view
- **WHEN** they open the view again
- **THEN** it shows the snatch again

### Requirement: Focus points in the view
Below the chart, the view SHALL show the macrocycle's focus points in their
order, or that none are entered yet.

#### Scenario: Focus points
- **GIVEN** a macrocycle with the focus points "Turnover" and "Squat strength"
- **WHEN** the view is shown
- **THEN** it shows "1. Turnover" and "2. Squat strength" below the chart

### Requirement: Base data in the view
The view SHALL show, read-only: "Historical data" (personal bests in snatch
and clean & jerk, body weight, and body fat and muscle mass when entered),
"New macrocycle plan" (period with start and end date, duration, date and
type of the main competition, entry value, goals in snatch and clean &
jerk, target body weight, sessions per week), the four deficits and the
injuries and illnesses.

#### Scenario: Base data shown
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 towards the "German Championships" on 2027-04-24 with entry value 60 %
- **WHEN** the coach opens the view
- **THEN** they see the period "Nov 30, 2026 – Apr 25, 2027", 21 weeks, "German Championships" on "Apr 24, 2027" and 60 %

#### Scenario: Optional values not entered
- **GIVEN** a macrocycle without body fat and muscle mass
- **WHEN** the view is shown
- **THEN** it shows neither body fat nor muscle mass

#### Scenario: SWOT not saved yet
- **GIVEN** a macrocycle whose SWOT has not been saved yet
- **WHEN** the view is shown
- **THEN** the deficits and the injuries and illnesses read "Not entered yet", and no focus points are entered

### Requirement: Current week
The view SHALL show which week of the macrocycle contains today: "Week n of
N" above the chart and a marker on that week in the chart. Before the start
it SHALL say when the macrocycle starts, after the end that it has ended,
and the chart SHALL then show no current-week marker.

#### Scenario: During the macrocycle
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on Wednesday 2027-01-06
- **THEN** it shows "Week 6 of 21" and marks week 6 in the chart

#### Scenario: Before the start
- **GIVEN** a macrocycle starting on Monday 2026-11-30
- **WHEN** the view is opened on 2026-11-20
- **THEN** it says that the macrocycle starts on Nov 30, 2026, and no week is marked

#### Scenario: After the end
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on 2027-05-03
- **THEN** it says that the macrocycle has ended, and no week is marked

### Requirement: Exercise values in the API
The HTTP API SHALL return, for any catalog exercise, its planned best
value, average weight, set size and weekly reps for every week of the
athlete's macrocycle, to the coach of the athlete's Team and to the user
linked to the Athlete. Other users SHALL get 404 `ATHLETE_NOT_FOUND`, an
unknown exercise 404 `EXERCISE_NOT_FOUND`, a missing macrocycle 404
`MACROCYCLE_NOT_FOUND`, and requests without a session 401.

#### Scenario: Values of the snatch
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the linked athlete requests the values of exercise 1
- **THEN** the response has 21 weeks, and week 11 has best value 80 kg, average weight 69 kg, set size 3 and 20 weekly reps

#### Scenario: Exercise without values
- **WHEN** the coach requests the values of exercise 31 (bench press)
- **THEN** every week has no best value, average weight, set size or weekly reps

#### Scenario: Unknown exercise
- **WHEN** the coach requests the values of exercise 99
- **THEN** the response has status 404 and code `EXERCISE_NOT_FOUND`
