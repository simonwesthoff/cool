# macrocycle-calculation Specification

## Purpose

Defines how the planned values of every week of a macrocycle are calculated
from the macrocycle's base data, its week levels and the exercise catalog,
so that charts and weekly plans show the same numbers everywhere.

## Requirements

### Requirement: Cycle progress
For week k of a macrocycle with N weeks, the cycle progress SHALL be
t = (k−1)/(N−1): 0 in the first week and 1 in the last week.

#### Scenario: First, middle and last week
- **GIVEN** a macrocycle of 21 weeks
- **WHEN** the cycle progress is calculated
- **THEN** week 1 has 0, week 11 has 0.5 and week 21 has 1

### Requirement: Intensity curve
The intensity of a week SHALL follow the modified sine curve
((1−E)/2)·sin(t·π − π/2) + E + (1−E)/2 for the entry value E and the cycle
progress t, rising from E in the first week to 100 % in the last week. A
high week SHALL add 5 percentage points, a low week SHALL subtract 5
percentage points.

#### Scenario: Entry value 60 %
- **GIVEN** a macrocycle of 21 weeks with entry value 60 % and only medium weeks
- **WHEN** the intensities are calculated
- **THEN** week 1 has 60 %, week 6 has 65.9 %, week 11 has 80 %, week 16 has 94.1 % and week 21 has 100 %

#### Scenario: High and low weeks
- **GIVEN** the same macrocycle where week 11 is a high week
- **WHEN** its intensity is calculated
- **THEN** it is 85 %; as a low week it would be 75 %

### Requirement: Best value and average weight per exercise
For an exercise with a reference lift, the planned best value of a week
SHALL be intensity × the exercise's best value (%) × the macrocycle's goal
in the reference lift, and the planned average weight (mHG) SHALL be
intensity × the exercise's max. weekly average weight (%) × that goal. Both
SHALL be rounded to whole kilograms (halves rounded up). Exercises without the respective catalog value
or without a reference lift SHALL have no planned value.

#### Scenario: Snatch pull in the middle of the cycle
- **GIVEN** a macrocycle of 21 weeks, entry value 60 %, snatch goal 100 kg, and exercise 13 "Zug breit" (snatch, best value 108 %, max. weekly average weight 94 %)
- **WHEN** the values of week 11 (medium) are calculated
- **THEN** the planned best value is 86 kg (86.4 rounded) and the planned average weight is 75 kg (75.2 rounded)

#### Scenario: High week
- **GIVEN** the same macrocycle where week 11 is a high week
- **WHEN** the planned best value of exercise 13 is calculated
- **THEN** it is 92 kg (85 % × 108 % × 100 kg = 91.8, rounded)

#### Scenario: Clean & jerk exercise
- **GIVEN** a clean & jerk goal of 130 kg and exercise 19 "Kniebeuge vorn" (clean & jerk, best value 105 %)
- **WHEN** the planned best value of the last week is calculated
- **THEN** it is 137 kg (136.5 rounded up)

#### Scenario: Exercise without values
- **WHEN** the values of exercise 31 "Bankdrücken" are calculated
- **THEN** it has no planned best value, average weight, set size or weekly reps

### Requirement: Set size and weekly reps per exercise
The planned set size and weekly reps of an exercise SHALL fall from the
exercise's maximum in the first week to its minimum in the last week along
the same curve shape: max − (max − min)·(sin(t·π − π/2) + 1)/2, rounded to
whole repetitions. In a high week the weekly reps SHALL be 5 % higher, in a
low week 5 % lower; the set size SHALL NOT depend on the week level.

#### Scenario: Snatch pull reps
- **GIVEN** exercise 13 with 3 to 8 reps per set and 18 to 48 reps per week in a macrocycle of 21 weeks
- **WHEN** the reps are calculated
- **THEN** week 1 has set size 8 and 48 weekly reps, week 11 has set size 6 (5.5 rounded) and 33 weekly reps, week 21 has set size 3 and 18 weekly reps

#### Scenario: High week reps
- **GIVEN** week 11 is a high week
- **WHEN** the reps of exercise 13 are calculated
- **THEN** the weekly reps are 35 (34.65 rounded) and the set size stays 6

### Requirement: Volume
The volume of a week SHALL be the sum of the planned weekly reps of all
exercises chosen for the mesocycle the week belongs to. Without chosen
exercises the volume SHALL be undefined.

#### Scenario: Two exercises
- **GIVEN** week 11 belongs to a mesocycle with exercises 13 (33 weekly reps) and 19 (33 weekly reps in that week)
- **WHEN** the volume is calculated
- **THEN** it is 66

#### Scenario: No exercises yet
- **GIVEN** a mesocycle without chosen exercises
- **WHEN** the volume of one of its weeks is calculated
- **THEN** it is undefined and the week's tooltip shows no volume

### Requirement: Default mesocycles
A new macrocycle of N weeks SHALL be divided into the general preparation
block (first floor(0.15·N) weeks), the special preparation block (next
floor(0.5·N) weeks) and the competition preparation block (remaining
weeks). When the duration of a macrocycle changes, the current block
lengths SHALL be scaled to the new duration (rounded to whole weeks, each
block at least one week, the competition preparation block taking the
rest).

#### Scenario: 21 weeks
- **WHEN** a macrocycle of 21 weeks is divided
- **THEN** weeks 1–3 are general preparation, 4–13 special preparation and 14–21 competition preparation

#### Scenario: Duration change keeps proportions
- **GIVEN** a 21-week macrocycle with the blocks 1–5, 6–13 and 14–21 (5, 8 and 8 weeks)
- **WHEN** its duration changes to 42 weeks
- **THEN** the blocks are 1–10, 11–26 and 27–42

#### Scenario: Shortest macrocycle
- **WHEN** a macrocycle of 7 weeks is divided
- **THEN** week 1 is general preparation, weeks 2–4 special preparation and weeks 5–7 competition preparation
