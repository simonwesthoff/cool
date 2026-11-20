## ADDED Requirements

### Requirement: Autofill in step 2
Step 2 SHALL show an "Autofill" button with a magic wand icon next to its
title. Nothing SHALL be filled in before it is chosen. Choosing it SHALL
fill the sets of every exercise 1–29 that has no sets in any of its
sessions and a complete projection, and save them like any change; other
exercises SHALL stay untouched.

#### Scenario: The button
- **WHEN** the coach opens step 2 of a new week
- **THEN** no sets are filled in yet, and "Autofill" with a magic wand icon is next to the "Weights" title ("Automatisch ausfüllen" next to "Gewichte" in German)

#### Scenario: Sets already there
- **GIVEN** the clean has sets in Monday's session and none in Thursday's
- **WHEN** the coach chooses "Autofill"
- **THEN** no set of the clean is added or changed in either session

#### Scenario: Added later
- **GIVEN** the coach used "Autofill", went back to step 1 and added the jerk
- **WHEN** they choose "Autofill" again in step 2
- **THEN** only the jerk gets sets

#### Scenario: Not prefilled
- **WHEN** the week has an exercise from 30 on, or one without a projected best value or reps
- **THEN** "Autofill" leaves it without sets

### Requirement: Autofill rules
Autofilled sets SHALL be whole numbers meeting the projection within 5 %:
the last weight is the rounded best value; weights stay or rise by 5 kg,
never more, and only the jump into the first set at the best value may be
smaller; reps stay or fall; the reps per set average the set size; the
rep-weighted mean is the mHG, or every jump is 5 kg when it is out of
reach; the reps sum to the rounded weekly reps, split evenly over the
exercise's sessions.

#### Scenario: Snatch in week 11
- **GIVEN** week 11 projects 80 kg best value, 69 kg mHG, set size 3 and 20 weekly reps for the snatch, which is in Monday's session without sets
- **WHEN** the coach chooses "Autofill"
- **THEN** the snatch has 7 sets with 20 reps in all, reps that never rise, weights that never fall, the last at 80 kg, and an mHG between 65.6 and 72.4 kg; the values are saved and no indicator is red or blue

#### Scenario: Decimal projection
- **GIVEN** a projection of 77.3 kg best value, 66.6 kg mHG, set size 2.5 and 17.5 weekly reps
- **WHEN** "Autofill" fills the exercise in one session
- **THEN** every weight is whole kg, the last is 77 kg, every jump is 5 kg except possibly the one into the first 77 kg set, and the reps are whole numbers summing to 18

#### Scenario: mHG out of reach
- **GIVEN** a projection whose mHG is lower than 5 kg steps up to the best value can reach
- **WHEN** "Autofill" fills the exercise
- **THEN** each set is 5 kg heavier than the one before, up to the best value

#### Scenario: Two sessions
- **GIVEN** the snatch with 20 projected weekly reps is in Monday's and Thursday's sessions, both without sets
- **WHEN** the coach chooses "Autofill"
- **THEN** each session gets 10 of the reps, and both reach 80 kg in their last set
