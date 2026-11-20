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

3. **Weights by a small search.**
   - **Whole numbers:** B = the best value rounded to whole kg (half up);
     every weight is whole kg. The weekly reps are rounded to a whole
     number first, and the set size and mHG stay decimals as targets.
   - **Shape:** the sets end with k ≥ 1 sets at B. Below them, the weights
     fall backwards in steps of 0 or 5 kg; the step from the first set at
     B down to the set before it is any whole number from 1 to 5 kg. No
     step is ever above 5 kg.
   - **Search:** for each k, the size of that step d (1–5) and every 0/5
     pattern of the steps below it, the candidate is built. With n ≤ 10
     this is at most a few thousand candidates. Each is scored by |its
     rep-weighted mean − mHG|, computed with `weekActuals`, and weights
     below 0 kg are skipped.
   - **Choice:**
     - **Smallest deviation** of the mHG wins.
     - **Within tolerance:** among the candidates within 5 % of the mHG,
       the one with the most 5 kg jumps wins (user: more jumps rather than
       plateaus), then the smaller deviation.
     - **Out of reach:** when no candidate is within 5 %, the closest one
       wins. As the mHG is always below the best value, that is the ramp
       with 5 kg steps in every set (k = 1, d = 5).
   - *Alternatives:*
     - **Larger jumps:** rejected by the user.
     - **A closed formula (linear ramp):** rejected, because it can't
       respect whole kg, plateaus and the smaller jump together.

4. **The "Autofill" button.**
   - **Where:** in step 2's header row, next to the "Weights" title.
   - **Style:** a text button with the magic wand icon before the label,
     the editor's secondary style, at least 44 px high.
   - **Icon:** `MagicWandIcon` in `src/components/icons`, a 20 px stroke
     icon like the others, `aria-hidden`.
   - **Which exercises:** those that are not free text (number 1–29) and
     whose session entries all have no sets.
   - **What it does:** it fills their sets in one `update`, so the
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
