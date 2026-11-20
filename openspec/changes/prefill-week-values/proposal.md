# Proposal

## Why

In step 2 of the week editor the coach types every weight and every rep by
hand, although the macrocycle already projects four values per exercise
and week: the best value, the average weight (mHG), the set size and the
weekly reps. A starting point that already meets these projections lets
the coach adjust instead of type, and makes planning a week much faster.

## What Changes

- **"Autofill" button in step 2** (user decisions):
  - **Where:** in a toolbar below the "Weights" ("Gewichte") title of step
    2, with a magic wand icon before the text "Autofill" ("Automatisch
    ausfüllen" in German).
- **Toolbar in step 2** (user decisions), in this order:
  1. **Undo and redo:** they undo and redo changes to the weights and reps
     (typing, Autofill, clearing). Each is greyed out when there is
     nothing to undo or redo.
  2. **"Autofill".**
  3. **"Clear all weights":** it removes all weights and reps of the week.
- **Compact exercise cell** (user decision): the step 2 tables show only
  the category marks and the number of an exercise; its name appears when
  hovering over the cell.
- **Keyboard** (user decision): the arrow keys move between the weight and
  reps cells. Enter moves from a weight to its reps, from reps to the next
  set's weight, from the last set's reps to the coach note, and from the
  note to the next exercise's first weight.
  - **What it does:** clicking it fills the sets of every exercise 1–29
    that has no sets yet in any of its sessions. Nothing is filled
    automatically; exercises with sets stay untouched.
  - **Saving:** the filled sets are saved like any other change, and the
    coach can edit them as usual.
  - **Not prefilled:**
    - **Free text:** exercises from 30 on, which have free text instead of
      sets.
    - **No projection:** exercises without a complete projection (a best
      value, an mHG, a set size and weekly reps).
- **Rules for the sets of one exercise:**
  - **Whole numbers** (user decision): the projections can be decimals
    (e.g. 77.3 kg or a set size of 2.5), but the prefilled weights are
    whole kilograms and the reps whole numbers. The best value is rounded
    to whole kg and the weekly reps to a whole number.
  - **Weights:** the last set's weight is the best value. From one set to
    the next, the weight stays the same or rises by 5 kg, never more (user
    decision). Only the jump into the first set at the best value may be
    smaller; with several sets at the best value, that is the jump into
    the first of them.
  - **A jump every two sets** (user decision): ideally each weight is
    used for two sets (e.g. 65 65 70 70 75 75 80). If that misses the
    mHG, more jumps are added from the heaviest weights down, so the
    lighter weights still repeat once and the heavier ones rise every set.
    The mHG is always below the best value; if it is too low to reach,
    every set is simply 5 kg above the previous one.
  - **Reps:** from one set to the next, the reps stay the same or fall.
  - **Targets:**
    - **Average reps per set:** they match the planned set size.
    - **Weighted average weight:** the mHG, weighted by reps, as in the
      editor's Actual row (user decision).
    - **Sum of all reps:** the planned weekly reps.
  - **Tolerance:** each target is met within 5 %, the editor's tolerance.
- **Several sessions** (user decision): the weekly reps are split evenly
  over the sessions with the exercise, and each session follows the same
  rules on its share, reaching the best value.
- **When the rules cannot all be met:** the values come as close as
  possible, in this priority: best value and weekly reps exactly, then the
  set size, then the mHG. Some combinations can't be met within 5 %:
  - **Set size:** 18 reps at a set size of 4 gives 3.6 or 4.5 reps per
    set.
  - **mHG:** a low mHG with few sets can't be reached with 5 kg steps;
    then every jump is 5 kg.

  The usual red/blue indicators then show what is off.

Out of scope: prefilling step 1 (which exercises); changing the
projections; the copy of the previous week ("Plan next week" with the
previous week's content), which brings its own sets and is therefore not
prefilled.

New domain terms: none (best value, mHG, set size and weekly reps are in
the glossary).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `week-planning`:
  - **New requirements:** "Autofill in step 2" (the toolbar, the button
    and which exercises), "Autofill rules" (how the sets are built), "Undo,
    redo and clearing in step 2" and "Keyboard in step 2".
  - **"Step 2 values":** the exercise cell shows the marks and the number,
    with the name on hover.

## Impact

- **Messages:** the toolbar and clear labels in English and German.
- **Icons:** magic wand, undo and redo icons in `src/components/icons`.
- **Calculation:** a new pure function `prefillSets(projection, sessions)`
  in `src/domain/week-plans/prefill.ts`, with unit tests.
- **Week editor:** the toolbar below the step 2 title (undo, redo,
  Autofill, clear all), the compact exercise cell with a hover tooltip,
  and keyboard navigation in the tables; every change goes through the
  existing autosave.
- **No API or data changes.**
