# Design

## Context

See proposal.md - Why. Today each step is a server page
(`athletes/[id]/macrocycle/{base-data,swot,intensity,exercises}/page.tsx`)
that calls `loadPlanning` (coach check, athlete, macrocycle), renders
`PlanningHeader` (back link, title, `StepIndicator`) and one step component:

- **Step 1 and 2:** `BaseDataForm` with `part="base"` or `"swot"`. After a
  successful save it calls `router.push(next)` and `router.refresh()`.
- **Step 3:** `IntensityPlanner`, whose "Continue" and "Back" are links.
- **Step 4:** `ExerciseSelection` (needs the catalog), whose "Finish" and
  "Back" are links.

`StepIndicator` renders the shared `Stepper` with links. Its clicks go
through `useLeaveGuard`, which asks "Save changes?" when the form registered
in `UnsavedChangesProvider` (in `macrocycle/layout.tsx`) is dirty, and then
navigates.

Every planning API (`POST`/`PATCH …/macrocycle`, `PUT …/swot`,
`PUT …/weeks/[week]`, `PUT …/mesocycles`, `PUT`/`DELETE
…/mesocycles/[type]/exercises/[number]`) already returns the whole
`Macrocycle`.

The week editor (`week-editor.tsx`) keeps its step in `useState` and passes
`onClick` items to `Stepper`. Its slide uses `transition-[translate,opacity]
duration-300 ease-out motion-reduce:transition-none` (Tailwind v4: the
`translate` property, not `transform`).

## Goals / Non-Goals

**Goals:**
- One server load per planning visit, client-side step switches, and the
  same guard dialog as today.

**Non-Goals:**
- Keeping the forms of all four steps mounted at once (only the current step
  is rendered).
- Browser back stepping through the planning steps (see Decision 3).

## Decisions

1. **Route `athletes/[id]/macrocycle/planning/page.tsx`.**
   - **What it does:** reads `searchParams.step`, calls `loadPlanning`
     once, loads the catalog with `getCatalog()`, and renders the
     server-side header pieces (back link, title) plus a client
     `MacrocyclePlanning`.
   - **Step without a macrocycle:** an unknown step, or any step while there
     is no macrocycle, becomes `base-data`.
   - **Alternatives:** keeping four routes and prefetching them still
     re-renders on the server and shows the Suspense fallback. A catch-all
     `[[...step]]` route would keep pretty paths but still navigates on each
     change.

2. **`MacrocyclePlanning` (client) owns `step`, `direction` and
   `macrocycle`.**
   - **Steps:** it renders the stepper and only the current step's
     component, each getting the latest `macrocycle`.
   - **Callbacks:** `onSaved(macrocycle)` replaces the state. `onStep(step)`
     switches the step, so step 1's "Save and continue" calls `onSaved`, then
     `onStep("swot")`.
   - **Remounting:** a step that remounts initialises from the latest
     macrocycle (e.g. `IntensityPlanner` gets the new weeks after a duration
     change).
   - **Alternative:** `router.refresh()` after each save would re-fetch on
     the server, which is what the change wants to avoid.

3. **Step in the address with `window.history.replaceState`.**
   - **How:** `?step=<key>` is written on every switch. Next 16 syncs native
     history calls with `useSearchParams` without a server request (check
     `node_modules/next/dist/docs` while building).
   - **Why replace:** browser back then leaves the planning, like the back
     link.
   - **Alternative:** `pushState` would make browser back step through the
     steps, but the guard dialog cannot intercept `popstate` reliably.
   - **Confirmed (bundled docs, "Linking and Navigating › Native History
     API"):** Next integrates `pushState`/`replaceState` into its router
     without reloading the page; `useSearchParams` updates. The handler
     builds the URL from `window.location`, so no hook is needed.

4. **Guarding a step switch.**
   - **Change:** `useLeaveGuard` gets a variant that runs a callback instead
     of `router.push`, e.g. `guard(action)`. The stepper, "Continue" and
     "Back" call `guard(() => onStep(x))`.
   - **Unchanged:** the dialog, its button order and the save/discard
     behaviour. "Discard" just switches, since the current step unmounts and
     its unsaved input is gone. The `UnsavedChangesProvider` stays in the
     layout; with only one step mounted, exactly one guard is registered.

5. **Slide.**
   - **Animation:** the step is wrapped in an element keyed by the step, with
     `transition-[translate,opacity] duration-300 ease-out
     motion-reduce:transition-none`. It enters through the `starting:`
     variant (`starting:translate-x-8 starting:opacity-0` going forward,
     `starting:-translate-x-8` going back). This is the week editor's timing
     and easing for an element that mounts.
   - **Clipping:** the container gets `overflow-x-clip`, so the slide never
     causes sideways scrolling.
   - **Alternative:** keeping both steps mounted and translating a strip, as
     the week editor's columns do, would keep four forms alive and register
     several guards.

6. **Old step routes redirect.**
   - **What:** `next.config.ts` redirects the four old addresses to
     `/athletes/:id/macrocycle/planning?step=<key>`; the old pages are
     removed. (Built first as pages calling `redirect()`, which made React
     warn about a script tag in development; a config redirect renders
     nothing, and the planning page does the coach check.)
   - **Links:** "Plan macrocycle" (`athlete-home.tsx`), "Change planning"
     (`macrocycle-view/load.ts`) and the macrocycle page's redirect point to
     the planning page.
   - **Alternative:** redirect pages (see above).

7. **"Finish" stays a link to the athlete's details page.** It is a real
   navigation to another page, so the athlete page loads its fresh chart.

## Risks / Trade-offs

- **[Risk]** A step's in-memory state is lost when it unmounts (e.g. a
  half-typed SWOT after "Discard"). → This is the intended "Discard"
  behaviour; with unsaved changes the dialog always asks first.
- **[Risk]** `replaceState` integration differs in this Next version. →
  Check the bundled docs first; the fallback is
  `router.replace(url, { scroll: false })` on a page whose data does not
  depend on the search param (the step is read only on the first render).
- **[Risk]** Other pages show stale data after the planning (macrocycle
  view, athlete page). → They are dynamic server pages loaded on navigation;
  the browser check covers "Finish" and the back link.
- **[Trade-off]** The catalog is loaded even when step 4 is never opened. →
  One cached query; cheaper than a second round trip when step 4 opens.

## Migration Plan

No data migration. The old addresses keep working through the redirects.
Rollback means reverting the commit.
