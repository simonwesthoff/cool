# Tasks

## 1. Domain and API

- [ ] 1.1 Add `requireViewableAthlete` (coach of the Team or linked user) and use it in `getMacrocycle` and `findMacrocycle`; all write functions keep coach-only access. Verify with PGlite tests: linked athlete reads (same content as the coach); linked athlete gets `ATHLETE_NOT_FOUND` for base data, SWOT, week level, borders and exercise changes; unrelated user gets `ATHLETE_NOT_FOUND`; a user who is coach and athlete of different Teams sees both.
- [ ] 1.2 Allow the linked athlete on `GET /api/athletes/{id}/macrocycle`. Verify with route tests: 200 for the linked athlete, 404 for their write requests, 401 without a session.

## 2. Chart

- [ ] 2.1 Load the `dataviz` skill, then add `showVolume` to `MacrocycleChart`:
  - **Volume plot:** below the week axis, with its own scale and a "Volume" title; bars start at the week, with a 2 px gap and rounded tops.
  - **Empty cases:** no bar for weeks without volume; "No exercises chosen yet" when no week has a volume.
  - **Hit areas:** they cover both plots.

  Verify with component tests: bar positions and heights against the scale; null weeks without bars; the empty message; the tooltip stays three lines.
- [ ] 2.2 Add the current-week marker (`today` prop):
  - **Marker:** column highlight across both plots, plus a "Now" label in the label row.
  - **Overlaps:** mesocycle labels give way; "Now" moves aside when it meets the competition label.
  - **Outside the cycle:** no marker before the start or after the end.

  Verify with component tests for week 6 on 2027-01-06, before the start, after the end, and the label collisions.

## 3. View and pages

- [ ] 3.1 Build `MacrocycleSummary`:
  - **Sections:** "Historical data", "New macrocycle plan", then deficits with injuries and illnesses.
  - **Empty values:** body fat and muscle mass are left out when empty; empty SWOT texts read "Not entered yet".

  Verify with component tests using the spec examples (period "Nov 30, 2026 – Apr 25, 2027", 21 weeks, competition, 60 %), in English and German.
- [ ] 3.2 Build `MacrocycleView`:
  - **Content:** "Week n of N" / "Starts on …" / "Ended on …", the summary, and the chart with `showVolume` and `today`.
  - **Coach only:** "Change planning" when `editHref` is given.
  - **Back link:** depends on the role.

  Verify with component tests: no editing handles reacting, and no "Change planning" for the athlete.
- [ ] 3.3 Coach page `/athletes/{id}/macrocycle`: it redirects to step 1 without a macrocycle and shows "not found" for other users. Verify with page tests.
- [ ] 3.4 Athlete page `/training/macrocycle`:
  - **Own macrocycle:** shown from `roles.athlete`.
  - **Not planned yet:** "not planned yet" text.
  - **No athlete role:** redirect to `/`.

  Verify with page tests.
- [ ] 3.5 Entry points:
  - **Athlete details:** the section links to the view and keeps "Change planning".
  - **"My training":** a "Macrocycle" link card when a macrocycle exists.

  Verify with component and page tests.
- [ ] 3.6 Add English and German texts for all new strings ("Week n of N", start and end texts, "Now", "Volume", empty states, section titles, links). Verify with the message completeness test.

## 4. Project records

- [ ] 4.1 Add "Macrocycle view" and "Current week" to `openspec/glossary.md`, keeping the user's uncommitted glossary edits. Verify the entries are in the table.

## 5. Integration check

- [ ] 5.1 Browser check on the dev server and on the Docker build, at phone and desktop width, in light and dark mode:
  - **Coach:** opens the view from athlete details, then "Change planning" and back.
  - **Linked athlete:** opens it from "My training", read-only; their API write attempts get 404.
  - **Chart:** volume bars match the chosen exercises; the current-week marker is in the right week.

  Review the screenshots.

## Workflow follow-up

- User acceptance, archive (sync specs), PR into main. Next: weekly plans (features 9 and 10), then athlete details (feature 5).
