# Proposal

## Why

The planning chart (step 3) still shows a legend with the three block
names, "▲▼ High / low week" and "Main competition". Without the block
colours it explains nothing the chart doesn't show itself. In addition,
the main competition's name moved one row above the block labels, but its
dashed line still stops at the plot's top, so line and name look
disconnected (adjustment 4 in `feature_list.txt`).

## What Changes

- **No legend in the planning chart:** the visible legend above the
  planning chart is removed. As in the exercise chart, it stays available
  to screen readers.
- **Line up to the name:** in every chart (planning, macrocycle view,
  athlete page), the main competition's dashed line continues from the
  plot up to the top of its name, so the name sits next to the line's end.
  - **Crossing labels:** where the line passes the row of the block labels,
    it SHALL leave a gap around any block label it would cross (a block
    starting within a few days before the competition), so every label stays
    fully visible (user decision).

Out of scope: adjustment 5 (spline progression); any other change to the
charts.

New domain terms: none.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `macrocycle-planning`:
  - **"Intensity chart with week handles":** the scenario "Mesocycle
    colours" no longer mentions a visible legend.
  - **"Mesocycle abbreviations":** the full names are in the legend for
    screen readers.
  - **"Main competition in the chart":** the line reaches the name and
    leaves a gap where it would cross a block label.
  - **New requirement:** no visible legend in the planning chart.

## Impact

- **Components:**
  - **`macrocycle-chart.tsx`:** the planning chart no longer sets
    `legendVisible`, and the "▲▼" legend entry stays for screen readers.
  - **`chart-frame.tsx`:** `CompetitionMarkerLine`'s line starts at the
    top of the name. Where its x lies within a shown block label's estimated
    width (6.2 px per character, the measure the chart already uses), it is
    drawn as two segments with a gap over that label's row.
- **Tests:** the planning chart's legend test and the competition marker
  tests.
- **No API, database or message changes.**
