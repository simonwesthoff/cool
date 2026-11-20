# Tasks

## 1. Calculation

- [x] 1.1 `prefillSets(projection, sessionCount)` in `src/domain/week-plans/prefill.ts` (design 1–3). Verify with unit tests:
  - **Week 11 snatch** (80 kg, 69 kg, set size 3, 20 reps, one session): 7 sets, reps 3×6 + 2, never rising reps, never falling weights, last 80 kg, mHG within 5 %.
  - **Two sessions:** 10 + 10 reps; 21 reps → 11 + 10; each ending at the best value.
  - **Jumps:** never above 5 kg; only the jump into the first set at the best value may be smaller (also with several sets at the best value); more 5 kg jumps preferred over plateaus; 5 kg in every set when the mHG is out of reach.
  - **Decimals:** 77.3 kg / 66.6 kg / set size 2.5 / 17.5 reps gives whole-kg weights ending at 77 kg and whole reps summing to 18.
  - **Limits:** at most 10 sets, reps 1–30, whole kg, no negative weights.
  - **Incomplete projection:** `null`.
  - **Property test:** over a grid of projections (including decimals), the rules always hold (whole numbers, monotonic, steps ≤ 5 kg with only the jump into the best value smaller, last = rounded best, sum = rounded weekly reps).

## 2. Week editor

- [x] 2.1 "Autofill" button with a magic wand icon next to the step 2 title "Weights" (design 4–5): it gives exercises 1–29 without sets in all their sessions their sets, applied as one draft update so the autosave stores them. Verify with week editor tests:
  - **Button:** placement next to the title, the icon, and no sets before clicking.
  - **Filling:** the snatch is filled and saved.
  - **Untouched:** exercises with sets, free text or no projection stay as they are, also when they have sets in only one of two sessions.
  - **Two sessions:** the split.
  - **Added later:** only the newly added exercise is filled on a second click.
  - **Indicators:** none red or blue for the week 11 snatch.
- [x] 2.2 `MagicWandIcon` in `src/components/icons`, and the label "Autofill" / "Automatisch ausfüllen" in the messages. Verify with the messages completeness test.

## 3. Records and checks

- [x] 3.1 No new glossary terms and no domain model change; confirm the glossary and `domain-model.md` need no edit. Verify: no diff in these files from this change.
- [x] 3.2 Run tsc, ESLint and all tests. Verify: all pass.
- [x] 3.3 Browser check on the dev server and in Docker (desktop light, phone dark):
  - **Autofill:** plan a week with two exercises in two sessions, open step 2 (nothing filled), choose "Autofill", and the sets are filled, saved and still there after a reload.
  - **Indicators:** no red or blue indicators where the rules can be met.
  - **Untouched:** an exercise filled by hand stays unchanged.

  Verify: a flow script with all checks passing and screenshots.

## 4. Acceptance feedback

- [x] 4.1 Fewest jumps instead of most (every weight change counts, the smaller jump included), then the closer mHG. Verify with unit tests: week 11 snatch 70 70 70 70 70 75 80, an mHG within 5 % of the best value with no jump.
- [x] 4.2 Toolbar below the "Weights" title: undo, redo, Autofill, "Clear all weights"; undo/redo of value changes (typing per cell as one step, Autofill, clearing), greyed out when unavailable; "Clear" per exercise; new icons and texts in English and German. Verify with week editor tests (order, greying, undo/redo/clear, saving the result, German labels) and the browser flow.
- [x] 4.3 A jump every two sets as the ideal, more jumps from the heaviest weights down when the mHG needs them, a longer top run for a higher mHG; the exercise cell with marks and number only and the name as a hover tooltip; no "Clear" per exercise; arrow keys and Enter in the tables. Verify with unit tests (week 11: 65 65 70 70 75 75 80; 100/80 kg: 70 70 75 75 80 80 85 90 95 100), week editor tests (tooltip, Enter and arrow navigation) and the browser flow.
- [x] 4.4 Equal reps in every set whenever all four values stay within 5 % (weekly reps may then differ a little), else the uneven split; a narrower exercise column in the editor (4.5 rem, the note gets the rest). Verify with unit tests (week 11 in one session: 7 × 3; in two sessions: 4, 3, 3; set size 2.5 uneven; the grid test allows equal reps within 5 %), the week editor tests and the browser flow.
