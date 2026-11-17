# Spec Delta

## MODIFIED Requirements

### Requirement: Athlete details header
The details page of an athlete SHALL look like the athlete's own "My
training" page and use the same component: the profile picture (or
initials) centred on top, the athlete's name and their coach below it. For
the coach the page SHALL additionally offer the way back to the athlete
overview and a "Basic data" card that opens the athlete's basic data.

#### Scenario: Header content
- **GIVEN** the athlete "Anna Weber" in the Team of coach "Max Berg"
- **WHEN** the coach opens her details page
- **THEN** they see her profile picture or initials, "Anna Weber" and "Coach: Max Berg" at the top, as on her "My training" page

#### Scenario: Open basic data
- **WHEN** the coach chooses "Basic data" on the details page
- **THEN** the form with the athlete's basic data opens

#### Scenario: Back to the overview
- **WHEN** the coach is on the details page
- **THEN** they can go back to the athlete overview

### Requirement: Macrocycle entry point
The athlete details page SHALL show the same macrocycle card as the
athlete's "My training" page. With a macrocycle the card SHALL show its
period and main competition and open the macrocycle view; changing the
planning is offered in the macrocycle view. Without a macrocycle the coach
SHALL get a "Plan macrocycle" card instead.

#### Scenario: No macrocycle yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the athlete's details page
- **THEN** they see "Plan macrocycle", which opens step 1 of the planning

#### Scenario: Planned macrocycle
- **GIVEN** an athlete with a macrocycle from 2026-11-30 for 21 weeks towards the "German Championships" on 2027-04-24
- **WHEN** the coach opens the athlete's details page
- **THEN** they see the macrocycle card with "Nov 30, 2026 – Apr 25, 2027" and "German Championships, Apr 24, 2027"

#### Scenario: Open the macrocycle view
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach chooses the macrocycle card on the athlete's details page
- **THEN** the macrocycle view opens, which offers "Change planning"
