# Spec Delta

## Purpose

Provides the exercise catalog, the set of exercises with their reference
values that all training planning is based on, and lets every signed-in
user look it up.

## ADDED Requirements

### Requirement: Catalog content
The app SHALL contain the exercise catalog with 45 exercises in 9 exercise
groups (K1 to K9). Each exercise SHALL have its catalog number, name,
exercise group and, where the catalog defines them, reference lift, best
value, max. weekly average weight, min./max. reps per set, min./max. reps
per week and a comment.

#### Scenario: Competition exercise
- **WHEN** a user looks up exercise number 1
- **THEN** it is "Reißen" (Snatch) in group K1 with reference lift snatch, best value 100 %, max. weekly average weight 86 %, 1 to 5 reps per set and 10 to 30 reps per week

#### Scenario: Exercise without reference values
- **WHEN** a user looks up exercise number 31 "Bankdrücken"
- **THEN** it belongs to group K8 and has no reference lift and no reference values

### Requirement: Same catalog for every Team
The catalog SHALL be the same for every user and Team and SHALL NOT be
changeable in the app.

#### Scenario: Two coaches
- **GIVEN** two coaches with different Teams
- **WHEN** both open the catalog
- **THEN** they see exactly the same exercises and values

### Requirement: Catalog languages
Exercise names, group names and comments SHALL be shown in the user's UI
language: the German catalog texts in German, the reviewed English names in
English.

#### Scenario: German
- **GIVEN** a user with German selected
- **WHEN** they open the catalog
- **THEN** exercise 4 is called "Umsetzen" and group K3 "Schnellkraftfähigkeit (SKF)"

#### Scenario: English
- **GIVEN** a user with English selected
- **WHEN** they open the catalog
- **THEN** exercise 4 is called "Clean" and group K3 "Speed strength"

### Requirement: Catalog page
Every signed-in user SHALL be able to open the catalog page from the app's
navigation. It SHALL list the exercises grouped by exercise group in catalog
order, each with number, name and reference lift, and show its reference
values and comment. It SHALL be readable without horizontal scrolling on a
phone.

#### Scenario: Open the catalog
- **GIVEN** a signed-in coach or athlete
- **WHEN** they choose "Exercises" in the navigation
- **THEN** they see the groups K1 to K9 in order with their exercises

#### Scenario: Reference values of an exercise
- **WHEN** a user looks at exercise 13 "Zug breit" in the catalog
- **THEN** they see best value 108 %, max. weekly average weight 94 %, 3 to 8 reps per set and 18 to 48 reps per week

#### Scenario: Phone
- **WHEN** a user opens the catalog on a phone
- **THEN** all values are readable without scrolling sideways

### Requirement: Catalog API
The HTTP API SHALL return the catalog to signed-in users: the exercise groups
in order, each with its exercises and their values, with names and comments
in German and English. Requests without a session SHALL get status 401.

#### Scenario: Read the catalog
- **WHEN** a signed-in client requests the catalog
- **THEN** the response has status 200 and contains 9 groups with 45 exercises in total, each name in German and English

#### Scenario: No session
- **WHEN** a client without a session requests the catalog
- **THEN** the response has status 401 and code `UNAUTHENTICATED`
