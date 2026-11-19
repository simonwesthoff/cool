# Tasks

## 1. Planning page

- [x] 1.1 Read the bundled Next docs on `useSearchParams` and native `window.history.replaceState`, and confirm a search-param change makes no server request. Verify: a note in design.md (Decision 3) states the confirmed approach or the `router.replace` fallback.
- [x] 1.2 New route `athletes/[id]/macrocycle/planning/page.tsx`:
  - **Load once:** `loadPlanning` and `getCatalog`.
  - **Step:** `?step=` is parsed; an unknown step, or any step without a macrocycle, becomes `base-data`.
  - **Render:** back link, title, then the client planning component.

  Verify with page tests: the coach check, the default step, an unknown step, `?step=exercises` without a macrocycle → step 1, and 404 for another Team's athlete.
- [x] 1.3 The four old step pages redirect to `…/macrocycle/planning?step=<key>`. "Plan macrocycle" (`athlete-home.tsx`), "Change planning" (`macrocycle-view/load.ts`) and the redirect in `athletes/[id]/macrocycle/page.tsx` link to the planning page. Verify with page tests for the redirects and the updated link tests.

## 2. Client planning component

- [x] 2.1 `MacrocyclePlanning` holds the step, the slide direction and the latest macrocycle:
  - **Stepper:** buttons instead of links; steps 2–4 are disabled without a macrocycle.
  - **Address:** `?step=` is replaced without navigating.
  - **Steps:** only the current step is rendered, with the latest macrocycle.

  Verify with component tests: switching steps changes the content and the address with no fetch, the disabled steps, and the stepper's completed/current marks.
- [x] 2.2 Step components report through callbacks instead of navigating:
  - **`BaseDataForm`:** after a successful save it calls `onSaved` with the returned macrocycle, then `onStep` (base → swot, swot → intensity); the first save enables steps 2–4.
  - **`IntensityPlanner`:** passes every saved macrocycle on; "Continue" and "Back" become buttons.
  - **`ExerciseSelection`:** passes saved choices on; "Back" becomes a button and "Finish" stays a link to the athlete page.

  Verify with the updated component tests (no `router.push`, callbacks called with the returned macrocycle) and a test: a duration change in step 1 shows the new weeks in step 3.
- [x] 2.3 Guard step switches on the page: `useLeaveGuard` runs an action after the dialog's Save/Discard instead of navigating, used by the stepper, "Continue" and "Back". Verify with tests: the dialog appears for a dirty step 2, then Save → stored and step 1 shown; Discard → step 1 without saving; Cancel → stays; a failed save stays with marked fields; clean → no dialog.
- [x] 2.4 Slide: the step wrapper is keyed by the step; it enters with the week editor's transition from the right going forward and from the left going back, with no animation under reduced motion, and the container clips sideways. Verify with component tests (direction class per switch, `motion-reduce:transition-none`) and the browser check.

## 3. Records and checks

- [x] 3.1 Update texts that name the old step pages, if any. Run the messages completeness test; there are no new domain terms, so the glossary stays. Verify: `vitest` passes, including the messages test.
- [x] 3.2 Browser check on the dev server and in Docker, on desktop and phone, in light and dark:
  - **Flow:** go through all four steps without loading placeholders, the address following the step, reload in step 3 and 4, a duration change visible in step 3, the save dialog on a step switch.
  - **Exits:** old URLs redirect; "Finish" and the back link work.

  Verify: screenshots and a flow script with all checks passing.

## Workflow follow-up

- After acceptance: archive the change (sync the specs) and open a PR into main.
