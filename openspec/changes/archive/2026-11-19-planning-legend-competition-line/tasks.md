# Tasks

## 1. Charts

- [x] 1.1 Planning chart: no visible legend (`legendVisible` off). The legend list stays for screen readers, with the block names, "▲▼ High / low week" and "Main competition". Verify with chart tests: the legend list is `sr-only` and keeps its entries, and no legend text is visible above the chart.
- [x] 1.2 Competition line up to the name: `CompetitionMarkerLine` draws the line from the top of the name (the label row's cap height above its baseline) to the plot's bottom, in every chart. Verify with chart tests: the line's `y1` is above the label's baseline by the cap height and below the chart's top, and `y2` is the plot's bottom (planning and exercise chart).
- [x] 1.3 Gap over a block label: when the line's x falls within a shown block label's box (start + estimated width), draw two segments that leave out that label's row. Verify with chart tests: a competition 3 days into the competition preparation block → two segments, the gap covering the "CPB" row and the label still rendered; a competition in the last week of a normal plan → one segment.

## 2. Checks

- [x] 2.1 Run tsc, ESLint and all tests. Verify: all pass.
- [x] 2.2 Browser check on the dev server and in Docker (desktop and phone, light and dark):
  - **Planning:** step 3 without a legend.
  - **Line:** it reaches the name in step 3, the macrocycle view and the athlete page.
  - **Gap:** a seeded plan whose competition preparation block starts just before the competition shows the gap and a fully visible "CPB".

  Verify: screenshots and a script check that no segment of the line intersects any block label's bounding box.

## Workflow follow-up

- After acceptance: archive the change (sync the specs) and open a PR into main.
