# Spec Delta

## MODIFIED Requirements

### Requirement: Macrocycle entry point
The macrocycle section of the athlete details page SHALL be the same as on
the athlete's "My training" page: the macrocycle view's exercise chart
(snatch, best value, with the mesocycle start lines, main competition
and current week), and below it, aligned to the right, an "Open macrocycle" button that
opens the macrocycle view. Changing the planning is offered in the
macrocycle view. Without a macrocycle the coach SHALL get a "Plan
macrocycle" card instead.

#### Scenario: No macrocycle yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the athlete's details page
- **THEN** they see "Plan macrocycle", which opens step 1 of the planning

#### Scenario: Planned macrocycle
- **GIVEN** an athlete with a macrocycle from 2026-11-30 for 21 weeks towards the "German Championships" on 2027-04-24
- **WHEN** the coach opens the athlete's details page
- **THEN** they see the chart of the snatch's best value with 80 kg in week 11, and below it on the right the "Open macrocycle" button

#### Scenario: Open the macrocycle view
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach chooses "Open macrocycle" on the athlete's details page
- **THEN** the macrocycle view opens, which offers "Change planning"

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
