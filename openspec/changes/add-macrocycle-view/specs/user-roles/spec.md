# Spec Delta

## MODIFIED Requirements

### Requirement: Athlete view
An athlete SHALL have a page ("My training") showing their profile picture,
the name of their Athlete, the name of their coach and, once planned, the
macrocycle chart (snatch, best value) with an "Open macrocycle" button
below it on the right. The coach sees the
same page as the athlete details page. This is a placeholder until the
training plan views exist.

#### Scenario: Athlete view content
- **GIVEN** a user linked to the Athlete "Anna Weber" in the Team of coach "Max Berg"
- **WHEN** they open their athlete view
- **THEN** they see "Anna Weber", their profile picture and "Max Berg" as coach

#### Scenario: Open the own macrocycle
- **GIVEN** a user linked to an Athlete with a planned macrocycle
- **WHEN** they choose "Open macrocycle" on their athlete view
- **THEN** the macrocycle view of their Athlete opens
