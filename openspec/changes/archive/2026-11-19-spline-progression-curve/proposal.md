# Proposal

## Why

The intensity of a macrocycle follows a fixed S-shaped sine curve from the
entry value to 100 %. The coach can only shift single weeks up or down
(high/low weeks), not shape the progression itself. Coaches want to model
the curve like a gradation curve in Photoshop: anchor points they add,
move and remove, with a smooth curve through them (adjustment 5 in
`feature_list.txt`).

## What Changes

- **Curve and weeks as separate steps** (user decision): the planning gets
  five steps, 1 base data, 2 SWOT, 3 "Curve" (the progression curve with
  its anchors), 4 "Weeks" (high/low weeks and block sliders, on the
  current curve, as before) and 5 exercises. The old address
  `…/macrocycle/intensity` opens step 4. Both chart steps show the
  intensity from 0 to 110 %.
- **Guides** (user decision): two horizontal helper lines, in the style of
  the block start lines, mark the entry and the end value and move with
  their anchors. There is no warning for a dipping curve; the help text
  says "Shape the overall progression curve. Add new anchors by clicking
  into the curve and drag them around to shape the progression for your
  athlete. High and low weeks can be set in the next step."
- **Anchors** (user decisions):
  - **Start and end:** a new macrocycle starts with two anchors, the entry
    value in the first week and 100 % in the last week, joined by a
    straight line.
  - **Add:** clicking anywhere in the chart (not on an anchor) adds an
    anchor there.
  - **Drag:** all anchors drag smoothly in all directions, without
    snapping to weeks.
  - **Remove:** clicking an inner anchor removes it, and so does dragging
    it within half a week (horizontally) of a neighbouring anchor: it
    disappears at once, without releasing (user decision).
  - **Entry anchor:** its value *is* the entry value. Dragging it changes
    the macrocycle's entry value (30–95 %, one decimal), and changing the
    entry value in step 1 moves it.
  - **End anchor:** it starts at 100 % in the last week and can be moved
    too (end value 0–100 %).
  - **Moving the outer anchors:** both move in any direction (user
    decision), horizontally only to whole weeks (snapping to the closest
    week). The entry value moves in whole percents, and the end value
    always stays above the entry value. While one is moved, "Entry value X %" or "End value X %" is
    shown next to it. Moved inwards, the curve stays level (a straight
    horizontal line) from the start to the entry anchor and from the end
    anchor to the end. Neither can be removed.
  - **Saving:** every change is saved when the pointer is released.
- **Curve:** a natural cubic spline through all anchors (user decision; it
  may bulge between anchors). Its value is capped to 0–100 %. High and low
  weeks still add or subtract 5 percentage points on top of the curve.
- **Relative positions:** anchors sit at a relative position in the cycle
  (0 = first week, 1 = last week), so changing the duration keeps the
  curve's shape.
- **Existing macrocycles** (only test macrocycles so far) get an
  approximation of their S-curve with two inner anchors (user decision):
  - **Lower left:** one at a third of the cycle, below the straight line
    (25 % of the way from the entry value to 100 %).
  - **Upper right:** one at two thirds, above it (75 % of the way).
  - **The difference:** the curve then differs from the old one by at most
    1.2 percentage points for entry value 60 % (2.0 points for 30 %). The
    user accepted this since no macrocycles are in production.
- **High weeks** may go beyond 100 % (user decision): the cap applies to
  the curve, and a high week adds 5 points on top of it.
- **API:** `PUT /api/athletes/{id}/macrocycle/curve` with the entry value
  and the inner anchors; it returns the macrocycle with all recalculated
  weeks.

Out of scope: undo/redo of curve edits; curve presets; anchors per
mesocycle; changing how high/low weeks work.

New domain terms: **Progression curve** (Progressionskurve): the
macrocycle's intensity over the cycle before high/low weeks. **Anchor**
(Ankerpunkt): a point the progression curve passes through.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `macrocycle-calculation`: "Intensity curve" becomes a natural spline
  through the anchors, capped to 0–100 %, instead of the sine. New
  requirements for the anchors and for existing macrocycles.
- `macrocycle-planning`:
  - **Steps:** "Planning in four steps" is replaced by "Planning in five
    steps", with new requirements for the curve and weeks steps, the
    entry and end guides, anchor editing and the curve API.
  - **Renumbering:** the step numbers in the chart, border, exercise,
    legend and one-page requirements are updated.

## Impact

- **Data:**
  - **Columns:** a migration adds `macrocycle.curve_anchors` (`jsonb`, inner
    anchors `[{t, pct}]`, default `[]`); a second one adds
    `curve_entry_t` (default 0), `curve_end_pct` (default 100) and
    `curve_end_t` (default 1).
  - **Existing rows:** the same migration fills the two-anchor S-curve
    approximation for them.
- **Domain:**
  - **Calculation:** `calculation.ts` gets a natural spline (`curveValue`).
    `intensity` and `plannedExercise` take the curve instead of the entry
    value alone.
  - **Macrocycle:** `macrocycles.ts` passes the anchors, gets `setCurve`
    (validation, entry value sync), and exposes `curve` in `Macrocycle`.
- **API:** the route `macrocycle/curve/route.ts`.
- **UI:**
  - **Chart:** `WeekChart` gets a curve mode with anchors (add, drag,
    remove).
  - **Step 3:** `IntensityPlanner` gets the switch and saves the curve.
- **Messages:** mode names, help texts and anchor labels in English and
  German.
- **Records:** the glossary terms and `domain-model.md`
  (`Macrocycle.curveAnchors`).
