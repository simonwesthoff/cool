# Tasks

## 1. Data

- [x] 1.1 User reviews and approves the English names in `translations.md`; apply any corrections to that file (done with the user)
- [x] 1.2 Move the CSV to `data/exercise-catalog/Trainingsmittelkatalog.csv` with the typo fixes and create `translations.en.json` from the approved `translations.md`; verify the files are committed and the root copy is gone
- [x] 1.3 Add the `exercise_group` and `exercise` tables (with the `reference_lift` enum) and generate the schema migration; verify the tables in PostgreSQL
- [x] 1.4 Write the `catalog:migration` script (CSV parser for quoted fields, validation, upsert SQL as a custom migration) and generate the data migration; verify unit tests for the parser and validation, and a PGlite test that all 45 exercises and 9 groups exist with the values of exercises 1, 13 and 31

## 2. Domain and API

- [x] 2.1 Implement `getCatalog` and `getExercise` in `src/domain/exercises` and `GET /api/exercises`; verify PGlite and route tests (order, both languages, empty values as null, 401 without session)

## 3. Pages and navigation

- [x] 3.1 Build the catalog list `/exercises` (number, name, group code/name, best value; every row links to the exercise) and the exercise page `/exercises/{number}` (all information, "not defined" for empty values, back link, not found for unknown numbers) for every signed-in user, with locale number formatting; add English and German texts; verify component tests (German and English names, list row of exercise 31 without best value, all values of exercise 13) and page tests
- [x] 3.2 Replace the role switch with `AppNavigation` (tabs per role, bottom bar on phones, header from `sm`, current tab marked, safe-area padding), move the language switcher into the account menu and the footer to the signed-out pages; add English and German texts; verify component tests for the tabs per role and the account menu

- [x] 3.3 Acceptance feedback: group the catalog list into one block per exercise group (heading with code and name) instead of a group column; verify component tests and the browser check (phone and desktop screenshots)

- [x] 3.4 Acceptance feedback: show an exercise's information in a dialog over the list instead of a separate page (close button, Escape, outside click, focus handling) and remove the `/exercises/{number}` page; verify component tests and the browser check

- [x] 3.5 Acceptance feedback: dialog title "number name" as one text, subtitle with exercise group and reference lift ("Snatch exercise" / "C&J exercise"); add English and German texts; verify component tests and a screenshot

## 4. Project records

- [x] 4.1 Add Exercise group, Best value, Reference lift and the group names with abbreviations to `openspec/glossary.md`
- [x] 4.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md`

## 5. Integration check

- [x] 5.1 Browser check on the dev server at phone and desktop width: tabs per role (coach, athlete, both, none), bottom bar stays visible, catalog content in both languages, no sideways scrolling, language switch in the account menu; screenshots reviewed
- [x] 5.2 Docker stack: rebuild (verify the image is new), migrations run on start, repeat 5.1 briefly

## Workflow follow-up

- User acceptance, archive, PR into main.
