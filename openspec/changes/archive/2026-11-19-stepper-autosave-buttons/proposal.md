# Proposal

## Why

The app has two steppers, the macrocycle planning (5 steps) and the week
editor (2 steps). They behave differently:

- **Saving:** most steps already save every change, but the base data
  (step 1) and the SWOT (step 2) only save on "Save and continue", and a
  "Save changes?" dialog guards unsaved input.
- **Buttons:** "Continue" and "Back" sit side by side on the left, in
  different styles per step.

Adjustment 6 in `feature_list.txt` asks for one rule. Every change in a
stepper is saved as it is made, and each step has a primary continue button
at the bottom right and a back button in the "Back to SWOT" style at the
bottom left, where these actions exist.

## What Changes

- **Automatic saving of steps 1 and 2** (user decisions):
  - **Timing:** the base data and SWOT forms save about 0.6 s after the
    last change. A status next to the buttons says "Saving…", "Saved" or
    "Could not save."
  - **Invalid fields:** they are marked as today, and their values are not
    saved; the other fields are.
  - **New macrocycle:** it is created automatically as soon as all required
    base data are valid. Until then nothing is stored, and "Continue"
    points out the missing or invalid fields.
  - **SWOT:** fields are saved one by one while typing. "Required" is
    checked when continuing: "Continue" stays on step 2 and marks empty
    required fields.
- **Leaving:** a change still waiting for its save is sent at once when the
  step or the page is left (stepper, Continue/Back, back link, closing the
  tab), in both steppers.
- **No "Save changes?" dialog** (user decision): switching steps and
  leaving never ask, in the planning and in the week editor. An invalid
  value is simply not saved.
- **Buttons in every stepper step:** a primary continue button at the
  bottom right, and a back button in the "Back to SWOT" style (text
  button, no border) at the bottom left, each only where the action
  exists.
  - **Macrocycle planning:**
    - **Step 1:** "Continue to SWOT"; no back.
    - **Step 2:** "Back to base data" and "Continue to curve".
    - **Step 3:** "Back to SWOT" and "Continue to weeks".
    - **Step 4:** "Back to curve" and "Continue to exercises".
    - **Step 5:** "Back to weeks" and "Finish planning".
  - **Week editor:**
    - **Step 1:** "Continue"; no back.
    - **Step 2:** "Back" and "Finish week planning".
- The save status and the off-plan warning of the week editor stay next to
  the buttons.

Out of scope: other forms outside steppers (the athlete's basic data, the
athlete form); changing what the steps contain.

New domain terms: none.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-layout`:
  - **New requirement "Stepper buttons":** the placement and style of
    continue and back in every stepper.
  - **New requirement "Saving in steppers":** changes are saved as made,
    pending saves are sent on leaving, and there is no unsaved-changes
    dialog.
- `macrocycle-planning`:
  - **"Planning in five steps":** no dialog; its dialog scenarios now say
    that steps switch without asking.
  - **"SWOT":** saved field by field, required checked on continuing.
  - **New requirement "Automatic saving of base data and SWOT".**
- `week-planning`: "Automatic saving" — leaving sends pending changes, no
  dialog.

## Impact

- **Domain/API:**
  - **SWOT:** `setSwot` and `PUT …/macrocycle/swot` accept a subset of the
    SWOT fields (each validated; missing ones stay unchanged).
  - **Base data:** `POST` and `PATCH …/macrocycle` are unchanged; partial
    PATCH already exists.
- **Components:**
  - **`base-data-form.tsx`:** debounced autosave, a status, and leaving
    sends pending changes; "Continue" checks completeness.
  - **`intensity-planner.tsx`, `exercise-selection.tsx`, `week-editor.tsx`:**
    their buttons move into a new shared `StepperActions` component (back
    left, continue right).
  - **Removed:** `leave-guard.tsx` (dialog, `GuardedBackLink`) and
    `unsaved-changes.tsx`, together with their uses in the planning layout,
    `macrocycle-planning.tsx` and the week page; a flush-on-leave hook
    takes their place.
- **Messages:** new labels ("Continue to SWOT", "Continue to curve", "Back
  to base data") and the save status texts; the dialog texts
  (`Macrocycle.unsaved`) are removed.
