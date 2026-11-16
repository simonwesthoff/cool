# Spec Delta

## Purpose

Lets a coach plan an athlete's macrocycle towards a main competition: its
base data, how the load develops week by week, and the exercises of each
mesocycle.

## ADDED Requirements

### Requirement: Macrocycle base data
Step 1 (base data) SHALL have two sections. "Historical data": personal
bests in snatch and clean & jerk (kg), current body weight (kg), body fat
and muscle mass (%, optional). "New macrocycle plan": start date (a
Monday), duration (7–52 weeks), date and type of the main competition,
entry value (30–95 %, default 60 %), goals in snatch and clean & jerk (kg),
target body weight (kg) and training sessions per week (1–14). All except
body fat and muscle mass SHALL be required.

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

### Requirement: SWOT
Step 2 (SWOT) SHALL contain, in this order: strengths, the deficits,
weightlifting experience, focus points, and injuries and illnesses, all
required. The macrocycle SHALL be created in step 1 without them; the SWOT
step saves them together.

#### Scenario: SWOT after the base data
- **GIVEN** a new macrocycle saved in step 1
- **WHEN** the coach fills in the SWOT step and saves
- **THEN** the macrocycle has these values and the coach continues to the intensity step

#### Scenario: SWOT values missing
- **WHEN** the coach saves the SWOT step without strengths
- **THEN** nothing is saved and the form shows that the strengths are required

### Requirement: Deficits per lift
The SWOT SHALL contain the athlete's deficits as four required texts:
snatch, clean, jerk and other deficits.

#### Scenario: Deficits per lift
- **WHEN** the coach saves the SWOT step without jerk deficits
- **THEN** nothing is saved and the form shows that the jerk deficits are required

### Requirement: Focus points
A macrocycle SHALL have an ordered list of 1 to 3 focus points (texts of up
to 200 characters each). The coach SHALL be able to add, remove and reorder
them in the SWOT step.

#### Scenario: Focus points
- **WHEN** the coach enters the focus points "Turnover", "Squat strength" and "Jerk stability" in this order and saves
- **THEN** the macrocycle has these three focus points in this order

#### Scenario: Number of focus points
- **WHEN** the coach saves the SWOT step without a focus point, or tries to add a fourth one
- **THEN** the form shows that 1 to 3 focus points are needed, and no fourth field can be added

### Requirement: One macrocycle per athlete
An athlete SHALL have at most one macrocycle. Only the coach of the
athlete's Team SHALL create, see or change it.

#### Scenario: Plan an athlete without a macrocycle
- **GIVEN** an athlete of the coach's Team without a macrocycle
- **WHEN** the coach completes step 1 of the planning
- **THEN** the athlete has a macrocycle with the entered base data, an empty SWOT, default mesocycles and only medium weeks

#### Scenario: Another coach
- **WHEN** a coach opens the planning of an athlete of another Team
- **THEN** they see the "not found" page

### Requirement: Planning in four steps
The planning SHALL consist of four steps the coach goes through in order
and can revisit at any time: 1. base data, 2. SWOT, 3. intensity chart with
week levels, 4. exercises per mesocycle. After step 4 the macrocycle SHALL
be planned and the coach returns to the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, continue through the chart and choose exercises
- **THEN** the macrocycle is saved after each step and they end on the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

### Requirement: Intensity chart with week handles
Step 3 SHALL show the macrocycle chart fitting the screen width: weeks on
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
- **WHEN** the coach opens step 3 on a phone
- **THEN** all 52 weeks are visible without scrolling sideways

#### Scenario: No volume in the planning chart
- **GIVEN** exercises are chosen for the mesocycles
- **WHEN** the coach looks at the chart in step 3
- **THEN** the chart and its tooltips show the intensity only, no volume

#### Scenario: Mesocycle colours
- **WHEN** the coach looks at the chart of a 21-week macrocycle
- **THEN** weeks 1–3 have a #6f3ab1, weeks 4–13 a #ba2db3 and weeks 14–21 a #3bc8c8 background, with a legend and labels naming the three mesocycles

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart
- **THEN** the point and the number of week 4 are exactly on the border where the special preparation background begins

### Requirement: Mesocycle abbreviations
The mesocycles SHALL have abbreviations: GLP, ABP and LAP in German; GPB
(general preparation block), SPB (special preparation block) and CPB
(competition preparation block) in English. The labels above the chart,
the tooltips and the exercise table's column headers SHALL use them; the
legend SHALL use the full names.

