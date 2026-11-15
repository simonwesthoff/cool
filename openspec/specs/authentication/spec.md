# authentication Specification

## Purpose

Identifies the people using the app through their Google account, so that
coaches and athletes can sign in without a separate password and every
other feature knows who the current user is.

## Requirements

### Requirement: Sign in with Google
The system SHALL let a person sign in with their Google account. It SHALL
offer no other sign-in method. Signing in works the same for coaches and
athletes; the user account has no role.

#### Scenario: Successful sign-in
- **GIVEN** a signed-out person on the sign-in page
- **WHEN** they choose "Continue with Google" and confirm at Google
- **THEN** they are signed in and see the home page

#### Scenario: Sign-in cancelled at Google
- **WHEN** a person cancels the sign-in at Google
- **THEN** they return to the sign-in page, are still signed out, and see a message that sign-in was not completed

#### Scenario: Sign-in fails
- **WHEN** Google reports an error or the sign-in cannot be completed
- **THEN** the person returns to the sign-in page, is still signed out, and sees a message that sign-in failed and they can try again

### Requirement: User account from the Google profile
On a person's first sign-in, the system SHALL create a user account with the
name, email address and profile picture from their Google profile. The same
Google account SHALL always sign in to the same user account. On every later
sign-in, the name and profile picture SHALL be updated from Google.

#### Scenario: First sign-in creates a user account
- **GIVEN** a Google account that has never signed in
- **WHEN** the person signs in with it
- **THEN** a user account with the Google profile's name, email address and picture exists

#### Scenario: Later sign-in reuses the user account
- **GIVEN** a Google account that signed in before
- **WHEN** the person signs in with it again
- **THEN** no new user account is created and they are signed in to their existing one

#### Scenario: Profile changes at Google are applied
- **GIVEN** a person changed their name or picture at Google after their last sign-in
- **WHEN** they sign in again
- **THEN** their user account shows the new name and picture

#### Scenario: Google profile without a picture
- **WHEN** a person signs in with a Google account that has no profile picture
- **THEN** the app shows a placeholder with the initials of their name instead

### Requirement: Pages require sign-in
Every page except the sign-in page SHALL require a signed-in user. A
signed-out person who opens such a page SHALL be sent to the sign-in page
and, after signing in, back to the page they opened.

#### Scenario: Opening a page while signed out
- **GIVEN** a signed-out person
- **WHEN** they open the home page or any other page except the sign-in page
- **THEN** they see the sign-in page instead

#### Scenario: Return to the requested page after sign-in
- **GIVEN** a signed-out person opened a link to a page of the app
- **WHEN** they sign in from the sign-in page they were sent to
- **THEN** they see the page from the link

#### Scenario: Return target outside the app is ignored
- **WHEN** a sign-in request names a return target that is not a page of this app
- **THEN** the person sees the home page after signing in

#### Scenario: Signed-in person opens the sign-in page
- **GIVEN** a signed-in person
- **WHEN** they open the sign-in page
- **THEN** they see the home page instead

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

### Requirement: Sign out
The system SHALL let a signed-in user sign out. Signing out SHALL end the
session on the current device only.

#### Scenario: Signing out
- **GIVEN** a signed-in person on the home page
- **WHEN** they choose to sign out
- **THEN** they see the sign-in page and opening the home page again shows the sign-in page

#### Scenario: Other devices stay signed in
- **GIVEN** a person signed in on a phone and a laptop
- **WHEN** they sign out on the laptop
- **THEN** they are still signed in on the phone

### Requirement: Session lifetime
A session SHALL stay valid for 30 days after the user's last use of the app.
After 30 days without use, the user SHALL have to sign in again.

#### Scenario: Regular use keeps the user signed in
- **GIVEN** a person who signed in 40 days ago and used the app at least every few days since
- **WHEN** they open the app
- **THEN** they are still signed in

#### Scenario: Session expires after inactivity
- **GIVEN** a person who has not used the app for more than 30 days
- **WHEN** they open the app
- **THEN** they see the sign-in page

### Requirement: API requires a session
API endpoints that act on behalf of a user SHALL identify the user by their
session and SHALL respond with status 401 and the error code
`UNAUTHENTICATED` when there is no valid session.

#### Scenario: API request without a session
- **WHEN** a client calls an endpoint that needs a user without a valid session
- **THEN** the response has status 401 and the error code `UNAUTHENTICATED`

#### Scenario: Health endpoint stays public
- **WHEN** a client without a session requests `/api/health`
- **THEN** the response is the health report, not a 401

### Requirement: Current user endpoint
The system SHALL provide an API endpoint that returns the signed-in user's
name, email address and profile picture.

#### Scenario: Profile of the signed-in user
- **GIVEN** a valid session
- **WHEN** the client requests the current user endpoint
- **THEN** the response has status 200 and contains the user's name, email address and profile picture

### Requirement: Session cookie protection
The session SHALL be kept in a cookie that page scripts cannot read, that is
only sent over HTTPS, and that is not sent with requests from other sites.

#### Scenario: Session cookie attributes
- **WHEN** a person signs in
- **THEN** the session cookie is set with the HttpOnly, Secure and SameSite=Lax attributes
