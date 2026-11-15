# Spec Delta

## Purpose

Lets coaches keep the athletes they train in the app, with each athlete's
basic data, as the foundation for planning their training.

## ADDED Requirements

### Requirement: Coach's Team
Every signed-in user SHALL be the coach of exactly one Team. The Team SHALL
be created automatically the first time the user needs it. This applies
until user roles are introduced.

#### Scenario: First visit creates the Team
- **GIVEN** a user account that has no Team
- **WHEN** the user opens the home page
- **THEN** a Team led by this user exists and its athlete list is shown, empty

#### Scenario: Later visits reuse the Team
- **GIVEN** a user who already leads a Team
- **WHEN** the user opens the home page again
- **THEN** no new Team is created and the athletes of their existing Team are shown

### Requirement: Add an athlete
A coach SHALL be able to add an athlete to their Team. Only the name is
required; all other basic data can be left empty and filled in later.

#### Scenario: Add an athlete with only a name
- **GIVEN** a coach on the form to add an athlete
- **WHEN** they enter a name and save
- **THEN** the athlete exists in their Team and appears in their athlete list

#### Scenario: Add an athlete with all basic data
- **WHEN** a coach enters name, date of birth, gender, career start date and height and saves
- **THEN** the athlete exists with exactly these values

#### Scenario: Name missing
- **WHEN** a coach saves the form without a name, or with a name of only spaces
- **THEN** the athlete is not created and the form shows that the name is required

### Requirement: Basic data
An athlete's basic data entered by the coach SHALL consist of: name
(required, 1 to 100 characters, surrounding spaces removed), date of birth,
gender (female, male or diverse), start date of the weightlifting career,
and height in whole centimetres. Email address and profile picture SHALL
NOT be entered by the coach.

#### Scenario: Invalid values are rejected
- **WHEN** a coach saves a date of birth in the future, a career start date in the future, a career start date before the date of birth, or a height outside 100 to 250 cm
- **THEN** the data is not saved and the form shows which field is invalid and why

#### Scenario: No email or picture fields
- **WHEN** a coach opens the form to add or edit an athlete
- **THEN** the form has no fields for email address or profile picture

### Requirement: Edit basic data
A coach SHALL be able to change the basic data of each athlete in their
Team, including clearing optional values. The same validation rules apply
as when adding an athlete.

#### Scenario: Change values
- **GIVEN** an athlete in the coach's Team
- **WHEN** the coach opens the athlete from the athlete list, changes the height and saves
- **THEN** the athlete has the new height and the other values are unchanged

#### Scenario: Clear an optional value
- **WHEN** a coach clears the date of birth of an athlete and saves
- **THEN** the athlete has no date of birth

### Requirement: Athlete list
The home page SHALL list the athletes of the coach's Team by name in
alphabetical order, with a button to add an athlete. Choosing an athlete
SHALL open the form to edit their basic data.

#### Scenario: List of athletes
- **GIVEN** a coach with the athletes "Max Berg" and "Anna Weber"
- **WHEN** they open the home page
- **THEN** they see "Anna Weber" and "Max Berg" in this order and an "Add athlete" button

#### Scenario: Empty Team
- **GIVEN** a coach without athletes
- **WHEN** they open the home page
- **THEN** they see a short note that there are no athletes yet and the "Add athlete" button

### Requirement: Access only to the own Team
A coach SHALL only see and change athletes of their own Team. Requests for
an athlete of another Team SHALL be answered as if the athlete did not
exist.

#### Scenario: Athlete of another Team
- **GIVEN** an athlete in the Team of coach A
- **WHEN** coach B opens the athlete's edit page or requests the athlete through the API
- **THEN** coach B gets "not found" (API: status 404, code `ATHLETE_NOT_FOUND`) and nothing is changed

#### Scenario: Lists contain only the own athletes
- **WHEN** a coach requests their athlete list through the page or the API
- **THEN** it contains only athletes of their own Team

### Requirement: Athletes API
The HTTP API SHALL let the signed-in coach list the athletes of their Team,
add an athlete, read one athlete and update an athlete's basic data. Invalid
input SHALL be answered with status 400, the code `VALIDATION_FAILED` and
field codes. Requests without a session SHALL be answered with status 401.

#### Scenario: Create through the API
- **WHEN** a signed-in client sends a valid new athlete with a name
- **THEN** the response has status 201 and contains the created athlete with its id

#### Scenario: Invalid input through the API
- **WHEN** a signed-in client sends an athlete with a height of 300
- **THEN** the response has status 400, code `VALIDATION_FAILED` and a field code for the height

#### Scenario: No session
- **WHEN** a client without a session calls any athletes endpoint
- **THEN** the response has status 401 and code `UNAUTHENTICATED`

### Requirement: Athlete perspective
Athletes SHALL NOT yet have their own access to their basic data. They get
it when they are linked to their Athlete through an invitation (user roles
feature).

#### Scenario: Athlete without invitation
- **WHEN** an athlete signs in to the app themselves
- **THEN** they are treated like any signed-in user (coach of their own Team) and do not see the basic data their coach entered
