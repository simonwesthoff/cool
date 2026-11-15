# Proposal

## Why

So far every signed-in user is automatically a coach, and athletes cannot
use the app at all. Feature 2 of `feature_list.txt` introduces the two
roles, coach and athlete, per Team, and lets coaches invite their athletes
with a link, so athletes can sign in and later see and log their training.

## What Changes

- **Roles per Team.** A user account is the coach of the Team it leads,
  and an athlete of the Team whose Athlete it is linked to. One user
  account can have both roles (coach of their Team and athlete in another
  coach's Team, or coach and athlete in their own Team). It is linked to at
  most one Athlete.
- **Start choice.** A signed-in user without a role sees two buttons:
  "Start as Coach" creates their Team and shows the athlete list; "Start as
  Athlete" asks for the invitation link from their coach. Teams are no
  longer created automatically.
- **Invitations.** A coach creates an invitation link for an athlete of
  their Team who is not linked yet: from the athlete's edit page
  ("Invite"), or right when adding the athlete ("Save and invite"). A
  screen shows the link with a copy button. A link can be used once and
  expires after 7 days; creating a new link makes the previous one
  invalid.
- **Accepting.** Opening the link shows who invites whom; after signing in
  (if needed) and accepting, the user account is linked to that Athlete.
  Expired, used, replaced or otherwise unusable links show a clear message.
- **"This is me".** A coach can link their own user account to an athlete
  in their own Team without an invitation, to train themselves.
- **Linked athletes.** The athlete's email address and profile picture now
  come from the linked user account and are shown, read-only, on the
  coach's edit page, with the information that the athlete is linked.
- **Athlete view (placeholder).** An athlete sees a page with their name,
  picture and their coach's name. Users with both roles can switch between
  "My Team" and "My training" in the header.
- **Existing data.** Teams without athletes are removed by the migration;
  their users see the start choice. Teams with athletes stay.
- HTTP API for roles, starting as coach, creating and accepting
  invitations and "This is me". All new texts in English and German.

### Out of scope

- Unlinking an athlete from a user account, or deleting a user's Team.
- Sending invitations by email; the coach shares the link themselves.
- Several coaches per Team; athletes in several Teams.
- The real athlete views: athlete details (feature 5), basic data overview
  and editing by the athlete (feature 6), training plans.
- The athlete overview with pictures (feature 4).

### New domain terms

- **Invitation**: a link that a coach creates for one Athlete of their
  Team; it links the user account that accepts it to that Athlete. Usable
  once, valid for 7 days, replaced by a newer one.
- **Role**: coach or athlete; held by a user account per Team.

## Capabilities

### New Capabilities

- `user-roles`: The coach and athlete roles per Team, the start choice for
  users without a role, which start page each role sees, switching between
  roles, and the athlete placeholder view.
- `athlete-invitations`: Creating, sharing, opening and accepting
  invitation links, their validity rules, and linking a coach to an
  athlete of their own Team ("This is me").

### Modified Capabilities

- `athlete-management`: The coach's Team is no longer created
  automatically (created by "Start as Coach"); athlete endpoints need the
  coach role; email address and profile picture of linked athletes come
  from their user account; the "Athlete perspective" requirement is
  replaced by the athlete role.
- `authentication`: The home page depends on the user's role instead of
  always showing the athlete list.

## Impact

- New table for invitations; Athlete gets a link to a user account
  (unique); migration that removes Teams without athletes.
- Domain: new `src/domain/roles` and `src/domain/invitations`; changes in
  `src/domain/athletes`.
- New API endpoints and pages: start choice, invitation screen, invitation
  acceptance, athlete placeholder view; header role switch.
- Domain model: Invitation and the link between user account and Athlete
  move from "Draft" to "Current model".
