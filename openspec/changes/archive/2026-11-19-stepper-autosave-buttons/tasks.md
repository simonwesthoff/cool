# Tasks

## 1. Domain and API

- [x] 1.1 `setSwot` accepts a subset of the SWOT fields (missing ones unchanged; an empty required field still fails with `REQUIRED`). Verify with PGlite tests: a single-field update keeps the others, `REQUIRED` for an empty strengths field, the full body as before; and a route test for `PUT …/swot` with one field.

## 2. Saving

- [x] 2.1 Replace `unsaved-changes.tsx` and `leave-guard.tsx` with a pending-save context (`usePendingSave`, `flushPending`), a `BackLink` that flushes before navigating, and a `pagehide` keepalive send. Remove the dialog and its `Macrocycle.unsaved` messages and tests. Verify with component tests: a step switch and the back link wait for the pending save and never show a dialog.
- [x] 2.2 `BaseDataForm` autosave: 600 ms debounce on input/change; only changed fields; invalid fields left out with one retry; `POST` only once all required base data are filled; the status "Saving…" / "Saved" / "Could not save." with "Try again". Verify with component tests: a changed goal is PATCHed after the debounce without a button; an out-of-range body weight is marked and the other field saved; a new macrocycle is created only once complete; `REQUIRED` hidden while typing in the SWOT.
- [x] 2.3 Continue checks: "Continue to SWOT" without a complete step 1 marks missing fields and stays; "Continue to curve" sends the full SWOT and stays on `REQUIRED`. Verify with component tests.
- [x] 2.4 Week editor: its back link flushes the pending save instead of the dialog. Verify with the week editor tests (no dialog, the change saved before navigating).

## 3. Buttons

- [x] 3.1 `StepperActions` (back as a text button bottom left, status and primary continue bottom right) in steps 1–5 and both week editor steps, with the labels from design 7. Verify with component tests for each step: which buttons exist, their order and their style classes.
- [x] 3.2 Messages in English and German: "Continue to SWOT", "Continue to curve", "Back to base data", the save status texts of steps 1 and 2. Verify with the messages completeness test.

## 4. Records and checks

- [x] 4.1 No new glossary terms and no domain model change; confirm the glossary and `domain-model.md` need no edit. Verify: no diff in these files from this change.
- [x] 4.2 Run tsc, ESLint and all tests. Verify: all pass.
- [x] 4.3 Browser check on the dev server and in Docker (desktop light, phone dark): a new macrocycle created by filling step 1 without a save button; a goal change saved and still there after a reload; an invalid body weight not stored; leaving right after typing in the SWOT keeps the text, without a dialog; the button positions (back left, continue right) in all 5 planning steps and both week editor steps. Verify: a flow script with all checks passing and screenshots.
