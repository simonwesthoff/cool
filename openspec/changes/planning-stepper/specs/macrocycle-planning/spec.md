# Spec Delta

## MODIFIED Requirements

### Requirement: Planning in four steps
The planning SHALL consist of four steps the coach goes through in order
and can revisit at any time: 1. base data, 2. SWOT, 3. intensity chart with
week levels, 4. exercises per mesocycle. Every step SHALL show a stepper
and the title "<first name>'s macrocycle planning". Choosing another step
while the current step's form has unsaved changes SHALL ask whether to
save or discard them. After step 4 the
macrocycle SHALL be planned and the coach returns to the athlete's details
page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, continue through the chart and choose exercises
- **THEN** the macrocycle is saved after each step and they end on the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

#### Scenario: Stepper during planning
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach opens step 3
- **THEN** the stepper shows steps 1 and 2 as completed with a check mark, step 3 as current and step 4 as upcoming, joined by a line, and steps 1, 2 and 4 open their step when chosen

#### Scenario: Stepper before the macrocycle exists
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens step 1
- **THEN** step 1 is current and steps 2–4 are shown disabled and cannot be chosen

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach opens any planning step
- **THEN** the page title is "Anna's macrocycle planning" ("Makrozyklusplanung für Anna" in German), and there is no separate name line above it

#### Scenario: Unsaved changes when changing the step
- **GIVEN** the coach changed the strengths in step 2 without saving
- **WHEN** they choose step 1 in the stepper
- **THEN** a dialog asks "Save changes?" with "Save", "Discard" and "Cancel" in this order; "Save" stores the SWOT and opens step 1, "Discard" opens step 1 without storing, "Cancel" keeps step 2 with the changes

#### Scenario: Saving fails in the dialog
- **GIVEN** the dialog after changing step 2
- **WHEN** the coach chooses "Save" and the input is invalid
- **THEN** step 2 stays open and shows the marked fields

#### Scenario: No unsaved changes
- **WHEN** the coach chooses another step without changing anything
- **THEN** the step opens without a dialog
