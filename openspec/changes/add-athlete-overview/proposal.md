# Proposal

## Why

The coach's main screen is a plain list of names. Feature 4 of
`feature_list.txt` turns it into the athlete overview: every athlete with
name and profile picture, and a click opens the athlete's details screen,
the entry point for planning their training (feature 5).

## What Changes

- The home page for coaches becomes the athlete overview: a horizontal
  carousel of cards, one per athlete, each with a large profile picture (or
  initials) and the name, sorted by name. On the phone the carousel is
  swiped; about two and a half cards are visible so it is clear there are
  more. On larger screens there are also previous/next buttons.
- The profile picture is the one of the user account linked to the athlete;
  athletes without a linked account (or without a picture) show initials.
- Choosing an athlete opens a new athlete details page. For now it only has
  the header that feature 5 describes: the athlete's picture and name,
  which lead to the basic data form. Feature 5 adds the macrocycle and
  current week sections below it.
- The basic data form moves from `/athletes/{id}` to
  `/athletes/{id}/basic-data`; the details page takes `/athletes/{id}`.
- All new texts in English and German.

### Out of scope

- The macrocycle and current week sections of the details page (feature 5).
- The basic data overview (feature 6); the existing edit form stays.
- Athletes viewing their own details page.
- Search, filtering or grouping of athletes.

### New domain terms

None ("athlete overview" and "athlete details" are screen names, not domain
terms).

## Capabilities

### New Capabilities

- `athlete-details`: The athlete details page of a coach's athlete; for now
  its header with picture and name leading to the basic data.

### Modified Capabilities

- `athlete-management`: The "Athlete list" becomes the athlete overview
  carousel with profile pictures, and choosing an athlete opens the details
  page instead of the form.

## Impact

- Home page component for coaches (carousel), new details page, the basic
  data form moves to a sub-route; links from the invitation and "Save"
  flows are updated.
- No database or API changes: the athletes API already returns the linked
  account's picture.