#### Scenario: English labels
- **WHEN** the coach looks at the chart in English
- **THEN** the mesocycle labels above the chart read "GPB", "SPB" and "CPB"

### Requirement: Main competition in the chart
The chart in step 3 SHALL mark the main competition with a vertical line
at its date and a label with only its type and date, above the chart in
the row and style of the mesocycle labels, and name it in the legend. A
mesocycle label overlapping it SHALL be hidden. A competition after the
last week SHALL be marked at the end of the chart.

#### Scenario: Competition in the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the German Championships on Saturday 2027-04-24
- **WHEN** the coach opens step 3
- **THEN** a vertical line marks Saturday of week 21, labelled "German Championships · Apr 24, 2027" above the chart

#### Scenario: Label above the chart
- **WHEN** the coach looks at the chart
- **THEN** the competition's label is in the row of the mesocycle labels, so it covers no week point

### Requirement: Week tooltip
Pointing at a week in the chart SHALL show a tooltip of three lines: the
intensity with the week level in parentheses, "Week n from <start date>",
and the abbreviation of the week's mesocycle. It SHALL NOT show the volume
and SHALL never cover the pointer or the week's point.

#### Scenario: Tooltip content
- **GIVEN** week 11 of a macrocycle starting Monday 2026-11-23 is a high week at 85 % in the special preparation block
- **WHEN** the coach points at it in English
- **THEN** the tooltip reads "85% (high)", "Week 11 from Feb 1, 2027" and "SPB"

#### Scenario: Tooltip near the top right
- **GIVEN** a week whose point is at the top right of the chart
- **WHEN** the coach points at it
- **THEN** its tooltip appears where it covers neither the pointer nor the point

### Requirement: Adjustable mesocycle borders
In step 3, the coach SHALL be able to move the two borders between the
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
Step 4 SHALL show one table of the exercise catalog, grouped by exercise
group, with one row per exercise and one column per mesocycle (GLP, ABP,
LAP). In each cell the coach SHALL be able to choose the exercise for that
mesocycle with a reason and an optional variation (free text, the catalog
comment as a hint), change both later, or remove the choice. The same
exercise MAY be chosen for several mesocycles. The variation SHALL NOT
change the calculated values.

#### Scenario: Choose exercises
- **WHEN** the coach chooses exercises 1, 13 and 19 in the special preparation column, each with a reason
- **THEN** these three exercises belong to that mesocycle with their reasons

#### Scenario: Variation and note
- **WHEN** the coach chooses exercise 1 for the general preparation block with the variation "No feet snatch" and the note "Footwork in the turnover"
- **THEN** the cell shows the variation, and the choice keeps the variation and the note

#### Scenario: Remove an exercise
- **GIVEN** exercise 13 chosen for a mesocycle
- **WHEN** the coach removes it in its cell
- **THEN** it no longer belongs to that mesocycle

### Requirement: Reason of a chosen exercise
The reason of a chosen exercise SHALL consist of one or more of the points
the exercise addresses (tags to tap) and/or a free-text note; at least one
of them is required.

#### Scenario: Reason as tags
- **WHEN** the coach chooses exercise 7 and taps the tags "Beschleunigung im 2. Zug" and "Hoher Zug"
- **THEN** the choice has these two tags as its reason

#### Scenario: Reason required
- **WHEN** the coach tries to choose an exercise without a tag and without a note
- **THEN** it is not chosen and the dialog shows that a reason is required

#### Scenario: Only the exercise's tags
- **WHEN** a choice of exercise 7 is saved with a tag exercise 7 does not address
- **THEN** it is rejected

### Requirement: Deficits in the exercise dialog
The dialog of a cell SHALL show the athlete's deficits for the exercise's
reference lift: the snatch deficits for a snatch exercise, the clean and the
jerk deficits for a clean & jerk exercise, and the other deficits for every
exercise.

#### Scenario: Snatch exercise
- **WHEN** the coach taps "+" for exercise 7 (power snatch)
- **THEN** the dialog shows the snatch deficits and the other deficits, but not the clean and jerk deficits

#### Scenario: Exercise without reference lift
- **WHEN** the coach taps "+" for exercise 33 (pull-up)
- **THEN** the dialog shows only the other deficits

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
