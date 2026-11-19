## MODIFIED Requirements

### Requirement: Exercise chart
The view SHALL show a read-only chart of one planned value of one exercise
for every week, calculated as in planning even in weeks whose mesocycle
does not use the exercise: the best value (kg), the average weight (kg),
the set size or the weekly reps. It SHALL be the week chart (see
macrocycle planning) without a y-axis and with the current week: one
smoothed pink curve without point handles, a gradient below it, and only
week numbers on the x-axis.

#### Scenario: Best value of the snatch by default
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the coach opens the view
- **THEN** the chart shows the best value of exercise 1 (snatch) as the only curve, with 80 kg in week 11, in pink with a fading gradient below and without a y-axis

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags inside the chart
- **THEN** nothing changes and nothing is saved

### Requirement: Exercise chart legend
The exercise chart's legend (mesocycles, main competition, current week)
SHALL be hidden on screen for now (user decision) and stay available to
screen readers. The mesocycles SHALL have no colours in this chart: a thin
vertical line marks the week each mesocycle starts, labelled with its
abbreviation above the plot. The main competition marker stays.

#### Scenario: No visible legend
- **WHEN** the coach or the athlete looks at the exercise chart on the athlete's page or in the macrocycle view
- **THEN** no legend is shown, no area is coloured by mesocycle, and thin lines at weeks 1, 4 and 14 carry the labels GPB, SPB and CPB

### Requirement: Current week
The exercise chart SHALL mark the week of the macrocycle that contains
today with a solid vertical line at that week's value. Its week number
below the chart SHALL always be shown in bold with "Current" in bold
underneath, kept inside the chart at both ends; week numbers too close to
it give way. There SHALL be no text above the line. Before the start and
after the end of the macrocycle there SHALL be no such marking.

#### Scenario: During the macrocycle
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on Wednesday 2027-01-06
- **THEN** a solid line marks week 6 in the chart, and the week number 6 below it is bold with a bold "Current" under it

#### Scenario: Before the start or after the end
- **GIVEN** a 21-week macrocycle from Monday 2026-11-30
- **WHEN** the view is opened on 2026-11-20 or on 2027-05-03
- **THEN** no week is marked
