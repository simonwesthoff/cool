# Spec Delta

## MODIFIED Requirements

### Requirement: Macrocycle base data
Step 1 (base data) SHALL have two sections. "Historical data": personal
bests in snatch and clean & jerk (kg), current body weight (kg), body fat
and muscle mass (%, optional). "New macrocycle plan": start date (a
Monday), duration (7–52 weeks), date and type of the main competition,
entry value (30–95 %, default 60 %), goals in snatch and clean & jerk (kg),
target body weight (kg) and the weekly schedule. All except body fat and
muscle mass SHALL be required. A duration that would remove weeks with a
week plan SHALL be refused.

#### Scenario: Required values missing
- **WHEN** the coach saves the base data without a snatch goal
- **THEN** the macrocycle is not saved and the form shows that the snatch goal is required

#### Scenario: Optional values
- **WHEN** the coach saves the base data without body fat and muscle mass
- **THEN** the macrocycle is saved

#### Scenario: Start date not a Monday
- **WHEN** the coach enters a Wednesday as start date
- **THEN** the form shows that the macrocycle starts on a Monday

#### Scenario: Default entry value
- **WHEN** the coach opens the base data form of a new macrocycle
- **THEN** the entry value is 60 %

#### Scenario: Shortening below planned weeks
- **GIVEN** a 21-week macrocycle with a week plan for week 20
- **WHEN** the coach changes the duration to 18 weeks
- **THEN** the change is refused and the duration field says that weeks with a week plan would be removed

## ADDED Requirements

### Requirement: Weekly schedule
Instead of a number of sessions per week, the base data SHALL show a week
(Monday–Sunday) in which the coach picks up to three training sessions per
day, at least 1 and at most 14 per week. The training frequency SHALL be
the number of picked sessions. New week plans SHALL start with these
sessions. Changing the schedule SHALL not change existing week plans.

#### Scenario: Pick sessions
- **WHEN** the coach picks two sessions on Monday and one each on Wednesday and Friday and saves
- **THEN** the macrocycle has the weekly schedule Monday 1, Monday 2, Wednesday, Friday and a training frequency of 4

#### Scenario: No session picked
- **WHEN** the coach saves the base data without any session in the week
- **THEN** the form shows that at least one training session is required

#### Scenario: Fourth session on a day
- **GIVEN** three sessions on Tuesday
- **THEN** no further session can be added to Tuesday
