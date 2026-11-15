# Spec Delta

## MODIFIED Requirements

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
