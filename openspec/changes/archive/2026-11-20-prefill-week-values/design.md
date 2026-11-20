# Design

## Context

- **Projections:** the week editor gets `projections: Record<exercise
  number, PlannedExercise>` with `bestKg`, `averageKg` (mHG), `setSize`
  and `weeklyReps`, each possibly `null`.
- **Draft:** each session exercise holds single sets (`weight`, `reps` as
  text).
- **Saving:** the editor saves the draft about 0.5 s after each change,
  as set groups.
- **Limits:**
  - **Sets:** at most 10 per exercise and session.
  - **Reps:** 1–30.
  - **Weights:** multiples of 0.5 kg between 0 and 500 kg; the prefill
    uses whole kg only.
- **Actual row:** `weekActuals` computes the mHG as total load ÷ reps,
  weighted by reps.

## Goals / Non-Goals

**Goals:**
- Prefilled sets that satisfy the rules and, wherever possible, show no
  red or blue indicator.
- A deterministic, pure calculation that is easy to test.

**Non-Goals:**
- Choosing exercises.
- Learning from earlier weeks.
- Prefilling in other places (macrocycle view, athlete page).

## Decisions

1. **Pure function in the domain.** `prefillSets(projection, sessionCount)`
   in `src/domain/week-plans/prefill.ts`.
   - **Returns:** one list of `{ weightKg, reps }` sets per session, or
     `null` when the projection is incomplete.
   - **Uses:** `weekActuals` from `calculation.ts` to check a candidate,
     so it measures exactly what the editor shows.

