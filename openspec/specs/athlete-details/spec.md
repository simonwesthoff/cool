# athlete-details Specification

## Purpose

The athlete details page is the coach's entry point to one athlete: who the
athlete is and, with later features, their macrocycle and current week.

## Requirements

### Requirement: Athlete details header
The details page of an athlete SHALL look like the athlete's own "My
training" page and use the same component: the profile picture (or
initials) centred on top, the athlete's name and their coach below it. For
the coach the page SHALL additionally offer the way back to the athlete
overview and an edit (pencil) icon next to the name that opens the
athlete's basic data.

#### Scenario: Header content
- **GIVEN** the athlete "Anna Weber" in the Team of coach "Max Berg"
- **WHEN** the coach opens her details page
- **THEN** they see her profile picture or initials, "Anna Weber" and "Coach: Max Berg" at the top, as on her "My training" page

#### Scenario: Open basic data
- **WHEN** the coach chooses the edit icon next to the athlete's name
- **THEN** the form with the athlete's basic data opens

#### Scenario: Back to the overview
- **WHEN** the coach is on the details page
- **THEN** they can go back to the athlete overview

### Requirement: Access to athlete details
Only the coach of the athlete's Team SHALL open the details page and the
basic data form. Other users SHALL get the "not found" page; users who lead
no Team SHALL be sent to the home page.

#### Scenario: Athlete of another Team
- **GIVEN** an athlete in the Team of coach A
- **WHEN** coach B opens the athlete's details page or basic data page
- **THEN** coach B sees the "not found" page

#### Scenario: User without a Team
- **WHEN** a user who leads no Team opens an athlete's details page
- **THEN** they are sent to the home page

### Requirement: Macrocycle entry point
The macrocycle section of the athlete details page SHALL be the same as on
the athlete's "My training" page: the macrocycle view's exercise chart
(snatch, best value, with mesocycle bands, main competition and current
week), and below it, aligned to the right, an "Open macrocycle" button that
opens the macrocycle view. Changing the planning is offered in the
macrocycle view. Without a macrocycle the coach SHALL get a "Plan
macrocycle" card instead.

#### Scenario: No macrocycle yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the athlete's details page
- **THEN** they see "Plan macrocycle", which opens step 1 of the planning

#### Scenario: Planned macrocycle
- **GIVEN** an athlete with a macrocycle from 2026-11-30 for 21 weeks towards the "German Championships" on 2027-04-24
- **WHEN** the coach opens the athlete's details page
- **THEN** they see the chart of the snatch's best value with 80 kg in week 11, and below it on the right the "Open macrocycle" button

#### Scenario: Open the macrocycle view
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach chooses "Open macrocycle" on the athlete's details page
- **THEN** the macrocycle view opens, which offers "Change planning"
