# Spec Delta

## MODIFIED Requirements

### Requirement: Athlete view
An athlete SHALL have a page showing the name of their Athlete, their
profile picture, the name of their coach and a way to open their
macrocycle. This is a placeholder until the athlete details and basic data
views exist.

#### Scenario: Athlete view content
- **GIVEN** a user linked to the Athlete "Anna Weber" in the Team of coach "Max Berg"
- **WHEN** they open their athlete view
- **THEN** they see "Anna Weber", their profile picture and "Max Berg" as coach

#### Scenario: Open the own macrocycle
- **GIVEN** a user linked to an Athlete with a planned macrocycle
- **WHEN** they choose the macrocycle on their athlete view
- **THEN** the macrocycle view of their Athlete opens
