# Proposal

## Why

When planning a session, the coach wants to see at a glance whether a
snatch, clean or jerk movement is already on that day. Today the catalog
only knows an exercise's reference lift (snatch or clean & jerk), which
does not tell a clean from a jerk movement (adjustment 3 in
`feature_list.txt`).

## What Changes

- **Lift categories:** every catalog exercise gets the lift categories it
  trains: snatch, clean and/or jerk (user decision):
  - **Snatch:** 1, 2, 6, 7, 8, 13, 15, 18, 22, 23.
  - **Clean:** 4, 9, 10, 11, 14, 16, 19, 20, 21, 24, 27.
  - **Jerk:** 5, 12, 17, 25, 26, 29.
  - **Clean and jerk (both):** 3 and 28.
  - **None:** 30–45 (accessory and machine work).
- **Source:** the categories live in the catalog source
  (`data/exercise-catalog/Trainingsmittelkatalog.csv`, new column
  "Kategorie") and reach the database through a generated data migration,
  like the rest of the catalog.
- **Colours** (user decision), the same in light and dark mode: snatch cyan
  `#3bc8c8`, clean purple `#6f3ab1`, jerk magenta `#ba2db3`.
- **Category mark:** a small coloured dot before the exercise name, one per
  category (two for 3 and 28). Screen readers hear the category's name, and
  hovering shows it. It appears:
  - in the week editor's step 1: the exercise list and the exercises on the
    session cards;
  - in the week editor's step 2: the exercise cell of the Sets & weights
    tables;
  - in the training week view (athlete page and "My training");
  - on the exercise catalog page: the list rows, and the category names in
    the exercise dialog's subtitle.
- **Exercise chart:** in the macrocycle view and on the athlete page, the
  curve and its gradient take the colour of the selected exercise's
  category.
- **Assumptions:**
  - **Both categories:** an exercise with clean and jerk (3, 28) draws its
    curve in its first category's colour (clean purple).
  - **No category:** an exercise without a category draws its curve in the
    neutral chart ink (dark grey in light mode, light grey in dark mode).
  - **Planning chart:** the intensity chart has no exercise, so its curve
    stays magenta.

Out of scope: the remaining adjustments in `feature_list.txt`; filtering or
sorting by category; using the categories in calculations.

New domain terms: **Lift category** (Bewegungskategorie): snatch, clean or
jerk, the competition movements an exercise trains.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `exercise-catalog`: new requirements for the lift categories of each
  exercise and their marks on the catalog page and in the details dialog.
- `week-planning`: new requirement for category marks in both editor
  steps.
- `week-view`: new requirement for category marks in the week tables.
- `macrocycle-view`: "Exercise chart" — the curve takes the category colour
  instead of always pink.
- `macrocycle-planning`: "One week chart" — the curve colour is set per
  chart (magenta for intensity, the category colour for an exercise).

## Impact

- **Data:**
  - **Catalog source:** a new CSV column "Kategorie" (values `Reißen`,
    `Umsetzen`, `Ausstoßen`, comma-separated).
  - **Database:** a schema migration adds `exercise.lift_categories`
    (`text[]`), and a regenerated data migration fills it.
  - **Code:** `catalog-source.ts` parses the new column.
- **Domain/API:** `Exercise.liftCategories` in `catalog-types.ts`; the
  catalog API returns it.
- **UI:**
  - **Mark:** a new shared category mark component.
  - **Where it is used:** `exercise-list.tsx`, `session-card.tsx`,
    `session-table.tsx`, `week-view-table.tsx`, the catalog page and its
    dialog.
  - **Chart:** a curve colour parameter on `WeekChart`, used by
    `ExerciseChart`.
- **Styles:** colour tokens `--lift-snatch`, `--lift-clean` and
  `--lift-jerk` in `globals.css`.
- **Messages:** category names in English and German (Snatch/Reißen,
  Clean/Umsetzen, Jerk/Ausstoßen).
- **Records:** glossary "Lift category" and `domain-model.md`
  (`Exercise.liftCategories`).
