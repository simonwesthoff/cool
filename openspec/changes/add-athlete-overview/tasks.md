# Tasks

## 1. Carousel

- [ ] 1.1 Build the `AthleteCarousel` component (scroll-snap list of cards with 96 px avatar and name, previous/next buttons from `sm` up that disable at the ends, reduced-motion aware, labels) and use it on the coach's home page instead of `AthleteList`; add English and German texts; verify component tests (sorted cards with picture or initials, links to `/athletes/{id}`, empty state, button labels and disabled states)

## 2. Details page and routes

- [ ] 2.1 Move the basic data form page to `/athletes/{id}/basic-data` (save and cancel return to `/athletes/{id}`) and update all links; verify the existing form and page tests with the new paths
- [ ] 2.2 Build the details page at `/athletes/{id}` with the header (picture or initials, name, link to basic data) and a link back to the overview, coach-only with `notFound()` for other Teams; add English and German texts; verify page tests (header content, not found for another Team, redirect without a Team)

## 3. Integration check

- [ ] 3.1 Browser check on the dev server at phone (390 px) and desktop width with a test coach and several athletes (one linked with a picture): carousel order, pictures and initials, swiping/next button, details page, basic data and back; screenshots reviewed; both languages
- [ ] 3.2 Docker stack: rebuild (verify the image is new) and repeat the flow from 3.1

## Workflow follow-up

- User acceptance, archive, PR into main.
