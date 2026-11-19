## MODIFIED Requirements

### Requirement: Exercise chart
The view SHALL show a read-only chart of one planned value of one exercise
for every week, calculated as in planning even in weeks whose mesocycle
does not use the exercise: the best value (kg), the average weight (kg),
the set size or the weekly reps. It SHALL be minimal (user decision): one
smoothed curve as a single pink stroke without point handles or outline,
a pink gradient below it fading downwards, no y-axis and no values on it.
The x-axis SHALL show only week numbers. It is the week chart without
the y-axis, with the current week.

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
