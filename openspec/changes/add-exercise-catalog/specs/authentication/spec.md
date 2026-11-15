# Spec Delta

## MODIFIED Requirements

### Requirement: Home page for signed-in users
Every page for signed-in users SHALL show the signed-in user's profile
picture and first name at the top right. Choosing them SHALL open a menu
with a button to sign out and the language switcher. What the home page shows depends on the user's
roles (see user-roles).

#### Scenario: Home page content
- **GIVEN** a signed-in person named "Ada Lovelace"
- **WHEN** they open the home page
- **THEN** they see their profile picture and "Ada" at the top right, not their last name, and below it the start page for their roles

#### Scenario: Header on other pages
- **GIVEN** a signed-in person
- **WHEN** they open any other page for signed-in users
- **THEN** the top right shows their profile picture and first name as well

#### Scenario: Sign out from the account menu
- **GIVEN** a signed-in person on any page
- **WHEN** they choose their picture or first name
- **THEN** a menu opens with a "Sign out" button

#### Scenario: Language in the account menu
- **GIVEN** a signed-in person on any page
- **WHEN** they open the account menu and choose "Deutsch"
- **THEN** the page is shown in German
