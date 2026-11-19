# Design

## Context

- **Already autosaving:** steps 3–5 of the planning (curve, weeks,
  exercises) save on each change; the week editor saves about 0.6 s after
  a change through its own debounced `flush`.
- **Not autosaving:** `BaseDataForm` (steps 1 and 2, `part: "base" |
  "swot"`) is an uncontrolled form. It saves only on submit: `POST` for a
  new macrocycle, `PATCH` (partial body, validated against the merged
  stored record by `completeBaseDataSchema`) or `PUT …/swot` (all fields
  required).
- **Dialog:** `unsaved-changes.tsx` (a context with `isDirty` and `save`)
  and `leave-guard.tsx` (the "Save changes?" dialog, `GuardedBackLink`)
  guard step switches in `macrocycle-planning.tsx` and the back link of
  the planning layout and the week page.
- **Buttons:** each step renders its own row of buttons on the left, with
  copies of the same Tailwind classes; the week editor uses a bordered
  secondary button for "Back".

## Goals / Non-Goals

**Goals:**
- One saving rule and one button layout for both steppers.
- No lost input: a pending save is sent when leaving.

**Non-Goals:**
- Changing the forms outside steppers (athlete form, the athlete's basic
  data on the details page).
- Offline saving or retries beyond the existing "Try again".

## Decisions

1. **Debounced autosave in `BaseDataForm`.**
   - **Trigger:** `input` and `change` events on the form (including the
     schedule picker and focus points) restart a 600 ms timer, like the
     week editor.
   - **Request:** on timeout the form sends its values. The base step
     sends `POST` (no macrocycle yet) or `PATCH`; the SWOT step sends
     `PUT …/swot` with the changed fields.
   - **Only changed fields:** the body contains the fields whose value
     differs from the last stored snapshot, so a field the coach has not
     touched is never resent.
   - **Status:** `aria-live` text next to the buttons: "Saving…", "Saved",
     "Could not save." (+ "Try again"), as in the week editor.
   - *Alternative:* saving on blur, rejected by the user.

2. **Invalid fields are left out, the rest is saved.**
   - **First try:** the changed fields are sent together.
   - **Retry:** on `VALIDATION_FAILED`, the fields named in the error are
     shown as errors and removed from the body, and the rest is sent
     again (one retry).
   - **Cross-field errors** (e.g. goal below the best result) name both
     fields; both are then left out until the values fit.
   - *Alternative:* validating in the client first; rejected, it would
     duplicate the domain rules.

3. **New macrocycle only once complete.**
   - **Check:** without a macrocycle, the form saves only when every
     required base data field is filled. Then it sends the `POST`;
     validation errors are shown, and nothing is stored until the `POST`
     succeeds.
   - **After creation:** `onSaved` hands the macrocycle to the page, which
     enables steps 2–5, and the form switches to `PATCH`.
   - **"Continue to SWOT" too early:** the form submits as today, which
     marks missing fields as required, and stays on step 1.

4. **SWOT saved field by field.**
   - **Domain:** `setSwot` accepts any subset of the SWOT fields
     (`swotSchema.partial()`), each with its existing rules; missing
     fields stay unchanged, and an empty required field fails with
     `REQUIRED` as today.
   - **While typing:** a `REQUIRED` error on autosave is not shown; that
     field is just not saved.
   - **"Continue to curve":** sends all fields with the full schema. On
     `REQUIRED` errors it marks them and stays on step 2.
   - **Existing behaviour:** `PUT` with all fields still works, so
     clients and tests that send the full SWOT are unaffected.

5. **Flush on leave instead of a dialog.**
   - **Hook:** a small `usePendingSave(flush)` registration in a context
     (it replaces `UnsavedChangesProvider`). The planning page and the
     week page call `flushPending()` before a step switch, and the back
     link awaits it before navigating.
   - **Closing the tab:** a `pagehide` listener sends the pending body
     with `fetch(…, { keepalive: true })`.
   - **Removed:** `leave-guard.tsx`, `unsaved-changes.tsx`, the
     `Macrocycle.unsaved` messages and their tests. `GuardedBackLink`
     becomes a plain `BackLink` with an `onBeforeNavigate` that flushes.
   - **Invalid values:** they are never in a pending body (decision 2), so
     leaving drops them silently.

6. **`StepperActions` component.**
   - **Layout:** `<div className="flex items-center justify-between gap-3">`
     with the back button at the left (or an empty spacer), and the save
     status plus the primary button at the right.
   - **Styles:** the primary style of today's continue buttons, and the
     text style of "Back to SWOT" (`rounded-full px-4 … hover:bg-zinc-100`,
     no border) for back.
   - **Users:** used by `BaseDataForm`, `IntensityPlanner`,
     `ExerciseSelection` and both week editor steps.
   - **Week editor:** its off-plan warning and the save status move above
     the row on phones (`basis-full`) as today.
   - **Phone layout:** the row stays one line; long labels wrap inside the
     buttons.

7. **Labels.**
   - **Step 1:** "Save and continue" becomes "Continue to SWOT" ("Weiter
     zur SWOT").
   - **Step 2:** "Continue to curve" ("Weiter zur Kurve") and "Back to base
     data" ("Zurück zu den Basisdaten").
   - **Steps 3–5 and the week editor:** keep their labels.

## Risks / Trade-offs

- **Partial PATCH during a duration change:**
  - **Risk:** typing "2" on the way to "24" weeks could save 2 weeks, and
    that rescales the mesocycles.
  - **Mitigation:** the 600 ms debounce. Also, `WEEKS_PLANNED` protects
    planned weeks, and the proportions are recalculated from the final
    value, so an intermediate value at most changes the split. Accepted.
- **Keepalive on tab close:** it can be lost on very old browsers; this
  is accepted, as before when the dialog could not stop a closed tab
  either.
- **More requests:** about one per pause in typing; small JSON bodies,
  acceptable.

## Domain model changes

None (no entity or relation changes; `setSwot` only accepts partial
input).
