# Design

## Context

See proposal.md; requirements in the `athlete-management` delta and the new
`athlete-details` spec. Built: the coach's home page renders `AthleteList`
(names as links to `/athletes/{id}`, the edit form), `Athlete` objects from
`listAthletes` already contain `linkedAccount.image`, `Avatar` shows a
picture or initials, pages are coach-guarded with `requireCoachPage`, and
Next.js keeps visited pages alive (forms keyed by `bfcacheId`).

## Goals / Non-Goals

**Goals:** a carousel that is simple, accessible and smooth on phones,
without a new dependency; a details page that feature 5 can extend.

**Non-Goals:** autoplay, infinite looping, pagination dots, virtualisation
(a coach has tens of athletes, not thousands).

## Decisions

### Carousel with native scrolling
- A horizontal `<ul>` with `overflow-x: auto` and CSS scroll snap
  (`snap-x snap-mandatory`, cards `snap-start`). Swiping, trackpads and
  momentum work natively; no carousel library.
- Card width: `w-[40%]` on phones (about two and a half cards visible),
  fixed `w-44` from the `sm` breakpoint. Each card is a link with a 96 px
  `Avatar` and the name (two lines at most, then truncated).
- Previous/next buttons (hidden below `sm`) call `scrollBy` by the visible
  width with smooth scrolling (instant if the user prefers reduced motion).
  They are disabled at the start/end, updated on `scroll` and resize.
- Accessibility: the list has an `aria-label`; cards are ordinary links
  reachable with Tab, and focusing a card scrolls it into view; buttons
  have labels ("Previous athletes", "Next athletes") and `aria-controls`.
- Scrollbar hidden visually (`scrollbar-width: none`) since swiping and
  the buttons are the controls.
- Alternative: Embla or Swiper. Rejected: a dependency for what scroll snap
  already does.

### Routes
- `/athletes/{id}` → details page (server component, `requireCoachPage`,
  `getAthlete`, `notFound()` for other Teams' athletes).
- `/athletes/{id}/basic-data` → the existing form page, moved unchanged
  (form, invitation panel, "This is me", linked account). After saving it
  returns to `/athletes/{id}` instead of `/`; "Cancel" too.
- "Save and invite" (new athlete) keeps showing the link and "Done" leads
  to the overview.
- Details header: a link wrapping a 112 px `Avatar` and the name as `h1`,
  with a "Basic data" hint and a chevron; a "Back to athletes" link above.

### Styling
Minimalist black and white like the rest; cards have a thin zinc border and
a subtle hover/focus background.

## Risks / Trade-offs

- [Scroll snap behaviour differs slightly between browsers] → Native
  scrolling still works everywhere; snapping is a refinement.
- [Hidden scrollbar on desktop] → Previous/next buttons and keyboard focus
  are available from the `sm` breakpoint up.
- [Bookmarked `/athletes/{id}` now shows the details page instead of the
  form] → Only used by the coach during development; the form is one tap
  away.

## Migration Plan

No data changes. Deploy as usual.
