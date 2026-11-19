# macrocycle-planning Specification

## Purpose

Lets a coach plan an athlete's macrocycle towards a main competition: its
base data, how the load develops week by week, and the exercises of each
mesocycle.

## Requirements

### Requirement: Macrocycle base data
Step 1 (base data) SHALL have two sections. "Historical data": personal
bests in snatch and clean & jerk, body weight, body fat and muscle mass
(the last two optional). "New macrocycle plan": start date (a Monday),
duration (7–52 weeks), date and type of the main competition, entry value
(30–95 %, default 60 %), goals in snatch and clean & jerk, target body
weight and the weekly schedule. All other values SHALL be required; a
duration that would remove planned weeks SHALL be refused.

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

#### Scenario: Shortening below planned weeks
- **GIVEN** a 21-week macrocycle with a week plan for week 20
- **WHEN** the coach changes the duration to 18 weeks
- **THEN** the change is refused and the duration field says that weeks with a week plan would be removed

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
- **THEN** they are sent to the home page if they lead no Team, and see the "not found" page if they lead another Team

### Requirement: Planning in four steps
The planning SHALL consist of four steps on one page that the coach goes
through in order and can revisit anytime: 1. base data, 2. SWOT, 3.
intensity chart with week levels, 4. exercises per mesocycle. The page
SHALL show a stepper and the title "<first name>'s macrocycle planning".
Choosing another step while the current step's form has unsaved changes
SHALL ask whether to save or discard them. After step 4 the macrocycle
SHALL be planned and the coach returns to the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, continue through the chart and choose exercises
- **THEN** the macrocycle is saved after each step, all steps are on one page, and "Finish" takes them to the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

#### Scenario: Stepper during planning
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach is in step 3
- **THEN** the stepper shows steps 1 and 2 as completed with a check mark, step 3 as current and step 4 as upcoming, joined by a line, and steps 1, 2 and 4 open their step when chosen

#### Scenario: Stepper before the macrocycle exists
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning
- **THEN** step 1 is current and steps 2–4 are shown disabled and cannot be chosen; after saving step 1 they can be chosen

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach opens the planning in any step
- **THEN** the page title is "Anna's macrocycle planning" ("Makrozyklusplanung für Anna" in German), and there is no separate name line above it

#### Scenario: Unsaved changes when changing the step
- **GIVEN** the coach changed the strengths in step 2 without saving
- **WHEN** they choose step 1 in the stepper
- **THEN** a dialog asks "Save changes?" with "Save", "Discard" and "Cancel" in this order; "Save" stores the SWOT and opens step 1, "Discard" opens step 1 without storing, "Cancel" keeps step 2 with the changes

#### Scenario: Saving fails in the dialog
- **GIVEN** the dialog after changing step 2
- **WHEN** the coach chooses "Save" and the input is invalid
- **THEN** step 2 stays open and shows the marked fields

#### Scenario: No unsaved changes
- **WHEN** the coach chooses another step without changing anything
- **THEN** the step opens without a dialog

### Requirement: Intensity chart with week handles
Step 3 SHALL show the week chart fitting the screen width with the y-axis
("Intensity", in %), weeks on the x-axis ("Week"), each week's number and
point on the line where its block starts, the intensity as the curve with
one pink handle per week, ▲/▼ above or below high and low weeks, and a
slider on each of the two block borders. Each handle SHALL move one 5 %
step up (high week) or down (low week) by dragging or tapping; in between
it is medium.

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
- **THEN** no area is coloured by mesocycle; thin lines at weeks 1, 4 and 14 are labelled GPB, SPB and CPB, and the legend names the three mesocycles

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart
- **THEN** the point and the number of week 4 are exactly on the line where the special preparation block begins

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
Every chart SHALL mark the main competition with a dashed vertical line at
its date and a label with only its name (no date) in the style of the
mesocycle labels, one row above them, so neither hides the other; screen
readers get the name and date. A competition after the last week SHALL be
marked at the end of the chart.

#### Scenario: Competition in the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the German Championships on Saturday 2027-04-24
- **WHEN** the coach opens step 3
- **THEN** a vertical line marks Saturday of week 21, labelled "German Championships" above the chart

#### Scenario: Label above the chart
- **WHEN** the coach looks at the chart
- **THEN** the competition's label is one row above the mesocycle labels, covers no week point, and every mesocycle label stays visible, also on a phone

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
- **WHEN** the coach chooses exercise 1 for the general preparation block with the variation "No feet snatch" and the own reason "Footwork in the turnover"
- **THEN** the cell shows the variation, and the choice keeps the variation and the reason

#### Scenario: No variation
- **WHEN** the coach chooses an exercise without a variation
- **THEN** its cell shows only the check mark, no text

