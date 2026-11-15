# athlete-management Specification

## Purpose

Lets coaches keep the athletes they train in the app, with each athlete's
basic data, as the foundation for planning their training.

## Requirements

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
The home page SHALL show the coach's athlete overview: a horizontally
scrollable carousel with one card per athlete of the coach's Team, in
alphabetical order, each with the athlete's profile picture and name, and a
button to add an athlete. Choosing an athlete SHALL open their details page.

#### Scenario: List of athletes
- **GIVEN** a coach with the athletes "Max Berg" and "Anna Weber"
- **WHEN** they open the home page
- **THEN** they see the cards "Anna Weber" and "Max Berg" in this order and an "Add athlete" button

#### Scenario: Empty Team
- **GIVEN** a coach without athletes
- **WHEN** they open the home page
- **THEN** they see a short note that there are no athletes yet and the "Add athlete" button

#### Scenario: Profile pictures
- **GIVEN** an athlete linked to a user account with a profile picture, and an athlete without a linked account
- **WHEN** the coach opens the home page
- **THEN** the first card shows the account's picture and the second shows the athlete's initials

#### Scenario: More athletes than fit on the screen
- **GIVEN** a coach with more athletes than fit next to each other
- **WHEN** they swipe the carousel on a phone or use the next button on a larger screen
- **THEN** the following athletes come into view, and a partly visible card shows that there are more

#### Scenario: Open an athlete
- **WHEN** the coach chooses an athlete's card
- **THEN** the details page of that athlete opens

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
add an athlete, read one athlete and update an athlete's basic data,
including whether each athlete is linked and the email address and picture
of the linked account. Errors SHALL use status 400 `VALIDATION_FAILED` with
field codes, 401 without a session and 403 `NOT_A_COACH` without a Team.

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
