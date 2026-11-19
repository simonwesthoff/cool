# app-layout Specification

## Purpose

App-wide page layout rules: one content width for every page and one
consistent way back from every page below a top-level page.

## Requirements

### Requirement: Content width
Every page SHALL use the same content width: on desktop at most the width
of the macrocycle planning's intensity step (64rem including the side
padding), centred; on phones the full width minus the side padding. Content
inside a page (forms, lists, cards) SHALL span this width.

#### Scenario: Same width on every page
- **GIVEN** a desktop window 1280 px wide
- **WHEN** the user opens the athlete overview, an athlete's page, the basic data form, any planning step, the macrocycle view or the exercise catalog
- **THEN** the content starts and ends at the same horizontal positions on every page

#### Scenario: Phone
- **GIVEN** a phone 390 px wide
- **WHEN** the user opens any page
- **THEN** the content uses the full width minus the side padding, without horizontal scrolling

### Requirement: Back navigation
Every page below a top-level page (Athletes, My training, Exercises) SHALL
start with a back link at the top left, in one style ("‹ Back to …"),
leading to the page one level up (planning steps: the macrocycle view once
it exists). The top-level pages SHALL have none.

#### Scenario: Back from the basic data
- **GIVEN** the coach on the basic data page of "Anna Weber"
- **WHEN** they choose "‹ Back to Anna Weber" at the top left
- **THEN** Anna Weber's page opens

#### Scenario: Back from a planning step
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach chooses the back link on a planning step
- **THEN** the macrocycle view opens

#### Scenario: Top-level page
- **WHEN** the user opens Athletes, My training or Exercises
- **THEN** there is no back link

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
