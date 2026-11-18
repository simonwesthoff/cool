# Spec Delta

## MODIFIED Requirements

### Requirement: Training week entry points
The athlete page SHALL have a "Training week" section below the macrocycle
with the current week (see the week view). For whoever leads the athlete's
Team (the coach, and a coach who trains themselves on "My training") it
SHALL offer "Edit week" for a planned current week or "Plan this week" for
an unplanned one, and "Plan next week" or "Edit next week". There SHALL be
no list of planned weeks. Without a macrocycle there SHALL be no section.

#### Scenario: Coach with planned weeks
- **GIVEN** an athlete whose current week 6 has a week plan and week 7 has none
- **WHEN** the coach opens the athlete page
- **THEN** the section shows week 6 with "Edit week" and "Plan next week", and no list of planned weeks

#### Scenario: Linked athlete
- **WHEN** a linked athlete of another coach's Team opens "My training"
- **THEN** the section shows the current week without "Edit week", "Plan this week" or "Plan next week"

#### Scenario: Unplanned current week
- **GIVEN** the current week has no week plan
- **WHEN** the coach opens the athlete page
- **THEN** the section offers "Plan this week"
