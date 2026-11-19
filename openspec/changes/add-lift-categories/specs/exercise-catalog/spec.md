## ADDED Requirements

### Requirement: Lift categories
Each catalog exercise SHALL have the lift categories it trains: snatch,
clean and/or jerk. Snatch: 1, 2, 6, 7, 8, 13, 15, 18, 22, 23. Clean: 3, 4,
9, 10, 11, 14, 16, 19, 20, 21, 24, 27, 28. Jerk: 3, 5, 12, 17, 25, 26, 28,
29. Exercises 30 to 45 SHALL have none. The catalog API SHALL return them
with each exercise.

#### Scenario: Clean and jerk
- **WHEN** a user looks up exercise 3 "Stoßen" (clean and jerk)
- **THEN** it has the categories clean and jerk

#### Scenario: Front squat
- **WHEN** a user looks up exercise 19 "Kniebeuge vorn"
- **THEN** it has the category clean

#### Scenario: No category
- **WHEN** a user looks up exercise 31 "Bankdrücken"
- **THEN** it has no lift category

#### Scenario: Categories in the API
- **WHEN** a signed-in client requests the catalog
- **THEN** exercise 12 "Standstoßen" is returned with the categories `["jerk"]`

### Requirement: Category marks
Wherever an exercise is shown with a category mark, the mark SHALL be a
small coloured dot before the name, one per category in the order snatch,
clean, jerk: snatch cyan #3bc8c8, clean purple #6f3ab1, jerk magenta
#ba2db3, the same in light and dark mode. Each dot SHALL name its category
for screen readers and on hover (Snatch/Reißen, Clean/Umsetzen,
Jerk/Ausstoßen). Exercises without a category SHALL have no mark.

#### Scenario: Two marks
- **WHEN** exercise 28 "Standumsetzen + Standstoßen" is shown with its mark
- **THEN** a purple and a magenta dot precede its name, read as "Clean" and "Jerk"

#### Scenario: German names
- **WHEN** a user hovers the cyan dot of exercise 1 in German
- **THEN** it shows "Reißen"

### Requirement: Categories on the catalog page
Each exercise on the catalog page SHALL show its category marks before its
name, and the exercise dialog's subtitle SHALL name its categories after
the exercise group.

#### Scenario: Catalog list
- **WHEN** a user opens the catalog
- **THEN** exercise 4 "Umsetzen" has a purple dot, exercise 5 "Ausstoßen" a magenta dot and exercise 33 "Klimmzug" none

#### Scenario: Dialog subtitle
- **WHEN** a user selects exercise 13 "Zug breit" in English
- **THEN** the dialog's subtitle reads "K3 · Schnellkraftfähigkeit (SKF) · Snatch exercise · Snatch"
