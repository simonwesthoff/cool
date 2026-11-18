# Spec Delta

## ADDED Requirements

### Requirement: Training week entry points
The athlete page SHALL have a "Training week" section below the macrocycle
for whoever leads the athlete's Team (the coach on the athlete details
page, and a coach who trains themselves on "My training"). It SHALL offer
"Plan next week" or "Edit next week", "Plan this week" for an unplanned
current week, and the planned weeks with their week number, dates and an
edit button. Without a macrocycle there SHALL be no such section. Athletes
who may not plan SHALL not see it.

#### Scenario: Coach with planned weeks
- **GIVEN** an athlete whose macrocycle has week plans for weeks 5 and 6, and week 6 is the current week
- **WHEN** the coach opens the athlete page
- **THEN** the "Training week" section shows weeks 5 and 6 with their dates and an edit button each, and "Plan next week"

#### Scenario: Linked athlete
- **WHEN** a linked athlete of another coach's Team opens "My training"
- **THEN** there is no "Training week" section

#### Scenario: Unplanned current week
- **GIVEN** the current week has no week plan
- **WHEN** the coach opens the athlete page
- **THEN** the section offers "Plan this week"
