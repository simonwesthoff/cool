## ADDED Requirements

### Requirement: Curve and weeks modes
Step 3 SHALL have a switch "Curve" / "Weeks" ("Kurve" / "Wochen") above the
chart and SHALL open in "Curve". In "Curve" the chart SHALL show the
progression curve with its anchors and no week handles or block sliders;
in "Weeks" it SHALL show the week handles and block sliders on top of the
current curve. Each mode SHALL have its own help text.

#### Scenario: Opening step 3
- **WHEN** the coach opens step 3
- **THEN** "Curve" is selected, the anchors are shown, and there are no week handles and no block sliders

#### Scenario: Switching to weeks
- **WHEN** the coach chooses "Weeks"
- **THEN** the anchors disappear and the week handles and block sliders appear on the same curve

### Requirement: Editing anchors
In "Curve" mode a click on the chart outside an anchor SHALL add an anchor
there. Inner anchors SHALL drag smoothly in all directions without
snapping; a click on one, or dragging it to the chart's left or right
edge, SHALL remove it. The entry anchor SHALL move only up and down and
set the entry value (30–95 %); the end anchor SHALL stay fixed. Neither
can be removed. Each change SHALL be saved on release.

#### Scenario: Add an anchor
- **GIVEN** a new 21-week macrocycle with entry value 60 %
- **WHEN** the coach clicks the chart at week 6 at 90 %
- **THEN** an anchor appears there, the curve runs smoothly through it, and it is saved

#### Scenario: Drag without snapping
- **WHEN** the coach drags an inner anchor from week 6 to between weeks 8 and 9
- **THEN** the anchor follows the pointer continuously and stays between weeks 8 and 9 after release

#### Scenario: Remove by click or edge
- **WHEN** the coach clicks an inner anchor, or drags it to the right edge of the chart
- **THEN** the anchor is removed and the curve is recalculated without it

#### Scenario: Entry anchor sets the entry value
- **WHEN** the coach drags the entry anchor from 60 % up to 65 %
- **THEN** the entry value is 65 %, also in step 1, and clicking the entry anchor removes nothing

#### Scenario: End anchor fixed
- **WHEN** the coach tries to drag or click the end anchor
- **THEN** it stays at 100 % in the last week

#### Scenario: Saving fails
- **WHEN** saving an anchor change fails
- **THEN** the curve returns to its stored shape and the step says the change could not be saved

### Requirement: Curve API
The HTTP API SHALL let the coach set a macrocycle's entry value and inner
anchors (`PUT …/macrocycle/curve`) and return the macrocycle with all
recalculated weeks. Positions SHALL be strictly between 0 and 1 and
distinct, values 0–100 %, at most 20 inner anchors, the entry value 30–95
%; otherwise 400 `VALIDATION_FAILED`. The linked user SHALL not change it.

#### Scenario: Set the curve
- **WHEN** the coach puts entry value 60 % and one anchor at position 0.25 with 90 %
- **THEN** the response has status 200 and week 6 of 21 has intensity 90 %

#### Scenario: Invalid anchor
- **WHEN** the coach puts an anchor at position 1 or with 120 %
- **THEN** the response has status 400 `VALIDATION_FAILED` and nothing changes

#### Scenario: Not the coach
- **WHEN** the linked athlete puts a curve
- **THEN** the response has status 403 or 404 as for the other planning changes, and nothing changes

## MODIFIED Requirements

### Requirement: Intensity chart with week handles
Step 3 SHALL show the week chart fitting the screen width with the y-axis
("Intensity", in %), weeks on the x-axis ("Week"), each week's number and
point on the line where its block starts, and the intensity as the curve.
In "Weeks" mode it SHALL show one pink handle per week, ▲/▼ above or below
high and low weeks, and a slider on each block border. Each handle SHALL
move one 5 % step up (high week) or down (low week) by dragging or
tapping.

#### Scenario: Make a week high
- **GIVEN** week 11 at 80 % intensity in "Weeks" mode
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
- **WHEN** the coach looks at the chart in "Weeks" mode
- **THEN** the point and the number of week 4 are exactly on the line where the special preparation block begins
