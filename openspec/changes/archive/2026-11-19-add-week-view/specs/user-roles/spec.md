# Spec Delta

## MODIFIED Requirements

### Requirement: Athlete view
An athlete SHALL have a page ("My training") with their profile picture,
their Athlete's name, their coach and, once planned, the macrocycle chart
with "Open macrocycle" below it on the right and the current week's plan
with their feedback; for the coach it is the athlete details page.
Whoever leads the athlete's Team SHALL get the edit icon next to the name
and, without a macrocycle, "Plan macrocycle".

#### Scenario: Athlete view content
- **GIVEN** a user linked to the Athlete "Anna Weber" in the Team of coach "Max Berg"
- **WHEN** they open their athlete view
- **THEN** they see "Anna Weber", their profile picture and "Max Berg" as coach, no edit icon, and no placeholder text about a coming training plan

#### Scenario: Open the own macrocycle
- **GIVEN** a user linked to an Athlete with a planned macrocycle
- **WHEN** they choose "Open macrocycle" on their athlete view
- **THEN** the macrocycle view of their Athlete opens

#### Scenario: Coach who trains themselves
- **GIVEN** a coach linked to an Athlete of their own Team without a macrocycle
- **WHEN** they open "My training"
- **THEN** they see the edit icon next to their name, which opens their basic data, and "Plan macrocycle"
