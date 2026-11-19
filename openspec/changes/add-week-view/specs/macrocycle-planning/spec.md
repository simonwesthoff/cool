## ADDED Requirements

### Requirement: One week chart
The intensity chart of the planning, the exercise chart of the macrocycle
view and the chart on the athlete page SHALL be one chart element in the
same minimal style (one smoothed pink #ba2db3 curve with a gradient fading
downwards, a thin line at each block start, week numbers). Parameters
SHALL switch its parts on or off: the y-axis, axis titles, a visible
legend, the current-week line, the week handles and the border sliders.

#### Scenario: Same look in planning and view
- **WHEN** the coach compares the chart in step 3 with the chart in the macrocycle view
- **THEN** both show the same pink curve, gradient and block start lines; only step 3 shows the y-axis, the handles and the sliders

### Requirement: Chart ends at the main competition
When the main competition falls after the start of the last week, every
chart SHALL continue the curve at the last week's value up to the
competition's line and end there. Otherwise the chart SHALL end at the
last week's point.

#### Scenario: Competition on Saturday of the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the main competition on Saturday 2027-04-24
- **WHEN** the coach or athlete looks at any chart of it
- **THEN** the curve continues from week 21's point to the competition line, which is the right end of the chart

## MODIFIED Requirements

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

### Requirement: Main competition in the chart
Every chart SHALL mark the main competition with a dashed vertical line at
its date and a label with only its name (no date), above the chart in the
row and style of the mesocycle labels; screen readers get the name and
date. A mesocycle label overlapping it SHALL be hidden. A competition after
the last week SHALL be marked at the end of the chart.

#### Scenario: Competition in the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the German Championships on Saturday 2027-04-24
- **WHEN** the coach opens step 3
- **THEN** a vertical line marks Saturday of week 21, labelled "German Championships" above the chart

#### Scenario: Label above the chart
- **WHEN** the coach looks at the chart
- **THEN** the competition's label is in the row of the mesocycle labels, so it covers no week point

## REMOVED Requirements

### Requirement: Mesocycle colours in the app
**Reason**: The user removed the association of mesocycles with colours: charts mark block starts with thin lines and the exercise table shows no colour bars.
**Migration**: Mesocycles are identified by their labels (GPB/SPB/CPB, GLP/ABP/LAP) and the legend; the palette's magenta is only the curve colour of the week chart.
