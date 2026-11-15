# Spec Delta

## MODIFIED Requirements

### Requirement: Home page for signed-in users
Every page for signed-in users SHALL show the signed-in user's name and
profile picture and a button to sign out in its header. What the home page
shows depends on the user's roles (see user-roles).

#### Scenario: Home page content
- **GIVEN** a signed-in person
- **WHEN** they open the home page
- **THEN** they see their name, their profile picture and a sign-out button in the header, and below it the start page for their roles

#### Scenario: Header on other pages
- **GIVEN** a signed-in person
- **WHEN** they open any other page for signed-in users
- **THEN** the header shows their name, their profile picture and the sign-out button as well
