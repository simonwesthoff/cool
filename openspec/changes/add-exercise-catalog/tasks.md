# Tasks

## 1. Data

- [x] 1.1 User reviews and approves the English names in `translations.md`; apply any corrections to that file (done with the user)
- [ ] 1.2 Move the CSV to `data/exercise-catalog/Trainingsmittelkatalog.csv` with the typo fixes and create `translations.en.json` from the approved `translations.md`; verify the files are committed and the root copy is gone
- [ ] 1.3 Add the `exercise_group` and `exercise` tables (with the `reference_lift` enum) and generate the schema migration; verify the tables in PostgreSQL
- [ ] 1.4 Write the `catalog:migration` script (CSV parser for quoted fields, validation, upsert SQL as a custom migration) and generate the data migration; verify unit tests for the parser and validation, and a PGlite test that all 45 exercises and 9 groups exist with the values of exercises 1, 13 and 31

## 2. Domain and API

- [ ] 2.1 Implement `getCatalog` and `getExercise` in `src/domain/exercises` and `GET /api/exercises`; verify PGlite and route tests (order, both languages, empty values as null, 401 without session)

## 3. Pages and navigation

- [ ] 3.1 Build the catalog list `/exercises` (number, name, group code/name, best value; every row links to the exercise) and the exercise page `/exercises/{number}` (all information, "not defined" for empty values, back link, not found for unknown numbers) for every signed-in user, with locale number formatting; add English and German texts; verify component tests (German and English names, list row of exercise 31 without best value, all values of exercise 13) and page tests
- [ ] 3.2 Replace the role switch with `AppNavigation` (tabs per role, bottom bar on phones, header from `sm`, current tab marked, safe-area padding), move the language switcher into the account menu and the footer to the signed-out pages; add English and German texts; verify component tests for the tabs per role and the account menu

## 4. Project records

- [ ] 4.1 Add Exercise group, Best value, Reference lift and the group names with abbreviations to `openspec/glossary.md`
- [ ] 4.2 Apply the "Domain model changes" from design.md to `openspec/domain-model.md`

## 5. Integration check

- [ ] 5.1 Browser check on the dev server at phone and desktop width: tabs per role (coach, athlete, both, none), bottom bar stays visible, catalog content in both languages, no sideways scrolling, language switch in the account menu; screenshots reviewed
- [ ] 5.2 Docker stack: rebuild (verify the image is new), migrations run on start, repeat 5.1 briefly

## Workflow follow-up

- User acceptance, archive, PR into main.
