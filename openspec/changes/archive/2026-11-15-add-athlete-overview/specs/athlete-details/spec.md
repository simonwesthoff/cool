# Spec Delta

## Purpose

The athlete details page is the coach's entry point to one athlete: who the
athlete is and, with later features, their macrocycle and current week.

## ADDED Requirements

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
