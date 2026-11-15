# Spec Delta

## MODIFIED Requirements

### Requirement: Basic data
An athlete's basic data entered by the coach SHALL consist of: name
(required, 1 to 100 characters, surrounding spaces removed), date of birth,
gender (female, male or diverse), start date of the weightlifting career,
and height in whole centimetres. Email address and profile picture SHALL
NOT be entered by the coach; for an athlete linked to a user account they
SHALL be taken from that user account.

#### Scenario: Invalid values are rejected
- **WHEN** a coach saves a date of birth in the future, a career start date in the future, a career start date before the date of birth, or a height outside 100 to 250 cm
- **THEN** the data is not saved and the form shows which field is invalid and why

#### Scenario: No email or picture fields
- **WHEN** a coach opens the form to add or edit an athlete
- **THEN** the form has no input fields for email address or profile picture

#### Scenario: Email and picture of a linked athlete
- **GIVEN** an athlete linked to a user account
- **WHEN** the coach opens the athlete's edit page or requests the athlete through the API
- **THEN** the email address and profile picture of that user account are shown, read-only

### Requirement: Athletes API
The HTTP API SHALL let the signed-in coach list the athletes of their Team,
add an athlete, read one athlete and update an athlete's basic data. Each
athlete SHALL include whether it is linked to a user account and, if so,
that account's email address and profile picture. Invalid input SHALL be
answered with status 400, the code `VALIDATION_FAILED` and field codes.
Requests without a session SHALL be answered with status 401, requests of
users who lead no Team with status 403 and the code `NOT_A_COACH`.

#### Scenario: Create through the API
- **WHEN** a signed-in client sends a valid new athlete with a name
- **THEN** the response has status 201 and contains the created athlete with its id

#### Scenario: Invalid input through the API
- **WHEN** a signed-in client sends an athlete with a height of 300
- **THEN** the response has status 400, code `VALIDATION_FAILED` and a field code for the height

#### Scenario: No session
- **WHEN** a client without a session calls any athletes endpoint
- **THEN** the response has status 401 and code `UNAUTHENTICATED`

#### Scenario: Not a coach
- **WHEN** a signed-in user who leads no Team calls any athletes endpoint
- **THEN** the response has status 403 and code `NOT_A_COACH`, and no Team is created

## ADDED Requirements

### Requirement: Team through Start as Coach
A user SHALL become the coach of exactly one Team by choosing "Start as
Coach" (see user-roles). Only users who lead a Team SHALL see the athlete
list and add, read or edit athletes.

#### Scenario: Start as Coach creates the Team
- **GIVEN** a user account that has no Team
- **WHEN** the user chooses "Start as Coach"
- **THEN** a Team led by this user exists and its athlete list is shown, empty

#### Scenario: Later visits reuse the Team
- **GIVEN** a user who already leads a Team
- **WHEN** the user opens the home page again
- **THEN** no new Team is created and the athletes of their existing Team are shown

#### Scenario: User without a Team
- **GIVEN** a user who leads no Team
- **WHEN** they open the form to add an athlete or an athlete's edit page
- **THEN** they are sent to the home page and no Team is created

### Requirement: Athlete access to basic data
Athletes SHALL NOT yet see or edit their basic data themselves; their
athlete view shows only their name, profile picture and coach (see
user-roles). Viewing and editing basic data by the athlete comes with the
basic data overview.

#### Scenario: Linked athlete opens the app
- **GIVEN** a user who is only an athlete
- **WHEN** they open the app
- **THEN** they see their athlete view and cannot open the coach's athlete list or edit pages

## REMOVED Requirements

### Requirement: Coach's Team
**Reason**: Teams are no longer created automatically for every user; user roles introduce the explicit "Start as Coach" choice.
**Migration**: Replaced by "Team through Start as Coach". Empty automatic Teams are removed by the migration of this change; Teams with athletes stay.

### Requirement: Athlete perspective
**Reason**: Athletes now have their own role and athlete view.
**Migration**: Replaced by "Athlete access to basic data" and the athlete view in user-roles.
