## ADDED Requirements

### Requirement: Chart colour by lift category
The exercise chart's curve, its area and its hover dot SHALL have the
colour of the exercise's lift category; for an exercise with two
categories a gradient from left to right, purple (clean) left and magenta
(jerk) right; neutral grey for an exercise without a category.

#### Scenario: Colour follows the exercise
- **WHEN** the coach chooses exercise 4 "Umsetzen", then exercise 5 "Ausstoßen", then exercise 3 "Stoßen"
- **THEN** the curve is purple, then magenta, then runs from purple on the left to magenta on the right (clean and jerk), its area in the same colours

## MODIFIED Requirements

### Requirement: Exercise chart
The view SHALL show a read-only chart of one planned value of one exercise
for every week, calculated as in planning even in weeks whose mesocycle
does not use the exercise: the best value (kg), the average weight (kg),
the set size or the weekly reps. It SHALL be the week chart without a
y-axis and with the current week: one smoothed curve without point
handles in the colour of the exercise's lift category (see below), a gradient below it, and week numbers on the x-axis.

#### Scenario: Best value of the snatch by default
- **GIVEN** a 21-week macrocycle with a snatch goal of 100 kg and entry value 60 %
- **WHEN** the coach opens the view
- **THEN** the chart shows the best value of exercise 1 (snatch) as the only curve, with 80 kg in week 11, in cyan with a fading cyan gradient below and without a y-axis

#### Scenario: Read-only
- **WHEN** the coach or the athlete drags inside the chart
- **THEN** nothing changes and nothing is saved
