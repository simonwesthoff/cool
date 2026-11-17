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
