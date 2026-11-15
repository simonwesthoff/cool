# Proposal

## Why

Every training plan (macrocycle, mesocycles, weekly plans) is built from
the exercises of the exercise catalog, with its reference values for best
value, average weight and repetitions. The catalog therefore comes first.
Coaches and athletes also want to look things up in it at any time, so the
app gets a separate tab for it.

## What Changes

- **Exercise catalog data.** The 45 exercises in 9 exercise groups from
  `Trainingsmittelkatalog.csv` become part of the app: catalog number,
  name, exercise group, reference lift (snatch or clean & jerk), best value
  (% of the reference lift's max), max. weekly average weight (%), min./max.
  reps per set and per week, and a comment. Typos in the file are fixed
  ("Kniebeuge vorne", "Allgemeines Muskelkrafttraining", a trailing space).
- **One catalog for everyone.** The catalog is the same for every Team and
  read-only in the app. It is the basis every Team starts with; adjusting
  values per athlete is a later change. New versions of the catalog come as
  a new version of the file.
- **English and German.** Exercise, group and comment texts exist in both
  languages; the English names are proposed in `translations.md` and
  reviewed by the user.
- **Catalog tab.** A new "Exercises" page lists all exercises with number,
  name, exercise group and best value; selecting one shows all its
  information on its own page.
- **Navigation.** The app gets tabs: "Athletes" (coaches), "My training"
  (athletes) and "Exercises" (every signed-in user). On phones they form a
  bottom tab bar, on larger screens they sit in the header. This replaces
  the "My Team / My training" switch. The language switcher moves into the
  account menu on signed-in pages (the sign-in page keeps it in the footer).
- **API.** An endpoint returns the catalog with both languages.

### Out of scope

- Adjusting catalog values per athlete or per Team (later change).
- Adding, editing or removing exercises in the app.
- Using exercises in plans (macrocycle and weekly planning changes).
- Search or filtering in the catalog.

### New domain terms

- **Exercise group** (Komplex, K1–K9): group of exercises in the exercise
  catalog with the same training focus.
- **Best value** (Bestwert): reference value of an exercise in % of the max
  of its reference lift.
- **Reference lift** (Referenzübung): the competition lift (snatch or clean
  & jerk) an exercise's percentages refer to.
- The group names and their German abbreviations (WKÜ, TWKÜ, SKF, MKF, AMKT)
  are added to the glossary with their English names.

## Capabilities

### New Capabilities

- `exercise-catalog`: The catalog's content, its languages, the catalog
  page and the catalog API.

### Modified Capabilities

- `user-roles`: The "My Team / My training" switch becomes the app's tab
  navigation, which also contains the catalog tab.
- `authentication`: The account menu also contains the language switcher.

## Impact

- New tables `exercise_group` and `exercise`, filled by a migration from
  the catalog data files.
- New domain module `src/domain/exercises`, endpoint `GET /api/exercises`,
  page `/exercises`.
- Navigation components replace the role switch; footer only on signed-out
  pages.
- Glossary: new terms; domain model: Exercise group and Exercise.
