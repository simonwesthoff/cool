## ADDED Requirements

### Requirement: Autofill in step 2
Step 2 SHALL show an "Autofill" button with a magic wand icon in a toolbar
below its title. Nothing SHALL be filled in before it is chosen. Choosing it SHALL
fill the sets of every exercise 1–29 that has no sets in any of its
sessions and a complete projection, and save them like any change; other
exercises SHALL stay untouched.

#### Scenario: The button
- **WHEN** the coach opens step 2 of a new week
- **THEN** no sets are filled in yet, and "Autofill" with a magic wand icon is in the toolbar below the "Weights" title ("Automatisch ausfüllen" below "Gewichte" in German)

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
the last weight is the rounded best value; weights rise by 5 kg (only the
jump into the best value may be smaller), ideally every two sets, with more
jumps from the top as the mHG needs, or every set when it is out of reach;
reps stay or fall and average the set size, summing to the rounded weekly
reps split evenly over the sessions. Equal reps SHALL win whenever all four
values stay within 5 %.

#### Scenario: Snatch in week 11
- **GIVEN** week 11 projects 80 kg best value, 69 kg mHG, set size 3 and 20 weekly reps for the snatch, which is in Monday's session without sets
- **WHEN** the coach chooses "Autofill"
- **THEN** the snatch has 65/3, 65/3, 70/3, 70/3, 75/3, 75/3, 80/3: equal reps, as 21 reps are within 5 % of 20 (mHG 71.4 kg); the values are saved and no indicator is red or blue

#### Scenario: Decimal projection
- **GIVEN** a projection of 77.3 kg best value, 66.6 kg mHG, set size 2.5 and 17.5 weekly reps
- **WHEN** "Autofill" fills the exercise in one session
- **THEN** every weight is whole kg, the last is 77 kg, every jump is 5 kg except possibly the one into the first 77 kg set, and the reps are whole numbers summing to 18

#### Scenario: mHG out of reach
- **GIVEN** a projection whose mHG is lower than 5 kg steps up to the best value can reach
- **WHEN** "Autofill" fills the exercise
- **THEN** each set is 5 kg heavier than the one before, up to the best value

#### Scenario: Lower mHG
- **GIVEN** a projection of 100 kg best value, 80 kg mHG, set size 2 and 20 weekly reps in one session
- **WHEN** "Autofill" fills the exercise
- **THEN** it gets 70, 70, 75, 75, 80, 80, 85, 90, 95, 100 kg: pairs at the lighter weights, a jump every set at the heavier ones

#### Scenario: Equal reps would miss
- **GIVEN** the same snatch in two sessions, 10 reps each
- **WHEN** "Autofill" fills it
- **THEN** each session gets 4, 3, 3 reps, because equal sets of 3 would give 18 reps, 10 % below the plan

#### Scenario: Two sessions
- **GIVEN** the snatch with 20 projected weekly reps is in Monday's and Thursday's sessions, both without sets
- **WHEN** the coach chooses "Autofill"
- **THEN** each session gets 10 of the reps, and both reach 80 kg in their last set

### Requirement: Undo, redo and clearing in step 2
The step 2 toolbar SHALL hold, in this order: undo, redo, "Autofill" and
"Clear all weights". Undo and redo SHALL step through changes to weights
and reps (typing into a cell, Autofill, clearing) and be greyed out when
unavailable. "Clear all weights" SHALL remove all weights and reps of the
week. Every result SHALL be saved like any change.

#### Scenario: Undo autofill
- **GIVEN** the coach chose "Autofill"
- **WHEN** they choose undo
- **THEN** the exercises are empty again, redo becomes available, and the empty state is saved

#### Scenario: Typing is one step
- **WHEN** the coach types "65" into a weight cell and chooses undo
- **THEN** the cell shows its value from before the typing

#### Scenario: Nothing to undo
- **WHEN** the coach opens step 2
- **THEN** undo and redo are greyed out, and so is "Clear all weights" when there are no sets

### Requirement: Keyboard in step 2
In the step 2 tables the arrow keys SHALL move between the weight and reps
cells, also to the exercises above and below. Enter SHALL move from a
weight to its reps, from reps to the next set's weight, from the last
set's reps to the coach note, and from the note to the next exercise's
first weight.

#### Scenario: Entering a set with Enter
- **GIVEN** the cursor in the first weight of the snatch
- **WHEN** the coach types 60, Enter, 3, Enter
- **THEN** set 1 is 60 kg × 3 and the cursor is in the weight of set 2

#### Scenario: On to the next exercise
- **GIVEN** the cursor in the coach note of the snatch, with the pull below it
- **WHEN** the coach presses Enter
- **THEN** the cursor is in the pull's first weight

#### Scenario: Arrow keys
- **GIVEN** the cursor in the reps of set 1 of the snatch
- **WHEN** the coach presses the down arrow
- **THEN** the cursor is in the first weight of the next exercise

## MODIFIED Requirements

### Requirement: Step 2 values
Step 2 SHALL show a compact table per session over the whole width. Each
exercise SHALL take two rows: its cell (category marks and number, the
name on hover) and coach note span both, the ten set columns hold the
weight in the first row and the reps in the second, and there are no
buttons to add or remove sets; typing into an empty cell adds the set. A
weight without reps SHALL be marked as incomplete. On phones the table
SHALL scroll sideways with the exercise cells kept in view.

#### Scenario: Sets of the snatch on Monday
- **GIVEN** Monday's snatch with 2 × 3 @ 60 kg, 3 × 2 @ 70 kg and 2 × 1 @ 80 kg
- **WHEN** the coach opens step 2
- **THEN** Monday's table shows the snatch in two rows with the sets 60/3, 60/3, 70/2, 70/2, 70/2, 80/1, 80/1 in the first seven of ten set columns

#### Scenario: Add a set by typing
- **WHEN** the coach types 70 kg and 2 reps into the empty eighth set cells of the snatch
- **THEN** the snatch has eight sets and the change is saved

#### Scenario: Exercise cell
- **WHEN** the coach looks at the snatch in step 2
- **THEN** its cell shows the snatch mark and "1", and hovering over it shows "1 Snatch"
