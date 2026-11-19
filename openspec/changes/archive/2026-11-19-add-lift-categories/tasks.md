# Tasks

## 1. Data

- [x] 1.1 Add the column "Kategorie" to `data/exercise-catalog/Trainingsmittelkatalog.csv` with the categories from the proposal (German values `Reißen`, `Umsetzen`, `Ausstoßen`, comma-separated; empty for 30–45). Verify: a script check that the numbers per category match the proposal exactly.
- [x] 1.2 Schema: `exercise.lift_categories text[] not null default '{}'` and its migration. `catalog-source.ts` parses the column (an unknown value is an error), and `npm run catalog:migration` regenerates the data migration that fills it. Verify with `catalog-source` unit tests (parsing, order snatch–clean–jerk, unknown value) and the catalog data test on PGlite (3 → clean and jerk, 19 → clean, 31 → none).
- [x] 1.3 `LiftCategory` and `Exercise.liftCategories` in `catalog-types.ts`; the catalog query and API return it. Verify with the catalog domain and route tests (exercise 12 → `["jerk"]`).

## 2. UI

- [x] 2.1 Colour tokens `--lift-snatch`, `--lift-clean` and `--lift-jerk`. `LiftMarks` component: one dot per category, with the name as `title` and for screen readers. Messages `Catalog.categories.{snatch,clean,jerk}` in English and German. Verify with component tests (two dots for 28, none for 31, German names) and the messages completeness test.
- [x] 2.2 Catalog page: marks before the names in the list; the dialog subtitle names the categories after the group. Verify with the updated catalog component tests (4 purple, 5 magenta, 33 none; the subtitle of exercise 13).
- [x] 2.3 Week editor: marks in the step 1 exercise list and session cards, and in the step 2 exercise cell. Verify with week editor tests (exercise 4 on Monday's card and in the list, exercise 3 with two marks in step 2).
- [x] 2.4 Week view: marks in the week tables. Verify with a `training-week-section` test (snatch marked, pull-up not).
- [x] 2.5 Chart colour: a `color` parameter on `WeekChart` for the stroke, the gradient and the hover dot. `ExerciseChart` uses the first category's colour, or the neutral ink without a category; the planning chart stays magenta. Verify with chart tests (exercise 1 cyan, 4 purple, 5 magenta, 3 purple, an exercise without a category neutral, the intensity chart magenta).

## 3. Records and checks

- [x] 3.1 Glossary "Lift category (Bewegungskategorie)" without touching the user's uncommitted edits, and `domain-model.md` (`Exercise.liftCategories`). Verify: `git diff --cached` shows only these lines.
- [x] 3.2 Browser check on the dev server and in Docker (desktop and phone, light and dark):
  - **Where the marks show:** catalog list and dialog, week editor steps 1 and 2, week view.
  - **Chart colour:** cyan for the snatch, purple for the clean, magenta for the jerk in the macrocycle view.

  Verify: screenshots and a script check of the dots' colours.

## 4. Acceptance feedback

- [x] 4.1 Two categories: one dot with a left-to-right gradient instead of two dots, and the chart's curve, area and hover dot with a left-to-right gradient; purple (clean) always left, magenta (jerk) right. Verify with component tests (gradient style of the dot, gradient stops and references in the chart) and the browser flow (computed gradient of the dot, gradient stops of the curve).

## Workflow follow-up

- After acceptance: archive the change (sync the specs) and open a PR into main.