#### Scenario: Prefill from another block
- **GIVEN** exercise 7 chosen for the general preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks"
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column
- **THEN** no dialog opens; exercise 7 is chosen and saved for the special preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks", and its cell shows the check mark and "From blocks"

#### Scenario: Remove an exercise
- **GIVEN** exercise 13 chosen for a mesocycle
- **WHEN** the coach removes it in its cell
- **THEN** it no longer belongs to that mesocycle

### Requirement: Exercise table summary
Above the exercise table, step 4 SHALL show all of the athlete's deficits
(snatch, clean, jerk and other) instead of an explanation text. Below the
table, a total row SHALL show the number of chosen exercises per mesocycle.

#### Scenario: Deficits above the table
- **WHEN** the coach opens step 4
- **THEN** the snatch, clean, jerk and other deficits are shown above the table

#### Scenario: Totals
- **GIVEN** exercises 1, 7 and 13 chosen for the special preparation block and none for the others
- **WHEN** the coach looks at the end of the table
- **THEN** the total row shows 0, 3 and 0, and it changes as soon as an exercise is chosen or removed

### Requirement: Reason of a chosen exercise
The reason of a chosen exercise SHALL consist of points the exercise
addresses (tags to tap) and/or any number of own reasons (free texts),
added with a "+" tag after the exercise's tags; at least one is required.

#### Scenario: Reason as tags
- **WHEN** the coach chooses exercise 7 and taps the tags "Beschleunigung im 2. Zug" and "Hoher Zug"
- **THEN** the choice has these two tags as its reason

#### Scenario: Reason required
- **WHEN** the coach tries to choose an exercise without a tag and without own reasons
- **THEN** it is not chosen and the dialog shows that a reason is required

#### Scenario: Own reasons
- **WHEN** the coach taps "+", types "Back strength, Grip" and Enter, taps "+" again, types "Core" and Enter, and saves
- **THEN** the choice has the own reasons "Back strength", "Grip" and "Core", each shown as a selected tag with a remove button, and a new "+" after them

#### Scenario: Cancel an own reason
- **WHEN** the coach taps "+", types a text and taps the X next to the field
- **THEN** the text is discarded and the "+" is shown again

#### Scenario: Only the exercise's tags
- **WHEN** a choice of exercise 7 is saved with a tag exercise 7 does not address
- **THEN** it is rejected

### Requirement: Deficits in the exercise dialog
The dialog of a cell SHALL show only the athlete's deficits for the
exercise's reference lift, each under its own title: the snatch deficits
for a snatch exercise, the clean and the jerk deficits for a clean & jerk
exercise, and no deficits for an exercise without a reference lift.

#### Scenario: Snatch exercise
- **WHEN** the coach taps "+" for exercise 7 (power snatch)
- **THEN** the dialog shows only the snatch deficits

#### Scenario: Exercise without reference lift
- **WHEN** the coach taps "+" for exercise 33 (pull-up)
- **THEN** the dialog shows no deficits

### Requirement: Macrocycle API
The HTTP API SHALL let the coach create and change an athlete's
macrocycle (base data, week levels, mesocycle exercises and borders) and
read it with all calculated values per week; the linked user SHALL be able
to read it. Errors: 400 `VALIDATION_FAILED` with field codes, 404
`ATHLETE_NOT_FOUND` for other users, 409 `MACROCYCLE_EXISTS`, 404
`MACROCYCLE_NOT_FOUND`.

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
- **THEN** nothing changes, and the response has status 403 `NOT_A_COACH` if they lead no Team, or 404 `ATHLETE_NOT_FOUND` if they lead another Team

### Requirement: Weekly schedule
Instead of a number of sessions per week, the base data SHALL show a week
(Monday–Sunday) in which the coach picks up to three training sessions per
day, at least 1 and at most 14 per week. The training frequency SHALL be
the number of picked sessions. New week plans SHALL start with these
sessions. Changing the schedule SHALL not change existing week plans.

#### Scenario: Pick sessions
- **WHEN** the coach picks two sessions on Monday and one each on Wednesday and Friday and saves
- **THEN** the macrocycle has the weekly schedule Monday 1, Monday 2, Wednesday, Friday and a training frequency of 4

#### Scenario: No session picked
- **WHEN** the coach saves the base data without any session in the week
- **THEN** the form shows that at least one training session is required

#### Scenario: Fourth session on a day
- **GIVEN** three sessions on Tuesday
- **THEN** no further session can be added to Tuesday

