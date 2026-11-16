# Spec Delta

## ADDED Requirements

### Requirement: Addressed points of an exercise
Each exercise of the catalog SHALL have an ordered list of the points it
addresses (e.g. "Beschleunigung im 2. Zug", "Hoher Zug" for 7 Standreißen),
taken from the catalog source, in German and English; the list MAY be
empty. Points with the same name are the same point across exercises. The
exercise details SHALL show them.

#### Scenario: Power snatch
- **WHEN** a user opens exercise 7 in the catalog
- **THEN** the details show that it addresses "Acceleration in the second pull" and "High pull" (in English)

#### Scenario: Exercise without addressed points
- **WHEN** a user opens exercise 33
- **THEN** the details show that no addressed points are defined
