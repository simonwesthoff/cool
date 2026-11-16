# athlete-details Specification

## Purpose

The athlete details page is the coach's entry point to one athlete: who the
athlete is and, with later features, their macrocycle and current week.

## Requirements

### Requirement: Athlete details header
The details page of an athlete SHALL start with a header showing the
athlete's profile picture (or initials) and name. Choosing the header SHALL
open the athlete's basic data.

#### Scenario: Header content
- **GIVEN** the athlete "Anna Weber" in the coach's Team
- **WHEN** the coach opens her details page
- **THEN** they see her profile picture or initials and "Anna Weber" at the top

#### Scenario: Open basic data
- **WHEN** the coach chooses the header on the details page
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
The athlete details page SHALL have a macrocycle section below the header.
Without a macrocycle it SHALL offer "Plan macrocycle"; with a macrocycle it
SHALL show its period and main competition and a link to change the
planning. This is a placeholder until the macrocycle chart section of the
details page is built.

#### Scenario: No macrocycle yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the athlete's details page
- **THEN** they see "Plan macrocycle", which opens step 1 of the planning

#### Scenario: Planned macrocycle
- **GIVEN** an athlete with a macrocycle from 2026-11-30 for 21 weeks towards the "German Championships" on 2027-04-24
- **WHEN** the coach opens the athlete's details page
- **THEN** they see the period, the competition and a link to change the planning
