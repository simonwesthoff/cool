## ADDED Requirements

### Requirement: Automatic saving of base data and SWOT
Steps 1 and 2 SHALL save shortly (about 0.6 s) after the last change and
show "Saving…", "Saved" or "Could not save." next to their buttons.
Invalid fields SHALL be marked and not saved; the other fields are. A new
macrocycle SHALL be created as soon as all required base data are valid;
until then nothing is stored and "Continue to SWOT" marks the missing or
invalid fields.

#### Scenario: Change a goal
- **GIVEN** a planned macrocycle
- **WHEN** the coach changes the snatch goal in step 1 and waits a moment
- **THEN** "Saved" appears and the new goal is stored, without pressing a button

#### Scenario: One invalid field
- **GIVEN** a planned macrocycle
- **WHEN** the coach enters a body weight of 500 kg and changes the snatch goal
- **THEN** the body weight is marked as out of range and not stored, and the snatch goal is stored

#### Scenario: New macrocycle
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach fills in the base data, the last required field last
- **THEN** the macrocycle is created once that field is valid, and steps 2–5 become available

#### Scenario: Continue too early
- **GIVEN** an athlete without a macrocycle and an incomplete step 1
- **WHEN** the coach chooses "Continue to SWOT"
- **THEN** step 1 stays open and the missing fields are marked as required

## MODIFIED Requirements

### Requirement: SWOT
Step 2 (SWOT) SHALL contain, in this order: strengths, the deficits,
weightlifting experience, focus points, and injuries and illnesses, all
required. The macrocycle SHALL be created in step 1 without them. Each
SWOT field SHALL be saved on its own as it is changed; the required check
SHALL happen when continuing.

#### Scenario: SWOT after the base data
- **GIVEN** a new macrocycle saved in step 1
- **WHEN** the coach fills in the SWOT step and chooses "Continue to curve"
- **THEN** the macrocycle has these values and the coach continues to the curve step

#### Scenario: SWOT values missing
- **WHEN** the coach chooses "Continue to curve" without strengths
- **THEN** step 2 stays open and shows that the strengths are required; the fields already entered stay saved

### Requirement: Planning in five steps
The planning SHALL consist of five steps on one page that the coach goes
through in order and can revisit anytime: 1. base data, 2. SWOT, 3.
progression curve ("Curve"), 4. high and low weeks and block borders
("Weeks"), 5. exercises per mesocycle. The page SHALL show a stepper and
the title "<first name>'s macrocycle planning". Choosing another step
SHALL never ask about unsaved changes. After step 5 the coach returns to
the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, shape the curve, set the weeks and choose exercises
- **THEN** every change is saved as it is made, all steps are on one page, and "Finish planning" takes them to the athlete's details page

#### Scenario: Change the duration later
- **GIVEN** a planned macrocycle of 21 weeks with high and low weeks and chosen exercises
- **WHEN** the coach changes the duration to 24 weeks in step 1
- **THEN** the mesocycle lengths keep their proportions (each at least one week), the levels of weeks 1–21 stay, weeks 22–24 are medium, and the chosen exercises of each mesocycle stay

#### Scenario: Stepper during planning
- **GIVEN** an athlete with a macrocycle
- **WHEN** the coach is in step 4
- **THEN** the stepper shows steps 1–3 as completed with a check mark, step 4 "Weeks" as current and step 5 as upcoming, and the other steps open when chosen

#### Scenario: Stepper before the macrocycle exists
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning
- **THEN** step 1 is current and steps 2–5 are disabled; once the macrocycle is created they can be chosen

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach opens the planning in any step
- **THEN** the page title is "Anna's macrocycle planning" ("Makrozyklusplanung für Anna" in German)

#### Scenario: Unsaved changes when changing the step
- **GIVEN** the coach changed the strengths in step 2 a moment ago
- **WHEN** they choose step 1 in the stepper
- **THEN** no dialog appears, step 1 opens, and the new strengths are stored

#### Scenario: Saving fails in the dialog
- **GIVEN** an invalid value in step 1
- **WHEN** the coach chooses another step
- **THEN** no dialog appears, the step changes, and the invalid value is not stored

#### Scenario: No unsaved changes
- **WHEN** the coach chooses another step without changing anything
- **THEN** the step opens without a dialog
