# Spec Delta

## Purpose

Lets a coach connect an Athlete of their Team to the athlete's own user
account through an invitation link, or to their own account when they
train themselves.

## ADDED Requirements

### Requirement: Create an invitation
A coach SHALL be able to create an invitation link for an athlete of their
Team who is not linked to a user account. The link SHALL be shown on a
screen with a button that copies it.

#### Scenario: Invite from the edit page
- **GIVEN** an athlete of the coach's Team who is not linked
- **WHEN** the coach chooses "Invite" on the athlete's edit page
- **THEN** they see a screen with the invitation link, its expiry date and a "Copy link" button

#### Scenario: Save and invite a new athlete
- **GIVEN** a coach on the form to add an athlete with at least a name entered
- **WHEN** they choose "Save and invite"
- **THEN** the athlete is created and the invitation screen for this athlete is shown

#### Scenario: Copy the link
- **WHEN** the coach chooses "Copy link"
- **THEN** the link is copied to the clipboard and the button confirms it

#### Scenario: Linked athlete cannot be invited
- **GIVEN** an athlete who is already linked to a user account
- **WHEN** the coach opens the athlete's edit page
- **THEN** there is no "Invite" button, and the API refuses to create an invitation with the code `ATHLETE_ALREADY_LINKED`

### Requirement: Invitation validity
An invitation link SHALL be usable once and SHALL expire 7 days after it was
created. Creating a new invitation for an athlete SHALL make the previous
invitation for that athlete invalid. Links SHALL NOT be guessable.

#### Scenario: Expired link
- **GIVEN** an invitation created more than 7 days ago
- **WHEN** someone opens the link
- **THEN** they see that the invitation has expired and should ask their coach for a new link

#### Scenario: Used link
- **GIVEN** an invitation that was already accepted
- **WHEN** someone opens the link
- **THEN** they see that the invitation is no longer valid and should ask their coach for a new link

#### Scenario: Replaced link
- **GIVEN** an invitation for which the coach created a newer one
- **WHEN** someone opens the old link
- **THEN** they see that the invitation is no longer valid

#### Scenario: Unknown link
- **WHEN** someone opens an invitation link that does not exist
- **THEN** they see that the invitation is not valid

### Requirement: Open an invitation
Opening a valid invitation link SHALL show the coach's name and the
athlete's name and a button to accept. A signed-out visitor SHALL first
sign in and then return to the invitation.

#### Scenario: Signed-out athlete opens the link
- **GIVEN** a signed-out person
- **WHEN** they open a valid invitation link
- **THEN** they are asked to sign in and afterwards see the invitation with "Accept"

#### Scenario: Invitation page content
- **GIVEN** an invitation of coach "Max Berg" for the athlete "Anna Weber"
- **WHEN** a signed-in user opens it
- **THEN** they see that Max Berg invites them as "Anna Weber" and an "Accept" button

### Requirement: Accept an invitation
Accepting a valid invitation SHALL link the user account to the invited
Athlete and use up the invitation. The user SHALL then see their athlete
view. The athlete's email address and profile picture SHALL from then on
come from the linked user account.

#### Scenario: Accept
- **GIVEN** a signed-in user without an Athlete on a valid invitation page
- **WHEN** they choose "Accept"
- **THEN** their user account is linked to the Athlete, the link can no longer be used, and they see their athlete view

#### Scenario: Coach sees the linked athlete
- **GIVEN** an athlete who accepted an invitation
- **WHEN** the coach opens the athlete's edit page
- **THEN** it shows that the athlete is linked, with the email address and profile picture of the athlete's user account

#### Scenario: User already linked to an Athlete
- **GIVEN** a user who is already linked to an Athlete
- **WHEN** they open another valid invitation
- **THEN** they see that their account is already linked to an athlete, cannot accept, and the invitation stays valid

#### Scenario: Two people accept at the same time
- **WHEN** two users accept the same invitation at the same moment
- **THEN** exactly one of them is linked and the other sees that the invitation is no longer valid

### Requirement: This is me
A coach who is not linked to any Athlete SHALL be able to link their own
user account to an unlinked athlete of their own Team without an
invitation.

#### Scenario: Coach links themselves
- **GIVEN** a coach not linked to any Athlete, and an unlinked athlete in their Team
- **WHEN** the coach chooses "This is me" on that athlete's edit page
- **THEN** their user account is linked to that athlete and they now also have the athlete role

#### Scenario: Coach already linked
- **GIVEN** a coach who is already linked to an Athlete in any Team
- **WHEN** they open the edit page of another athlete of their Team
- **THEN** there is no "This is me" button, and the API refuses it with the code `ALREADY_LINKED`

### Requirement: Invitations API
The HTTP API SHALL let a coach create an invitation for an athlete of their
Team and link themselves to an athlete of their Team, and SHALL let a
signed-in user read the state of an invitation and accept it. Failures
SHALL use stable error codes: `ATHLETE_NOT_FOUND`, `ATHLETE_ALREADY_LINKED`,
`ALREADY_LINKED`, `INVITATION_NOT_FOUND`, `INVITATION_EXPIRED`,
`INVITATION_USED`.

#### Scenario: Create through the API
- **WHEN** a coach requests an invitation for an unlinked athlete of their Team
- **THEN** the response has status 201 and contains the invitation link and its expiry time

#### Scenario: Invitation for another Team's athlete
- **WHEN** a coach requests an invitation for an athlete of another Team
- **THEN** the response has status 404 and the code `ATHLETE_NOT_FOUND`

#### Scenario: Accept an expired invitation through the API
- **WHEN** a client accepts an expired invitation
- **THEN** the response has status 410 and the code `INVITATION_EXPIRED`
