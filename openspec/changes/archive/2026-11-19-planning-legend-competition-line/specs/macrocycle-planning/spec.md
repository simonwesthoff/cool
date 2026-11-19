## ADDED Requirements

### Requirement: No visible legend in the planning chart
The planning chart in step 3 SHALL show no legend on screen; its legend
(mesocycles, high and low weeks, main competition) SHALL stay available to
screen readers, as in the exercise chart.

#### Scenario: Step 3 without a legend
- **WHEN** the coach opens step 3
- **THEN** no legend is shown above the chart, and screen readers still find the legend with the three block names, "High / low week" and "Main competition"

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
- **THEN** no area is coloured by mesocycle, and thin lines at weeks 1, 4 and 14 are labelled GPB, SPB and CPB

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart
- **THEN** the point and the number of week 4 are exactly on the line where the special preparation block begins

### Requirement: Mesocycle abbreviations
The mesocycles SHALL have abbreviations: GLP, ABP and LAP in German; GPB
(general preparation block), SPB (special preparation block) and CPB
(competition preparation block) in English. The labels above the chart,
the tooltips and the exercise table's column headers SHALL use them; the
legend for screen readers SHALL use the full names.

#### Scenario: English labels
- **WHEN** the coach looks at the chart in English
- **THEN** the mesocycle labels above the chart read "GPB", "SPB" and "CPB"

### Requirement: Main competition in the chart
Every chart SHALL mark the main competition with a dashed vertical line at
its date and a label with only its name (no date) in the style of the
mesocycle labels, one row above them, so neither hides the other. The line
SHALL reach from the plot's bottom up to the top of the name, with a gap
where it would cross a mesocycle label. Screen readers get the name and
date. A competition after the last week SHALL be
marked at the end of the chart.

#### Scenario: Competition in the last week
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30 with the German Championships on Saturday 2027-04-24
- **WHEN** the coach opens step 3
- **THEN** a vertical line marks Saturday of week 21, labelled "German Championships" above the chart

#### Scenario: Label above the chart
- **WHEN** the coach looks at the chart
- **THEN** the competition's label is one row above the mesocycle labels, covers no week point, and every mesocycle label stays visible, also on a phone

#### Scenario: Line up to the name
- **WHEN** the coach or athlete looks at any chart with a main competition
- **THEN** the dashed line continues above the plot up to the top of the competition's name, which sits next to the line's end

#### Scenario: Gap over a block label
- **GIVEN** a macrocycle whose competition preparation block starts a few days before the main competition, so the extended line would run through the label "CPB"
- **WHEN** the coach looks at the chart
- **THEN** the line stops above and resumes below the label's row, and "CPB" is fully visible

#### Scenario: No gap when nothing is crossed
- **GIVEN** the main competition weeks after the last block start
- **WHEN** the coach looks at the chart
- **THEN** the line runs without a gap from the plot's bottom to the top of the name
