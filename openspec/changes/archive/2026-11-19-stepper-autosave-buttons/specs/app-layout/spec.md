## ADDED Requirements

### Requirement: Stepper buttons
Every step of a stepper (macrocycle planning, week editor) SHALL show its
continue action as a primary button at the bottom right and its back
action at the bottom left as a text button in the style of "Back to SWOT"
(no border), each only where the action exists. A step's save status SHALL
stay next to these buttons.

#### Scenario: Middle step
- **WHEN** the coach is in planning step 3
- **THEN** "Back to SWOT" is at the bottom left as a text button and "Continue to weeks" at the bottom right as a primary button

#### Scenario: First step
- **WHEN** the coach is in planning step 1 or in step 1 of the week editor
- **THEN** there is only the continue button at the bottom right ("Continue to SWOT" or "Continue")

#### Scenario: Last step
- **WHEN** the coach is in planning step 5
- **THEN** "Back to weeks" is at the bottom left and "Finish planning" at the bottom right

### Requirement: Saving in steppers
Every change in a stepper step SHALL be saved as it is made, without a
save button. A change still waiting for its save SHALL be sent at once
when the step or the page is left. Switching steps or leaving SHALL never
ask about unsaved changes; an invalid value is not saved, and its field
stays marked while the step is open.

#### Scenario: Leave right after typing
- **GIVEN** the coach typed into a planning or week editor field less than a second ago
- **WHEN** they choose the back link
- **THEN** no dialog appears, the change is saved, and it is there when they come back

#### Scenario: Invalid value
- **GIVEN** an invalid value in a field
- **WHEN** the coach switches to another step
- **THEN** the step changes without a dialog and the invalid value is not stored
