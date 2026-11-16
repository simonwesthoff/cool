# Spec Delta

## MODIFIED Requirements

### Requirement: Macrocycle entry point
The athlete details page SHALL have a macrocycle section below the header.
Without a macrocycle it SHALL offer "Plan macrocycle"; with a macrocycle it
SHALL show its period and main competition, open the macrocycle view when
chosen, and offer a link to change the planning. This is a placeholder
until the macrocycle chart section of the details page is built.

#### Scenario: No macrocycle yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the athlete's details page
- **THEN** they see "Plan macrocycle", which opens step 1 of the planning

#### Scenario: Planned macrocycle
- **GIVEN** an athlete with a macrocycle from 2026-11-30 for 21 weeks towards the "German Championships" on 2027-04-24
- **WHEN** the coach opens the athlete's details page
- **THEN** they see the period, the competition and a link to change the planning

#### Scenario: Open the macrocycle view
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach chooses the macrocycle section on the athlete's details page
- **THEN** the macrocycle view opens
