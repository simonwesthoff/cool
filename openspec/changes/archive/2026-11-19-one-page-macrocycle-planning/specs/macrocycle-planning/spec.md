## ADDED Requirements

### Requirement: Planning steps on one page
The four planning steps SHALL be on one page. Choosing a step in the
stepper, "Continue" or "Back" SHALL switch the step without navigating to
another page and without a loading state. The page SHALL keep the current
step in its address (`?step=base-data|swot|intensity|exercises`), so a
reload or a shared link opens that step; without a macrocycle it SHALL open
step 1. The former step addresses SHALL lead to the planning page at that
step.

#### Scenario: Switch steps without loading
- **GIVEN** a coach in step 2 of an athlete with a macrocycle
- **WHEN** they choose step 3 in the stepper
- **THEN** the intensity chart is shown at once, no loading placeholder appears, the page is not reloaded, and the address ends with `?step=intensity`

#### Scenario: Reload keeps the step
- **GIVEN** a coach in step 4 of the planning
- **WHEN** they reload the page
- **THEN** step 4 is open again

#### Scenario: Step address without a macrocycle
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning with `?step=exercises`
- **THEN** step 1 is open and steps 2–4 are disabled

#### Scenario: Old step address
- **WHEN** the coach opens `/athletes/<id>/macrocycle/intensity`
- **THEN** the planning page opens at step 3

#### Scenario: Latest data in every step
- **GIVEN** a 21-week macrocycle
- **WHEN** the coach changes the duration to 24 weeks in step 1, continues and then chooses step 3
- **THEN** the chart in step 3 shows 24 weeks without reloading the page

### Requirement: Slide between planning steps
Switching planning steps SHALL slide the new step in like the week editor's
steps (about 300 ms, sliding and fading in): from the right when going to a
later step, from the left when going to an earlier one. With reduced motion
there SHALL be no animation.

#### Scenario: Forward and back
- **WHEN** the coach goes from step 2 to step 3, and then back to step 2
- **THEN** step 3 slides in from the right, and step 2 slides in from the left

#### Scenario: Reduced motion
- **GIVEN** the device asks for reduced motion
- **WHEN** the coach switches steps
- **THEN** the new step appears without sliding

## MODIFIED Requirements

### Requirement: Planning in four steps
The planning SHALL consist of four steps on one page that the coach goes
through in order and can revisit anytime: 1. base data, 2. SWOT, 3.
intensity chart with week levels, 4. exercises per mesocycle. The page
SHALL show a stepper and the title "<first name>'s macrocycle planning".
Choosing another step while the current step's form has unsaved changes
SHALL ask whether to save or discard them. After step 4 the macrocycle
SHALL be planned and the coach returns to the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, continue through the chart and choose exercises
- **THEN** the macrocycle is saved after each step, all steps are on one page, and "Finish" takes them to the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

#### Scenario: Stepper during planning
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach is in step 3
- **THEN** the stepper shows steps 1 and 2 as completed with a check mark, step 3 as current and step 4 as upcoming, joined by a line, and steps 1, 2 and 4 open their step when chosen

#### Scenario: Stepper before the macrocycle exists
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning
- **THEN** step 1 is current and steps 2–4 are shown disabled and cannot be chosen; after saving step 1 they can be chosen

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach opens the planning in any step
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
