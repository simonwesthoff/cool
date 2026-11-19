# Tasks

## 1. Direct copy in step 4

- [x] 1.1 In `exercise-selection.tsx`, tapping an empty cell whose exercise is chosen in another block, with at least one tag or own reason, saves that choice for the cell with `PUT …/mesocycles/<type>/exercises/<number>` and the source's tags, own reasons and variation. The cell shows the result, `onSaved` gets the stored macrocycle, and no dialog opens. Verify with component tests: request URL and body, no dialog, cell label "…: chosen, From blocks", `onSaved` called; the first block is the source when several blocks have the exercise.
- [x] 1.2 Fallbacks:
  - **Source without a reason:** the dialog opens with the source as prefill, as before.
  - **First choice:** an exercise chosen in no block opens the empty dialog.
  - **Failed save:** the cell stays empty and an alert shows `saveFailed`; a later successful action hides it.
  - **Double taps:** a second tap on the same cell while saving does nothing.

  Verify with component tests for each case.

## 2. Checks

- [x] 2.1 Run tsc, ESLint and all tests including the messages completeness test (no new texts). Verify: all pass.
- [x] 2.2 Browser check on the dev server and in Docker (desktop and phone):
  - **Copy:** choose exercise 1 for the general preparation block with a tag and a variation, tap "+" in the other two columns; no dialog, the copies are stored (API read), and they stay after a reload.
  - **Change a copy:** tapping a copied cell opens the dialog with its values.

  Verify with a flow script with all checks passing and screenshots.

## Workflow follow-up

- After acceptance: archive the change (sync the specs) and open a PR into main.
