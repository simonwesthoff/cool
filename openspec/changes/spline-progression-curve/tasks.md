# Tasks

## 1. Calculation and data

- [x] 1.1 `curveValue(entryPct, anchors, t)`: a natural cubic spline through (0, E), the inner anchors and (1, 100), capped to 0–100. `intensity` and `plannedExercise` take the curve. Verify with unit tests: the straight line for no anchors (60 % → weeks 1/6/11/16/21 = 60/70/80/90/100), passing through an anchor (0.25, 90) → week 6 = 90, the cap at 100, and ±5 for high/low weeks.
- [x] 1.2 Approximation check: a unit test that the two sine-derived anchors (t = 1/3 and 2/3) keep the curve within 1.2 points of the sine for entry 60 % and within 2.0 points for 30 %, and that weeks 1, 11 and 21 of 21 stay 60/80/100 %. Verify: the test passes.
- [x] 1.3 Migration: add `macrocycle.curve_anchors jsonb not null default '[]'` and fill the two anchors for existing rows in SQL. Verify with a PGlite test: a row inserted before the migration step gets `[{t: 1/3, pct: 70}, {t: 2/3, pct: 90}]` for entry 60 %, and a new macrocycle has `[]`.
- [x] 1.4 Domain:
  - **Reading:** `Macrocycle.curve` (`{ anchors }`); `macrocycles.ts` builds week intensities and exercise values from the curve.
  - **`setCurve(user, athleteId, input)`:** validation as in design 4; it updates the entry value and the anchors together.

  Verify with PGlite tests: setCurve as coach, the linked athlete refused, a 403/404 like the other planning changes, each validation error, and the duration change keeping the anchors' positions.
- [x] 1.5 API `PUT /api/athletes/{id}/macrocycle/curve`. Verify with route tests: 200 with recalculated week 6, 400 `VALIDATION_FAILED` with field codes, 401 without a session, and the 403/404 cases.

## 2. Step 3

- [x] 2.1 `WeekChart` curve mode: the curve sampled from `curveValue`; the anchors drawn as handles; the gestures add, drag (continuous), remove by click or edge, the entry anchor vertical only and clamped, and the end anchor inert; each gesture calls `onChange` once. Verify with chart tests for every gesture (pointer events), the clamping, no snapping (a fractional `t`), and that the end anchor ignores input.
- [x] 2.2 `IntensityPlanner`:
  - **Switch:** "Curve" / "Weeks" (starts in "Curve"), with a help text per mode.
  - **Saving:** `onChange` saves through the curve API optimistically, and a failure reverts and shows the existing failure message.
  - **Weeks mode:** unchanged.

  Verify with component tests: the default mode, switching, a save request body, a revert on 500, and the week handles only in "Weeks".
- [x] 2.3 Messages in English and German: the switch labels, two help texts, and the anchor names for screen readers (e.g. "Entry value 60 %", "Anchor at week 6.4: 90 %", "End 100 %"). Verify with the messages completeness test.

## 3. Records and checks

- [x] 3.1 Glossary: "Progression curve (Progressionskurve)" and "Anchor (Ankerpunkt)", without touching the user's uncommitted edits. `domain-model.md`: `Macrocycle.curveAnchors`. Verify: `git diff --cached` shows only these lines.
- [x] 3.2 Run tsc, ESLint and all tests. Verify: all pass.
- [x] 3.3 Browser check on the dev server and in Docker (desktop and phone, light and dark):
  - **Curve mode:** step 3 opens in "Curve"; add an anchor by click, drag it smoothly (a fractional position stored), remove one by click and one by dragging to the edge, drag the entry anchor (entry value shown in step 1).
  - **End anchor and reload:** the end anchor is unmovable, and the curve stays after a reload.
  - **Weeks mode:** high/low weeks work on the new curve, and the macrocycle view shows the new values.

  Verify: a flow script with all checks passing and screenshots.

## 4. Acceptance feedback

- [x] 4.1 Movable end anchors: entry and end anchors move in any direction (end value 0–100 %), with "Entry value X %" / "End value X %" beside them while moved, and the curve level before and after them (migration 0023: `curve_entry_t`, `curve_end_pct`, `curve_end_t`; API fields `entryT`, `endValuePct`, `endT`). An inner anchor is removed by a click or by dropping it horizontally close to a neighbouring anchor, not at the chart's edge. Verify with calculation, domain and route tests (level stretches, validation `OUTSIDE_ENDS`) and chart tests (gestures, value text, fading, level lines), plus the browser flow.

- [x] 4.2 Curve and weeks as separate steps 3 and 4 (five planning steps, old `intensity` address → step 4), both charts 0–110 %; entry and end anchors snap to whole weeks, the entry value moves in whole percents, the end value stays above the entry value (API `NOT_ABOVE_ENTRY`) (the dip warning added here was removed again in 4.4). Verify with planning, chart and domain tests and the browser flow.
- [x] 4.3 An inner anchor disappears while dragged as soon as it is within half a week (horizontally) of a neighbouring anchor, saved at once without releasing. Verify with chart tests (0.6 weeks: kept, 0.4 weeks: removed before release, saved once) and the browser flow (removed while the mouse is still down).
- [x] 4.4 No dip warning; two horizontal guides at the entry and end values (block lines' style) that move with their anchors; the new help text of step 3. Verify with chart tests (guide positions, style, following a drag, help text) and the browser flow.

## Workflow follow-up

- After acceptance: archive the change (sync the specs) and open a PR into main.
