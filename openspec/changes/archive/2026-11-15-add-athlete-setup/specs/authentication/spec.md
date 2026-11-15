# Spec Delta

## MODIFIED Requirements

### Requirement: Home page for signed-in users
Every page for signed-in users SHALL show the signed-in user's name and
profile picture and a button to sign out in its header. The home page
itself shows the coach's athlete list (see athlete-management).

#### Scenario: Home page content
- **GIVEN** a signed-in person
- **WHEN** they open the home page
- **THEN** they see their name, their profile picture and a sign-out button in the header, and their athlete list below

#### Scenario: Header on other pages
- **GIVEN** a signed-in person
- **WHEN** they open the form to add or edit an athlete
- **THEN** the header shows their name, their profile picture and the sign-out button as well
