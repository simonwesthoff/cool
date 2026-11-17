# user-roles Specification

## Purpose

Defines who is a coach and who is an athlete in which Team, how a new user
chooses their role, and which start page each role sees.

## Requirements

### Requirement: Roles per Team
A user account SHALL be the coach of a Team if it leads that Team, and an
athlete of a Team if it is linked to an Athlete of that Team. A user
account SHALL lead at most one Team and be linked to at most one Athlete.
It MAY hold both roles, in the same Team or in different Teams.

#### Scenario: Coach and athlete in different Teams
- **GIVEN** a user who leads a Team and has accepted an invitation to an Athlete in another coach's Team
- **WHEN** their roles are determined
- **THEN** they are coach of their own Team and athlete of the other Team

#### Scenario: Coach who trains themselves
- **GIVEN** a coach who linked themselves to an Athlete of their own Team
- **WHEN** their roles are determined
- **THEN** they are coach and athlete of the same Team

### Requirement: Start choice for users without a role
A signed-in user who neither leads a Team nor is linked to an Athlete SHALL
see a start page with two options, "Start as Coach" and "Start as Athlete".

#### Scenario: New user after the first sign-in
- **GIVEN** a user who just signed in for the first time without an invitation link
- **WHEN** they see the home page
- **THEN** they see the buttons "Start as Coach" and "Start as Athlete" and no athlete list

#### Scenario: Start as Coach
- **WHEN** a user without a role chooses "Start as Coach"
- **THEN** a Team led by them is created and they see their empty athlete list

#### Scenario: Start as Athlete
- **WHEN** a user without a role chooses "Start as Athlete"
- **THEN** they are asked to enter the invitation link they received from their coach

#### Scenario: Entering the invitation link
- **GIVEN** a user asked for the invitation link
- **WHEN** they paste a complete invitation link of this app and continue
- **THEN** they see the invitation page of that link

#### Scenario: Entering something that is not an invitation link
- **WHEN** a user enters text that is not an invitation link of this app and continues
- **THEN** they stay on the page and see a message that this is not a valid invitation link

### Requirement: No automatic Teams
Teams SHALL only be created when a user chooses "Start as Coach". Opening a
page SHALL NOT create a Team.

#### Scenario: Athlete-only user opens the app
- **GIVEN** a user who is only an athlete
- **WHEN** they open any page
- **THEN** no Team is created for them

### Requirement: Start page per role
The home page SHALL depend on the user's roles: a coach sees the athlete
list of their Team; a user who is only an athlete sees their athlete view;
a user without a role sees the start choice.

#### Scenario: Coach opens the app
- **GIVEN** a user who leads a Team
- **WHEN** they open the home page
- **THEN** they see the athlete list of their Team

#### Scenario: Athlete opens the app
- **GIVEN** a user who is only an athlete
- **WHEN** they open the home page
- **THEN** they see their athlete view

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

### Requirement: Roles in the API
The current user endpoint SHALL include the user's roles: the Team they
lead (if any) and the Athlete and Team they are linked to (if any), with
the coach's name. The HTTP API SHALL let a user without a Team start as
coach.

#### Scenario: Roles of a user with both roles
- **GIVEN** a user who leads a Team and is linked to an Athlete in another Team
- **WHEN** the client requests the current user endpoint
- **THEN** the response contains both the coach role with their Team and the athlete role with the Athlete, its Team and the coach's name

#### Scenario: Starting as coach twice
- **GIVEN** a user who already leads a Team
- **WHEN** the client asks to start as coach again
- **THEN** no second Team is created and the existing Team is returned

### Requirement: Existing automatic Teams
When this change is deployed, Teams that were created automatically and
have no athletes SHALL be removed. Teams with athletes SHALL stay, with
their user as coach.

#### Scenario: Empty automatic Team
- **GIVEN** a user whose automatically created Team has no athletes
- **WHEN** the change is deployed and they open the app
- **THEN** they see the start choice

#### Scenario: Team with athletes
- **GIVEN** a user whose Team has athletes
- **WHEN** the change is deployed and they open the app
- **THEN** they see their athlete list as before

### Requirement: App navigation
Every signed-in page SHALL offer tabs for the user's areas: "Athletes" for
coaches, "My training" for athletes and "Exercises" for every signed-in
user. On phones the tabs SHALL form a bar at the bottom of the screen; on
larger screens they SHALL be in the header. The current tab SHALL be marked.

#### Scenario: Coach
- **GIVEN** a user who is only a coach
- **WHEN** they open any signed-in page
- **THEN** the tabs are "Athletes" and "Exercises"

#### Scenario: Athlete
- **GIVEN** a user who is only an athlete
- **WHEN** they open any signed-in page
- **THEN** the tabs are "My training" and "Exercises"

#### Scenario: Both roles
- **GIVEN** a user with both roles
- **WHEN** they choose "My training" and then "Athletes"
- **THEN** they see their athlete view and then the athlete list of their Team

#### Scenario: Tab bar on a phone
- **WHEN** a user opens a signed-in page on a phone
- **THEN** the tabs are at the bottom of the screen and stay visible while scrolling
