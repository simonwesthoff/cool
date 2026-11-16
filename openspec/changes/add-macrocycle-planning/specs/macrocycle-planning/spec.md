# Spec Delta

## Purpose

Lets a coach plan an athlete's macrocycle towards a main competition: its
base data, how the load develops week by week, and the exercises of each
mesocycle.

## ADDED Requirements

### Requirement: Macrocycle base data
A macrocycle SHALL have: personal bests and goals in snatch and clean &
jerk (kg), current and target body weight (kg), body fat and muscle mass
(%, optional), texts for deficits, injuries and illnesses, strengths and
weightlifting experience, training sessions per week (1–14), focus points,
a start date (a Monday), a duration (7–52 weeks), date and type of the main
competition, and the entry value (30–95 %, default 60 %). All except body
fat and muscle mass SHALL be required.

#### Scenario: Required values missing
- **WHEN** the coach saves the base data without a snatch goal
- **THEN** the macrocycle is not saved and the form shows that the snatch goal is required

#### Scenario: Optional values
- **WHEN** the coach saves the base data without body fat and muscle mass
- **THEN** the macrocycle is saved

#### Scenario: Start date not a Monday
- **WHEN** the coach enters a Wednesday as start date
- **THEN** the form shows that the macrocycle starts on a Monday

#### Scenario: Default entry value
- **WHEN** the coach opens the base data form of a new macrocycle
- **THEN** the entry value is 60 %

### Requirement: Focus points
A macrocycle SHALL have an ordered list of 1 to 3 focus points (texts of up
to 200 characters each). The coach SHALL be able to add, remove and reorder
them in step 1.

#### Scenario: Focus points
- **WHEN** the coach enters the focus points "Turnover", "Squat strength" and "Jerk stability" in this order and saves
- **THEN** the macrocycle has these three focus points in this order

#### Scenario: Number of focus points
- **WHEN** the coach saves the base data without a focus point, or tries to add a fourth one
- **THEN** the form shows that 1 to 3 focus points are needed, and no fourth field can be added

### Requirement: One macrocycle per athlete
An athlete SHALL have at most one macrocycle. Only the coach of the
athlete's Team SHALL create, see or change it.

#### Scenario: Plan an athlete without a macrocycle
- **GIVEN** an athlete of the coach's Team without a macrocycle
- **WHEN** the coach completes step 1 of the planning
- **THEN** the athlete has a macrocycle with the entered base data, default mesocycles and only medium weeks

#### Scenario: Another coach
- **WHEN** a coach opens the planning of an athlete of another Team
- **THEN** they see the "not found" page

### Requirement: Planning in three steps
The planning SHALL consist of three steps the coach goes through in order
and can revisit at any time: 1. base data, 2. intensity chart with week
levels, 3. exercises per mesocycle. After step 3 the macrocycle SHALL be
planned and the coach returns to the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data, continue through the chart and choose exercises
- **THEN** the macrocycle is saved after each step and they end on the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

### Requirement: Intensity chart with week handles
Step 2 SHALL show the macrocycle chart fitting the screen width: weeks on
the x-axis ("Week"), each week's number and point at the start of its
area, the intensity ("Intensity") as a curve with one handle per week, and
mesocycle backgrounds in the app palette (#6f3ab1, #ba2db3, #3bc8c8). Each
handle SHALL move one 5 % step up (high week) or down (low week) by
dragging or tapping; in between it is medium.

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
- **WHEN** the coach opens step 2 on a phone
- **THEN** all 52 weeks are visible without scrolling sideways

#### Scenario: No volume in the planning chart
- **GIVEN** exercises are chosen for the mesocycles
- **WHEN** the coach looks at the chart in step 2
- **THEN** the chart shows the intensity only; a week's volume is shown in its tooltip

#### Scenario: Mesocycle colours
- **WHEN** the coach looks at the chart of a 21-week macrocycle
- **THEN** weeks 1–3 have a #6f3ab1, weeks 4–13 a #ba2db3 and weeks 14–21 a #3bc8c8 background, with a legend and labels naming the three mesocycles

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart
- **THEN** the point and the number of week 4 are exactly on the border where the special preparation background begins

### Requirement: Week tooltip
Pointing at or focusing a week in the chart SHALL show a tooltip with the
week's number, start date, mesocycle, level, intensity and volume. The
tooltip SHALL never cover the pointer or the week's point.

#### Scenario: Tooltip near the top right
- **GIVEN** a week whose point is at the top right of the chart
- **WHEN** the coach points at it
- **THEN** its tooltip appears where it covers neither the pointer nor the point

### Requirement: Adjustable mesocycle borders
In step 2, the coach SHALL be able to move the two borders between the
mesocycles left and right by whole weeks by dragging a handle on each
border. Each mesocycle SHALL keep at least one week.
Every change SHALL be saved.

#### Scenario: Longer general preparation
- **GIVEN** a 21-week macrocycle with the default blocks 1–3, 4–13 and 14–21
- **WHEN** the coach drags the first border two weeks to the right
- **THEN** the blocks are 1–5, 6–13 and 14–21, and the weeks' mesocycles and calculated values follow

#### Scenario: At least one week
- **WHEN** the coach drags the second border onto the first one
- **THEN** it stops one week after the first border

### Requirement: Exercises per mesocycle
Step 3 SHALL show one table of the exercise catalog, grouped by exercise
group, with one row per exercise and one column per mesocycle (GLP, ABP,
LAP). In each cell the coach SHALL be able to choose the exercise for that
mesocycle with a required reason and an optional variation (free text, the
catalog comment as a hint), change both later, or remove the choice. The
same exercise MAY be chosen for several mesocycles. The variation SHALL NOT
change the calculated values.

#### Scenario: Choose exercises
- **WHEN** the coach chooses exercises 1, 13 and 19 in the special preparation column, each with a reason
- **THEN** these three exercises belong to that mesocycle with their reasons

#### Scenario: Variation and reason
- **WHEN** the coach chooses exercise 1 for the general preparation block with the variation "No feet snatch" and the reason "Footwork in the turnover"
- **THEN** the cell shows the variation, and the choice keeps the variation and the reason

#### Scenario: Reason required
- **WHEN** the coach tries to choose an exercise without a reason
- **THEN** it is not chosen and the dialog shows that the reason is required

#### Scenario: Remove an exercise
- **GIVEN** exercise 13 chosen for a mesocycle
- **WHEN** the coach removes it in its cell
- **THEN** it no longer belongs to that mesocycle

### Requirement: Macrocycle API
The HTTP API SHALL let the coach of an athlete create and change the
athlete's macrocycle, set week levels, set the exercises of each mesocycle,
set the mesocycle borders, and read the macrocycle with mesocycles, week
levels and all calculated values per week. Invalid input SHALL be answered with 400
`VALIDATION_FAILED` and field codes; other Teams' athletes with 404
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
