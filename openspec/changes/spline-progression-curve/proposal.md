# Proposal

## Why

The intensity of a macrocycle follows a fixed S-shaped sine curve from the
entry value to 100 %. The coach can only shift single weeks up or down
(high/low weeks), not shape the progression itself. Coaches want to model
the curve like a gradation curve in Photoshop: anchor points they add,
move and remove, with a smooth curve through them (adjustment 5 in
`feature_list.txt`).

## What Changes

- **Curve and weeks modes in step 3:**
  - **The switch:** the intensity step gets a switch "Curve" / "Weeks". It
    opens in "Curve".
  - **"Curve" mode:** the chart shows the progression curve with its
    anchors, and no week handles or block sliders.
  - **"Weeks" mode:** works as today: high/low weeks and the block sliders,
    on top of the current curve.
- **Anchors** (user decisions):
  - **Start and end:** a new macrocycle starts with two anchors, the entry
    value in the first week and 100 % in the last week, joined by a
    straight line.
  - **Add:** clicking anywhere in the chart (not on an anchor) adds an
    anchor there.
  - **Drag:** inner anchors drag smoothly in all directions, without
    snapping to weeks.
  - **Remove:** clicking an inner anchor removes it, and so does dragging
    it to the very left or right of the chart.
  - **Entry anchor:** the first anchor only moves up and down. It *is* the
    entry value: dragging it changes the macrocycle's entry value (30–95 %,
    one decimal), and changing the entry value in step 1 moves it. It can't
    be removed.
  - **End anchor:** the last anchor stays fixed at 100 % in the last week
    and can't be moved or removed.
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
- `macrocycle-planning`: step 3 gets the Curve/Weeks switch and anchor
  editing; "Intensity chart with week handles" applies to the "Weeks"
  mode. New requirement for the curve API.

## Impact

- **Data:**
  - **Column:** a migration adds `macrocycle.curve_anchors` (`jsonb`, inner
    anchors `[{t, pct}]`, default `[]`).
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