### Requirement: One week chart
The intensity chart of the planning, the exercise chart of the macrocycle
view and the chart on the athlete page SHALL be one chart element in the
same minimal style (one smoothed curve, its colour fading downwards below it, a thin line at each block start, week numbers). The
intensity chart's curve SHALL be magenta #ba2db3. Parameters SHALL set the curve's colours and switch its parts on or off: the y-axis, axis titles, a
visible legend, the current-week line, the week handles and the sliders.

#### Scenario: Same look in planning and view
- **WHEN** the coach compares the chart in step 3 with the chart in the macrocycle view
- **THEN** both show a smoothed curve with a gradient and block start lines; step 3's curve is magenta and only step 3 shows the y-axis, the handles and the sliders

### Requirement: Chart ends at the main competition
When the main competition falls after the start of the last week, every
chart SHALL continue the curve at the last week's value up to the
competition's line and end there. Otherwise the chart SHALL end at the
last week's point.

#### Scenario: Competition on Saturday of the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the main competition on Saturday 2027-04-24
- **WHEN** the coach or athlete looks at any chart of it
- **THEN** the curve continues from week 21's point to the competition line, which is the right end of the chart

### Requirement: Chart proportions
Every chart SHALL keep its desktop proportions on narrower screens: the
plot's height shrinks with its width (never taller than on desktop), so
the chart gets smaller instead of squished.

#### Scenario: Chart on a phone
- **WHEN** the coach or athlete looks at a chart on a 390 px wide phone
- **THEN** the plot has the same ratio of height to width as on desktop

### Requirement: Planning steps on one page
The four planning steps SHALL be on one page. Choosing a step in the
stepper, "Continue" or "Back" SHALL switch the step without navigating to
another page and without a loading state. The page SHALL keep the current
step in its address (`?step=base-data|swot|intensity|exercises`), so a
reload or a shared link opens that step; without a macrocycle it SHALL open
step 1. The former step addresses SHALL lead to the planning page at that
step.

#### Scenario: Switch steps without loading
- **GIVEN** a coach in step 2 of an athlete with a macrocycle
- **WHEN** they choose step 3 in the stepper
- **THEN** the intensity chart is shown at once, no loading placeholder appears, the page is not reloaded, and the address ends with `?step=intensity`

#### Scenario: Reload keeps the step
- **GIVEN** a coach in step 4 of the planning
- **WHEN** they reload the page
- **THEN** step 4 is open again

#### Scenario: Step address without a macrocycle
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning with `?step=exercises`
- **THEN** step 1 is open and steps 2–4 are disabled

#### Scenario: Old step address
- **WHEN** the coach opens `/athletes/<id>/macrocycle/intensity`
- **THEN** the planning page opens at step 3

#### Scenario: Latest data in every step
- **GIVEN** a 21-week macrocycle
- **WHEN** the coach changes the duration to 24 weeks in step 1, continues and then chooses step 3
- **THEN** the chart in step 3 shows 24 weeks without reloading the page

### Requirement: Slide between planning steps
Switching planning steps SHALL slide the new step in like the week editor's
steps (about 300 ms, sliding and fading in): from the right when going to a
later step, from the left when going to an earlier one. With reduced motion
there SHALL be no animation.

#### Scenario: Forward and back
- **WHEN** the coach goes from step 2 to step 3, and then back to step 2
- **THEN** step 3 slides in from the right, and step 2 slides in from the left

#### Scenario: Reduced motion
- **GIVEN** the device asks for reduced motion
- **WHEN** the coach switches steps
- **THEN** the new step appears without sliding

### Requirement: Copy a choice from another block
Choosing an exercise in a mesocycle while it is already chosen in another
one SHALL copy the reasons and the variation of the first block that has
it (general, special, then competition preparation) and save them without
a dialog. When that choice has no reason, the dialog SHALL open with it as
the starting point instead.

#### Scenario: Copy from the first block that has it
- **GIVEN** exercise 7 chosen for the general preparation block with the variation "From blocks" and for the special preparation block with the variation "Hang"
- **WHEN** the coach taps "+" for exercise 7 in the competition preparation column
- **THEN** it is chosen with the variation "From blocks"

#### Scenario: Source without a reason
- **GIVEN** exercise 7 chosen for the general preparation block without a tag and without own reasons ("Reason missing")
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column
- **THEN** the dialog opens with the variation of the general preparation block, and nothing is saved until the coach chooses the exercise with a reason

#### Scenario: Copy cannot be saved
- **GIVEN** exercise 7 chosen for the general preparation block
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column and saving fails
- **THEN** the cell stays empty and the step shows "The change could not be saved. Please try again."

#### Scenario: Change a copied choice
- **GIVEN** exercise 7 copied into the special preparation block
- **WHEN** the coach taps its cell
- **THEN** the dialog opens with the copied reasons and variation, to change or remove them
