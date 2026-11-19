## ADDED Requirements

### Requirement: Curve anchors
A macrocycle's progression curve SHALL pass through its anchors: the entry
anchor (the entry value, by default in the first week), any number of
inner anchors, and the end anchor (by default 100 % in the last week).
Positions SHALL be relative to the cycle (0 = first week, 1 = last week),
so a duration change keeps the shape; inner anchors lie between the end
anchors. Before the entry and after the end anchor the curve stays level.

#### Scenario: New macrocycle
- **WHEN** the coach creates a macrocycle with entry value 60 %
- **THEN** its curve has only the entry anchor (60 %) and the end anchor (100 %)

#### Scenario: Moved end anchors
- **GIVEN** a 21-week macrocycle whose entry anchor (60 %) is at position 0.2 and end anchor at position 0.8 with 98 %
- **WHEN** the intensities are calculated
- **THEN** weeks 1–5 have 60 %, weeks 17–21 have 98 %, and the weeks between follow the curve

#### Scenario: Longer cycle keeps the shape
- **GIVEN** a 21-week macrocycle with an inner anchor at position 0.5 with 90 %
- **WHEN** the coach changes the duration to 41 weeks
- **THEN** the anchor stays at position 0.5, now week 21, with 90 %

### Requirement: Existing macrocycles keep their curve
Macrocycles planned before anchors existed SHALL get two inner anchors
approximating their former S-curve: at position 1/3 with 25 % and at 2/3
with 75 % of the way from the entry value to 100 %, so the curve dips
below the straight line early and rises above it late.

#### Scenario: Existing plan after the update
- **GIVEN** a 21-week macrocycle with entry value 60 % planned with the sine curve
- **WHEN** the update is installed
- **THEN** it has inner anchors at 1/3 with 70 % and at 2/3 with 90 %, week 1 stays 60 %, week 11 80 % and week 21 100 %, and no week differs from before by more than 1.2 percentage points

## MODIFIED Requirements

### Requirement: Intensity curve
The intensity of a week SHALL be the value of the progression curve at the
week's cycle progress t: a natural cubic spline through all anchors
(straight between two anchors, smooth through more), capped to 0–100 %. A
high week SHALL add 5 percentage points, a low week SHALL subtract 5
percentage points.

#### Scenario: Entry value 60 %
- **GIVEN** a new macrocycle of 21 weeks with entry value 60 %, no inner anchors and only medium weeks
- **WHEN** the intensities are calculated
- **THEN** week 1 has 60 %, week 6 has 70 %, week 11 has 80 %, week 16 has 90 % and week 21 has 100 %

#### Scenario: High and low weeks
- **GIVEN** the same macrocycle where week 11 is a high week
- **WHEN** its intensity is calculated
- **THEN** it is 85 %; as a low week it would be 75 %

#### Scenario: Smooth through an inner anchor
- **GIVEN** the same macrocycle with an inner anchor at position 0.25 with 90 %
- **WHEN** the intensities are calculated
- **THEN** week 6 has 90 %, the weeks before and after rise and fall smoothly through it, and no week exceeds 100 %

#### Scenario: Capped at 100 %
- **GIVEN** inner anchors that make the spline bulge above 100 % between them
- **WHEN** the intensities are calculated
- **THEN** no week's curve value exceeds 100 %; a high week on such a week has 105 %
