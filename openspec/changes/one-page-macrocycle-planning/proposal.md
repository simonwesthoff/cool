# Proposal

## Why

The macrocycle planning's four steps (base data, SWOT, intensity, exercises)
are four pages with their own URLs. Every step change navigates, reloads the
athlete and the macrocycle on the server and shows a loading placeholder, so
going back and forth feels slow. The week editor already switches its two
steps on one page with a slide; the macrocycle planning shall feel the same
(adjustment 1 in `feature_list.txt`).

## What Changes

- **One page:** the four planning steps live on one page,
  `/athletes/[id]/macrocycle/planning`. The athlete, the macrocycle and the
  exercise catalog are loaded once; choosing a step in the stepper, "Continue"
  or "Back" switches the step on the page without navigating or loading.
- **Step in the URL:** the current step is kept as `?step=` (`base-data`,
  `swot`, `intensity`, `exercises`) by replacing the URL without navigation,
  so a reload or a shared link opens the same step. Without a macrocycle only
  step 1 opens.
- **Fresh data across steps:** every save already returns the whole
  macrocycle; the page keeps that latest macrocycle and hands it to every
  step. A changed duration in step 1 shows the new weeks in step 3 at once.
- **Slide:** switching steps slides the new step in like the week editor
  (300 ms ease-out, translate and opacity): from the right when going
  forward, from the left when going back; no animation with reduced motion.
- **Unchanged behaviour:** the stepper, the title "<first name>'s macrocycle
  planning", the back link, the "Save changes?" dialog for unsaved form
  changes, saving after each step, and "Finish" returning to the athlete's
  details page.
- **Old step URLs:** `/athletes/[id]/macrocycle/base-data`, `/swot`,
  `/intensity` and `/exercises` redirect to the planning page with that step,
  so existing links and bookmarks keep working. "Plan macrocycle" and
  "Change planning" link to the new page.

Out of scope: the other adjustments in `feature_list.txt` (reusing an
exercise choice, lift categories, the planning legend and competition line,
the spline progression); any change to what the steps contain or to the
planning API.

New domain terms: none.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `macrocycle-planning`: "Planning in four steps" now requires the steps to
  be on one page, switched without navigation or loading, with the step in
  the URL and the week editor's slide.

## Impact

- **Pages:** new `src/app/(signed-in)/athletes/[id]/macrocycle/planning/page.tsx`;
  the four step pages become redirects; `planning-header.tsx` and
  `shared.ts` are reused.
- **Components:** a new client component holds the current step and the
  latest macrocycle and renders the stepper and the step;
  `step-indicator.tsx` switches steps through a callback instead of links;
  `base-data-form.tsx`, `intensity-planner.tsx` and `exercise-selection.tsx`
  report saves and step changes through callbacks instead of
  `router.push`/links; the leave guard also guards a step switch on the page.
- **Links:** `athlete-home.tsx`, `macrocycle-view/load.ts` and the redirect
  in `athletes/[id]/macrocycle/page.tsx` point to the planning page.
- **No API, database or domain changes.**
