# Proposal

## Why

When a coach wants the same exercise in another mesocycle, step 4 opens
the exercise dialog already filled with the other block's reasons and
variation. The coach then only confirms it with "Choose exercise". Most of
the time nothing is changed, so the dialog is an extra tap per cell
(adjustment 2 in `feature_list.txt`).

## What Changes

- **Direct copy:** tapping "+" for an exercise that is already chosen in
  another mesocycle chooses it right away, with the same tags, own reasons
  and variation, and saves it. No dialog opens. The cell then shows the
  check mark (and the variation) like any other choice.
- **Source:** with choices in several other blocks, the copy comes from the
  first block that has the exercise (general, special, then competition
  preparation), as the prefill does today.
- **Still in the dialog:**
  - **Changing the copy:** tapping the chosen cell opens the dialog to
    change or remove it, as for any choice.
  - **First choice:** an exercise not chosen in any block opens the dialog
    as before.
  - **No reason:** a source choice without a reason (shown as "Reason
    missing") cannot be saved as is, since a reason is required, so the
    dialog opens with it as the starting point.
- **Saving fails:** the cell stays empty and the step shows "The change
  could not be saved. Please try again."

Out of scope: the other adjustments in `feature_list.txt`; changes to the
dialog itself, to the reasons or to the API (the existing `PUT` of a
mesocycle exercise is reused).

New domain terms: none.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `macrocycle-planning`: "Exercises per mesocycle" — the scenario "Prefill
  from another block" becomes a direct copy without the dialog; new
  scenarios for a source without a reason and for a failed save.

## Impact

- **Component:** `src/components/macrocycles/exercise-selection.tsx` (the
  cell's tap and an error message). The dialog's prefill stays and is used
  only for a source without a reason.
- **Messages:** the existing `Macrocycle.exercises.saveFailed` text is
  reused; no new texts.
- **No API, database or domain changes.**
