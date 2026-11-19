## ADDED Requirements

### Requirement: Copy a choice from another block
Choosing an exercise in a mesocycle while it is already chosen in another
one SHALL copy the reasons and the variation of the first block that has
it (general, special, then competition preparation) and save them without
a dialog. When that choice has no reason, the dialog SHALL open with it as
the starting point instead.

#### Scenario: Copy from the first block that has it
- **GIVEN** exercise 7 chosen for the general preparation block with the variation "From blocks" and for the special preparation block with the variation "Hang"
- **WHEN** the coach taps "+" for exercise 7 in the competition preparation column
- **THEN** it is chosen with the variation "From blocks"

#### Scenario: Source without a reason
- **GIVEN** exercise 7 chosen for the general preparation block without a tag and without own reasons ("Reason missing")
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column
- **THEN** the dialog opens with the variation of the general preparation block, and nothing is saved until the coach chooses the exercise with a reason

#### Scenario: Copy cannot be saved
- **GIVEN** exercise 7 chosen for the general preparation block
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column and saving fails
- **THEN** the cell stays empty and the step shows "The change could not be saved. Please try again."

#### Scenario: Change a copied choice
- **GIVEN** exercise 7 copied into the special preparation block
- **WHEN** the coach taps its cell
- **THEN** the dialog opens with the copied reasons and variation, to change or remove them

## MODIFIED Requirements

### Requirement: Exercises per mesocycle
Step 4 SHALL show one table of the exercise catalog, grouped by exercise
group, with one row per exercise and one column per mesocycle (GLP, ABP,
LAP). In each cell the coach SHALL be able to choose the exercise for that
mesocycle with a reason and an optional variation (free text, the catalog
comment as a hint), change both later, or remove the choice. The same
exercise MAY be chosen for several mesocycles. The variation SHALL NOT
change the calculated values.

#### Scenario: Choose exercises
- **WHEN** the coach chooses exercises 1, 13 and 19 in the special preparation column, each with a reason
- **THEN** these three exercises belong to that mesocycle with their reasons

#### Scenario: Variation and note
- **WHEN** the coach chooses exercise 1 for the general preparation block with the variation "No feet snatch" and the own reason "Footwork in the turnover"
- **THEN** the cell shows the variation, and the choice keeps the variation and the reason

#### Scenario: No variation
- **WHEN** the coach chooses an exercise without a variation
- **THEN** its cell shows only the check mark, no text

#### Scenario: Prefill from another block
- **GIVEN** exercise 7 chosen for the general preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks"
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column
- **THEN** no dialog opens; exercise 7 is chosen and saved for the special preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks", and its cell shows the check mark and "From blocks"

#### Scenario: Remove an exercise
- **GIVEN** exercise 13 chosen for a mesocycle
- **WHEN** the coach removes it in its cell
- **THEN** it no longer belongs to that mesocycle
