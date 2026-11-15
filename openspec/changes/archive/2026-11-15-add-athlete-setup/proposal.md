# Proposal

## Why

Coaches need their athletes in the app before they can plan any training.
This is feature 3 of `feature_list.txt` (athlete setup, coach perspective).
The user decided to build it before feature 2 (user roles and invitations),
so this change gives every signed-in user a Team in which they act as coach.

## What Changes

- Every signed-in user is the coach of their own Team. The Team is created
  automatically the first time it is needed. Feature 2 later replaces this
  with the explicit "Start as Coach / Start as Athlete" choice.
- A coach can add an athlete to their Team. Only the name is required.
- Basic data of an athlete: name, date of birth, gender (female, male,
  diverse), start date of their weightlifting career, and height. Email
  address and profile picture are also basic data, but they are not entered
  by the coach; they will come from the athlete's user account once the
  athlete is linked through an invitation (feature 2).
- A coach can edit the basic data of their athletes later.
- The home page shows the coach's athletes by name, with a button to add an
  athlete. Clicking an athlete opens the form to edit their basic data. This
  is a placeholder until feature 4 (athlete overview) and feature 6 (basic
  data overview).
- The signed-in user's picture, name and sign-out button move into a compact
  header.
- HTTP API endpoints to list, create, read and update the athletes of the
  coach's Team. A coach can only access athletes of their own Team.
- All new texts in English and German.

### Out of scope

- The "Invite" button, invitation links and linking an athlete to a user
  account (feature 2); therefore also email address and profile picture.
- Editing by the athlete themselves (needs feature 2).
- The "Start as Coach / Start as Athlete" choice (feature 2).
- Deleting or archiving athletes.
- Athlete overview with pictures (feature 4), athlete details (feature 5),
  basic data overview screen (feature 6).
- Body weight, personal bests and other training-related data (macrocycle,
  feature 7).

### New domain terms

- **Team**: the group of athletes one coach trains.
- **Coach**: the user account that leads a Team.
- **Athlete**: a person trained in a Team, created by the coach. Can later be
  linked to a user account.
- **Basic data**: an athlete's personal data that rarely changes: name, date
  of birth, gender, start date of their weightlifting career, height, email
  address and profile picture.

## Capabilities

### New Capabilities

- `athlete-management`: The coach's Team, adding athletes, their basic data,
  editing it, and which athletes a coach may access.

### Modified Capabilities

- `authentication`: The home page for signed-in users changes from the
  profile placeholder to the athlete list; picture, name and sign-out move
  into the page header.

## Impact

- New database tables for Teams and Athletes, with a migration.
- New domain functions in `src/domain/athletes` and API routes under
  `/api/athletes`.
- New pages: add athlete, edit athlete; the home page changes.
- Domain model: Team and Athlete move from "Draft" to "Current model"
  (without the link to user accounts and without Invitations).
