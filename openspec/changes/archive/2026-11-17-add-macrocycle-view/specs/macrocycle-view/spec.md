# Spec Delta

## Purpose

Shows a planned macrocycle read-only to the coach of the athlete's Team and
to the athlete linked to it: how a planned value of an exercise develops
week by week, the focus points and the plan towards the main competition.

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
points in their order, and the new macrocycle plan. It SHALL be as wide as
the planning step with the intensity chart.

#### Scenario: Order
- **WHEN** the coach opens the view
- **THEN** the exercise chart is at the top, followed by the focus points and the new macrocycle plan, and the historical data, deficits and injuries are not shown

#### Scenario: Width
- **WHEN** the coach opens the view on a desktop screen
- **THEN** the exercise chart is as wide as the intensity chart in planning step 3

### Requirement: Exercise chart
The view SHALL show a read-only chart of one planned value of one exercise
for every week, calculated as in planning even in weeks whose mesocycle
does not use the exercise: the best value (kg), the average weight (kg),
the set size or the weekly reps, as one curve on one y-axis; no unit title is written next to the axis
(the value selection names the unit).
The x-axis SHALL show only week numbers; the mesocycle bands and the main
competition marker SHALL be shown as in planning.

#### Scenario: Best value of the snatch by default
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the coach opens the view
- **THEN** the chart shows the best value of exercise 1 (snatch) as the only curve, with 80 kg in week 11, on a kg axis

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags inside the chart
- **THEN** nothing changes and nothing is saved

### Requirement: Exercise and value selection
The only controls above the chart SHALL be two selections: the exercise
(catalog exercises 1 to 29, those with reference values, listed with number
and name; snatch by default) and the value to draw (best value by default,
average weight, set size, weekly reps). The chart SHALL then show that
value of that exercise; the choices SHALL NOT be saved.

#### Scenario: Choose another exercise
- **WHEN** the athlete chooses exercise 13 (snatch pull)
- **THEN** the chart shows the planned best value of exercise 13 for every week

#### Scenario: Choose another value
- **WHEN** the coach chooses "Weekly reps" while the snatch is shown
- **THEN** the chart shows the snatch's weekly reps as the only curve, with 20 in week 11, on a reps axis

#### Scenario: Not saved
- **GIVEN** the coach chose exercise 13 and the weekly reps in the view
- **WHEN** they open the view again
- **THEN** it shows the best value of the snatch again

### Requirement: Focus points in the view
Below the chart, the view SHALL show the macrocycle's focus points in their
order, or that none are entered yet.

#### Scenario: Focus points
- **GIVEN** a macrocycle with the focus points "Turnover" and "Squat strength"
- **WHEN** the view is shown
- **THEN** it shows "1. Turnover" and "2. Squat strength" below the chart

#### Scenario: No focus points yet
- **GIVEN** a macrocycle whose SWOT has not been saved yet
- **WHEN** the view is shown
- **THEN** it says that no focus points are entered yet

### Requirement: Macrocycle plan in the view
Below the focus points, the view SHALL show the new macrocycle plan
read-only: period with start and end date, duration, date and type of the
main competition, entry value, goals in snatch and clean & jerk, target
body weight and sessions per week.

#### Scenario: Plan shown
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 towards the "German Championships" on 2027-04-24 with entry value 60 %
- **WHEN** the coach opens the view
- **THEN** they see the period "Nov 30, 2026 – Apr 25, 2027", 21 weeks, "German Championships" on "Apr 24, 2027" and 60 %

### Requirement: Exercise chart legend
The exercise chart's legend (mesocycles, main competition, current week)
SHALL be hidden on screen for now (user decision) and stay available to
screen readers. The mesocycles are still named by their labels above the
bands.

#### Scenario: No visible legend
- **WHEN** the coach or the athlete looks at the exercise chart on the athlete's page or in the macrocycle view
- **THEN** no legend is shown, and the bands carry the labels GPB, SPB and CPB

### Requirement: Current week
The exercise chart SHALL mark the week of the macrocycle that contains
today with a solid vertical line at that week's value, named "Current
week" for screen readers. Before the start and after the end of the macrocycle
there SHALL be no such line.

#### Scenario: During the macrocycle
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on Wednesday 2027-01-06
- **THEN** a solid line marks week 6 in the chart

#### Scenario: Before the start or after the end
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on 2026-11-20 or on 2027-05-03
- **THEN** no week is marked

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
