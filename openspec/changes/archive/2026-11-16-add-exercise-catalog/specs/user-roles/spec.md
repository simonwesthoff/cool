# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Switching between roles
**Reason**: The role switch becomes part of the app navigation, which every signed-in user sees (it also contains the catalog).
**Migration**: Replaced by "App navigation"; "My Team" is now the "Athletes" tab.
