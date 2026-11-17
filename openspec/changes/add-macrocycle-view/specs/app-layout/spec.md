# Spec Delta

## ADDED Requirements

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