2. **Reps first.**
   - **Per session:** the week's reps R are split evenly, and the earlier
     sessions get the extra reps, e.g. 21 over 2 → 11 and 10.
   - **Number of sets:** for a session's share r, `n = clamp(round(r /
     setSize), 1, 10)`. A share above 10 × 30 is capped by the limits.
   - **Reps per set:** r is spread as evenly as possible over the n sets,
     extra reps on the first sets, so the reps never rise. Example: 20 in
     7 sets → 3, 3, 3, 3, 3, 3, 2.

   - **Equal reps first** (user decision): before the uneven split, equal
     sets of r reps are tried, with r = the set size rounded, floored and
     ceiled. Each session gets as many sets of r as come closest to its
     share (at most 10), and weights are found as in decision 3.
     - **Accepted when:** the whole week's best value, mHG, set size and
       weekly reps are all within 5 % (`deviation`, as in the editor).
     - **Choice:** among accepted options, the one closest to the planned
       weekly reps wins. Otherwise the uneven split above is used.
     - **Example:** week 11's snatch (set size 3, 20 reps) in one session
       gets 7 × 3 = 21 reps; in two sessions, 3 × 3 per session gives 18
       (10 % off), so the reps stay 4, 3, 3.

3. **Weights by a small search.**
   - **Whole numbers:** B = the best value rounded to whole kg (half up);
     every weight is whole kg. The weekly reps are rounded to a whole
     number first, and the set size and mHG stay decimals as targets.
   - **Shape:** runs of equal weight, from the lightest up. Every step
     between runs is 5 kg, except the step into the top run at B, which
     is any whole number d from 1 to 5 kg (5 kg preferred). No step is
     ever above 5 kg.
   - **Ideal** (user decision): a jump every two sets, i.e. runs of two;
     with an odd number of sets the single set is the top one at B.
     Example for 7 sets: 65 65 70 70 75 75 80.
   - **mHG too high for the ideal:** more jumps are added from the
     heaviest weights down. The top pairs are split into single sets one
     at a time, so the lighter weights still repeat once and the heavier
     ones rise every set. Example for 10 sets: 70 70 75 75 80 80 85 90
     95 100.
   - **mHG too low for the ideal (higher mHG):** the top run at B grows
     instead (more sets at the best value).
   - **Choice:** the first shape in this order whose mHG is within 5 %
     wins. For each shape, d = 5 is used if it fits, else the d that
     comes closest.
     - **Out of reach:** if no shape fits, the closest one wins. As the
       mHG is always below the best value, that is a 5 kg jump in every
       set.
     - **Measured like the editor:** the mean is computed with
       `weekActuals`, weights below 0 kg are skipped.
   - *Alternatives:*
     - **Larger jumps:** rejected by the user.
     - **A closed formula (linear ramp):** rejected, because it can't
       respect whole kg, plateaus and the smaller jump together.

4. **The "Autofill" button.**
   - **Where:** in the step 2 toolbar below the "Weights" title (design
     6).
   - **Style:** a text button with the magic wand icon before the label,
     the editor's secondary style, at least 44 px high.
   - **Icon:** `MagicWandIcon` in `src/components/icons`, a 20 px stroke
     icon like the others, `aria-hidden`.
   - **Which exercises:** those that are not free text (number 1–29) and
     whose session entries all have no sets.
   - **What it does:** it fills their sets as one undo step, so the
     existing autosave stores them, and the status shows "Saving…" / "All
     changes saved.". Nothing happens without such exercises.
   - **Order of sessions:** the editor's week order (weekday, slot); the
     earlier sessions get the extra reps.
   - **Always shown:** the button is visible in step 2 even when nothing
     is left to fill, and then does nothing. This keeps the layout
     stable; a disabled state would need explaining.

5. **Only exercises with neither sets nor free text.** An exercise with
   sets in one session and none in another keeps both as they are, so
   the coach's own split is never doubled.

6. **Toolbar, undo/redo and clearing.**
   - **Toolbar:** `role="toolbar"` below the step 2 title: undo and redo
     (round icon buttons with `aria-label` and `title`), "Autofill", and
     "Clear all weights".
   - **History:** the editor keeps `past` and `future` lists of draft
     snapshots (at most 100), recorded by `changeValues` for every change
     to the sets: typing into a cell, Autofill and Clear all.
     - **Typing:** consecutive keystrokes into the same cell form one undo
       step.
     - **Per step:** the history belongs to step 2; leaving it and coming
       back starts a new one, so undo never changes step 1.
     - **Saving:** undo and redo set the draft like any change, so the
       autosave stores the result.
     - **Not recorded:** coach notes and free text.
   - **Greyed out:** undo without `past`, redo without `future`, and "Clear
     all weights" without any set (`disabled`, 40 % opacity).
   - **No confirmation:** clearing can be undone, so it doesn't ask.

7. **Compact exercise cell** (user decision).
   - **Content:** the exercise cell in the step 2 tables shows only the
     category marks and the number. The name is in a screen-reader-only
     text.
   - **Hover:** a `CellTooltip` shows it while the pointer is over the
     cell, in the style of the coach-note tooltip (rendered into the body,
     fixed to the viewport).
   - **Width:** the editor's exercise column is 4.5 rem instead of 8 rem,
     and the coach note gets the saved width. The week view on the
     athlete page keeps 8 rem, as it still shows the names.

8. **Keyboard navigation** (user decision), in `table-keys.ts`, on the set
   inputs and the coach note:
   - **Arrow keys:** up and down between the weight and reps rows, also
     into the exercises above and below. Left and right between sets, once
     the caret is at the edge of the value (or all is selected).
   - **Enter:** weight → reps of the same set → weight of the next set.
     From set 10's reps it goes to the coach note, and from the note to
     the next exercise's first weight (also in the next session).
     Shift+Enter keeps a line break in the note.
   - **Selected value:** the focused cell's value is selected, so typing
     replaces it.

9. **Week tables on the athlete page.**
   - **Exercise cell:** the same as in the editor (marks, number,
     `CellTooltip` with the name); `NoteIndicator` is removed.
   - **Coach comment:** a `data-comment` cell, `whitespace-pre-wrap`,
     built from the week's variations (passed separately; the names no
     longer carry the variation) and the note.
   - **Set columns:** `TrainingWeekSection` computes the most sets of any
     exercise over all sessions of the week (at least 1) and passes it to
     each table.
   - **Widths:** `viewWidths(setColumns)` within the 60 rem content width:
     4.5 rem exercise, 2.25 rem row label, 2.5 rem per set; coach comment
     and feedback share the rest equally.

## Risks / Trade-offs

- **The rules can't always be met together:**
  - **Example:** 18 reps at a set size of 4 gives 3.6 or 4.5 reps per set.
  - **Effect:** the priorities (best value and weekly reps exactly, then
    set size, then the mHG) are fixed by the order of the steps. The
    editor's indicators then show the remaining deviation; this is
    accepted (user's 5 % tolerance as the goal, not a guarantee).
- **A low mHG:** with few sets a low mHG can't be reached with steps of
  at most 5 kg. Then every set is 5 kg above the previous one, and the mHG
  indicator shows the deviation (user decision).
## Domain model changes

None.
