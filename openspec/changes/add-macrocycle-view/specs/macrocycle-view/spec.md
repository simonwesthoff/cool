# Spec Delta

## Purpose

Shows a planned macrocycle read-only to the coach of the athlete's Team and
to the athlete linked to it: the starting point, the plan towards the main
competition, and how intensity and volume develop week by week.

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

#### Scenario: Deficits not entered yet
- **GIVEN** a macrocycle whose SWOT has not been saved yet
- **WHEN** the view is shown
- **THEN** the deficits and the injuries and illnesses read "Not entered yet"

### Requirement: Macrocycle chart in the view
The view SHALL show the macrocycle chart read-only: the intensity curve with
the week levels on the mesocycle bands, the main competition marker and the
week tooltips as in planning, and below it, on the same week axis, the
volume of each week as a bar with its own scale. Weeks without exercises
SHALL have no bar. Nothing in the chart SHALL be movable.

#### Scenario: Intensity and volume
- **GIVEN** a macrocycle with exercise 13 chosen for the special preparation block
- **WHEN** the coach opens the view
- **THEN** the chart shows the intensity of every week and a volume bar for every week of the special preparation block, and none for the other weeks

#### Scenario: No exercises chosen yet
- **GIVEN** a macrocycle without chosen exercises
- **WHEN** the view is shown
- **THEN** the volume part of the chart says that no exercises are chosen yet

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags a week's point or a mesocycle border in the view
- **THEN** nothing changes and nothing is saved

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
