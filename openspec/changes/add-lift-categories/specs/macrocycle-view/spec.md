## MODIFIED Requirements

### Requirement: Exercise chart
The view SHALL show a read-only chart of one planned value of one exercise
for every week, calculated as in planning even in weeks whose mesocycle
does not use the exercise: the best value (kg), the average weight (kg),
the set size or the weekly reps. It SHALL be the week chart without a
y-axis and with the current week: one smoothed curve without point
handles, in the colour of the exercise's lift category (for two, a
gradient from purple on the left to magenta on the right; neutral without
one), a gradient below it, and week numbers on the x-axis.

#### Scenario: Best value of the snatch by default
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the coach opens the view
- **THEN** the chart shows the best value of exercise 1 (snatch) as the only curve, with 80 kg in week 11, in cyan with a fading cyan gradient below and without a y-axis

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags inside the chart
- **THEN** nothing changes and nothing is saved

#### Scenario: Colour follows the exercise
- **WHEN** the coach chooses exercise 4 "Umsetzen", then exercise 5 "Ausstoßen", then exercise 3 "Stoßen"
- **THEN** the curve is purple, then magenta, then runs from purple on the left to magenta on the right (clean and jerk), its area in the same colours
