# Tasks

## 1. Calculation

- [x] 1.1 Implement the pure calculation module (cycle progress, curve shape, intensity with week levels, planned best value and average weight, set size, weekly reps, volume, mesocycle split, rounding); verify unit tests with every example value of the `macrocycle-calculation` spec plus edge cases (7 and 52 weeks, entry values 30 % and 95 %, exercises without values)

## 2. Data and domain

- [x] 2.1 Add the tables `macrocycle`, `macrocycle_week`, `mesocycle`, `mesocycle_exercise` with the enums and generate the migration; verify the tables and constraints in PostgreSQL
- [x] 2.2 Implement the base data validation and `createMacrocycle`, `updateBaseData` (incl. duration change rules), `setWeekLevel`, `setMesocycleExercises` and `getMacrocycle` with calculated weeks; verify PGlite tests (create with default mesocycles and medium weeks, required fields, Monday rule, ranges, `MACROCYCLE_EXISTS`, other Team → `ATHLETE_NOT_FOUND`, duration change keeps levels and exercises, calculated values of week 11 from the spec)

## 3. API

- [x] 3.1 Add the five macrocycle endpoints; verify route tests (201/200, 400 with field codes, 401, 403, 404 `ATHLETE_NOT_FOUND` / `MACROCYCLE_NOT_FOUND`, 409)

## 4. Pages

- [x] 4.1 Step 1 base data page with step indicator (new and edit, default entry value 60 %, next Monday as default start date, field errors); add English and German texts; verify component and page tests
- [x] 4.2 Load the `dataviz` skill, then build the macrocycle chart (intensity line with handles, mesocycle bands with legend, volume bars, ▲/▼ markers, horizontal scrolling for long cycles) and step 2 with drag, tap and keyboard changes saved per week; add English and German texts; verify component tests (snapping to three positions, keyboard, aria texts, saved level, revert on failure)
- [x] 4.3 Step 3 exercise selection per mesocycle (catalog grouped by exercise group, checkboxes, save per mesocycle, Finish to the details page); add English and German texts; verify component tests
- [x] 4.4 Macrocycle section on the athlete details page ("Plan macrocycle" or period, competition and "Change planning"); add English and German texts; verify component and page tests

## 5. Project records

- [x] 5.1 Add Entry value, Intensity, Week level, Set size, Weekly reps, Volume, Personal best, Goal and Main competition to `openspec/glossary.md`
- [x] 5.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md`

## 6. Integration check

- [x] 6.1 Browser check on the dev server at phone and desktop width: plan a 21-week macrocycle end to end, drag/tap/keyboard week levels, check intensity values in the chart against the spec, choose exercises and see the volume, change the duration; screenshots reviewed; both languages
- [x] 6.2 Docker stack: rebuild (verify the image is new), migration runs on start, repeat the main flow of 6.1

## 7. Acceptance feedback

- [x] 7.1 Extend the base data by training frequency (1–14), strengths, weightlifting experience and an ordered list of 1–3 focus points (schema, migration, validation, API, form with add/remove/reorder of focus points); add English and German texts; verify PGlite, route and component tests
- [x] 7.2 Adjustable mesocycle borders: borders endpoint, domain rule (each block ≥ 1 week), duration change scaling the block lengths, border handles in the chart (drag, keyboard); add English and German texts; verify calculation, PGlite, route and component tests
- [x] 7.3 Muted red/yellow/green mesocycle bands (light and dark) and tooltip placement that never covers the pointer or the point; verify component tests and screenshots
- [x] 7.4 Repeat the browser checks of 6.1 and 6.2 including focus points, border dragging, colours and the tooltip at the top right
- [x] 7.5 Add Training frequency and Focus point to `openspec/glossary.md` and the new attributes to `openspec/domain-model.md`

- [x] 7.6 Acceptance feedback: app palette tokens (#6f3ab1, #ba2db3, #3bc8c8, #d7f212) for the mesocycle bands and legend, white haloed curve/points/markers, week points and numbers at the start of each week; verify component tests, the browser check and screenshots in light and dark mode

- [x] 7.7 Acceptance feedback: remove keyboard control of week handles and borders, the table view and the volume bar chart; add axis titles "Week" and "Intensity"; make the chart fit the width on phones (no horizontal scrolling, scaled points); add English and German texts; verify component tests, the browser check and phone screenshots (21 and 52 weeks)

- [x] 7.8 Acceptance feedback: exercise step as one table (exercise × GLP/ABP/LAP) with a dialog per cell; variation (optional) and reason (required) per mesocycle choice: migration 0008, domain functions, per-exercise PUT/DELETE API replacing the bulk PUT, English and German texts; verify domain, API and component tests, the browser check and phone/desktop screenshots

- [ ] 7.9 Acceptance feedback: split deficits into snatch, clean, jerk and other (base data form, schema, migration); catalog "Addresses" tags (source column, translations, tag tables, generated data migration, catalog details); reason as tags + optional note per choice (migration, domain, API); dialog shows the deficits of the reference lift and tag buttons; English and German texts; verify tests, browser check and screenshots

## Workflow follow-up

- User acceptance, archive, PR into main. Next: macrocycle view (feature 7).
