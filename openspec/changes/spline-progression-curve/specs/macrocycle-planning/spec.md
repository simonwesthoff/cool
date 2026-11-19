## ADDED Requirements

### Requirement: Planning in five steps
The planning SHALL consist of five steps on one page that the coach goes
through in order and can revisit anytime: 1. base data, 2. SWOT, 3.
progression curve ("Curve"), 4. high and low weeks and block borders
("Weeks"), 5. exercises per mesocycle. The page SHALL show a stepper and
the title "<first name>'s macrocycle planning". Choosing another step
with unsaved form changes SHALL ask whether to save or discard them.
After step 5 the coach returns to the athlete's details page.

#### Scenario: Complete planning
- **GIVEN** a coach on the athlete's details page of an athlete without a macrocycle
- **WHEN** they choose "Plan macrocycle", fill in the base data and the SWOT, shape the curve, set the weeks and choose exercises
- **THEN** the macrocycle is saved after each step, all steps are on one page, and "Finish" takes them to the athlete's details page

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
- **THEN** step 1 is current and steps 2–5 are disabled; after saving step 1 they can be chosen

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach opens the planning in any step
- **THEN** the page title is "Anna's macrocycle planning" ("Makrozyklusplanung für Anna" in German)

#### Scenario: Unsaved changes when changing the step
- **GIVEN** the coach changed the strengths in step 2 without saving
- **WHEN** they choose step 1 in the stepper
- **THEN** a dialog asks "Save changes?" with "Save", "Discard" and "Cancel" in this order

#### Scenario: Saving fails in the dialog
- **GIVEN** the dialog after changing step 2
- **WHEN** the coach chooses "Save" and the input is invalid
- **THEN** step 2 stays open and shows the marked fields

#### Scenario: No unsaved changes
- **WHEN** the coach chooses another step without changing anything
- **THEN** the step opens without a dialog

### Requirement: Curve and weeks steps
Step 3 ("Curve", "Kurve") SHALL show the progression curve with its
anchors and no week handles or block sliders; step 4 ("Weeks", "Wochen")
SHALL show the week handles and block sliders on the current curve. Both
SHALL show the intensity from 0 to 110 % and have their own help text.
Step 3 continues to step 4 ("Continue to weeks") and back to the SWOT;
step 4 continues to the exercises and back to the curve.

#### Scenario: Opening step 3
- **WHEN** the coach opens step 3
- **THEN** the anchors are shown on a 0–110 % scale, and there are no week handles and no block sliders

#### Scenario: On to the weeks
- **WHEN** the coach chooses "Continue to weeks"
- **THEN** step 4 shows the week handles and block sliders on the same curve, also on a 0–110 % scale

### Requirement: Dip warning
When the progression curve falls anywhere, step 3 SHALL show a red warning
below the chart: "The curve shouldn't dip. You can set high and low weeks
in the next step." ("Die Kurve sollte nicht absinken. Hohe und niedrige
Wochen legst du im nächsten Schritt fest."). A curve that only rises or
stays level SHALL show no warning.

#### Scenario: Dipping curve
- **GIVEN** inner anchors at position 0.5 with 98 % and at 0.7 with 80 %
- **WHEN** the coach looks at step 3
- **THEN** the red warning is shown below the chart

#### Scenario: Rising curve
- **WHEN** the curve rises from the entry value to the end value
- **THEN** no warning is shown

### Requirement: Editing anchors
In step 3 a click on the chart outside an anchor SHALL add an anchor.
Inner anchors SHALL drag smoothly in all directions; a click on one, or
dropping it horizontally close to a neighbour, SHALL remove it. The entry
and end anchors SHALL move to whole weeks only; the entry value in whole
percent (30–95 %), the end value always above it. While either is moved,
its value SHALL be shown beside it. Neither can be removed. Changes SHALL
be saved on release.

#### Scenario: Add an anchor
- **GIVEN** a new 21-week macrocycle with entry value 60 %
- **WHEN** the coach clicks the chart at week 6 at 90 %
- **THEN** an anchor appears there, the curve runs smoothly through it, and it is saved

#### Scenario: Drag without snapping
- **WHEN** the coach drags an inner anchor from week 6 to between weeks 8 and 9
- **THEN** the anchor follows the pointer continuously and stays between weeks 8 and 9 after release (only the entry and end anchors snap to weeks)

#### Scenario: Remove by click or edge
- **WHEN** the coach clicks an inner anchor, or drops it right next to a neighbouring anchor (horizontally)
- **THEN** the anchor is removed and the curve is recalculated without it; dropped elsewhere, also at the chart's edge, it only moves

#### Scenario: Entry anchor sets the entry value
- **WHEN** the coach drags the entry anchor from 60 % up to 65.4 % and to between weeks 2 and 3
- **THEN** it snaps to week 3 and 65 %, "Entry value 65 %" is shown beside it while moving, the entry value is 65 %, also in step 1, weeks 1–3 have 65 %, and clicking it removes nothing

#### Scenario: End anchor fixed
- **WHEN** the coach drags the end anchor from 100 % in week 21 to 95 % in week 18, and then below the entry value of 60 %
- **THEN** "End value 95 %" is shown beside it while moving and weeks 18–21 have 95 %; it stops at 61 % above the entry value, and clicking it removes nothing

#### Scenario: Saving fails
- **WHEN** saving an anchor change fails
- **THEN** the curve returns to its stored shape and the step says the change could not be saved

### Requirement: Curve API
The HTTP API SHALL let the coach set a macrocycle's curve (`PUT
…/macrocycle/curve`: entry and end value and position, inner anchors) and
return the macrocycle with all recalculated weeks. Positions SHALL be 0–1
and in order (entry, inner, end), values 0–100 % with one decimal, the
entry value 30–95 %, the end value above the entry value, at most 20
inner anchors; otherwise 400 `VALIDATION_FAILED`. Only the coach SHALL
change it.

#### Scenario: Set the curve
- **WHEN** the coach puts entry value 60 % and one anchor at position 0.25 with 90 %
- **THEN** the response has status 200 and week 6 of 21 has intensity 90 %

#### Scenario: Invalid anchor
- **WHEN** the coach puts an anchor at position 1 or with 120 %
- **THEN** the response has status 400 `VALIDATION_FAILED` and nothing changes

#### Scenario: End below the entry
- **WHEN** the coach puts entry value 60 % and end value 60 %
- **THEN** the response has status 400 `VALIDATION_FAILED` with `endValuePct: NOT_ABOVE_ENTRY`

#### Scenario: Not the coach
- **WHEN** the linked athlete puts a curve
- **THEN** the response has status 403 or 404 as for the other planning changes, and nothing changes

## MODIFIED Requirements

### Requirement: Intensity chart with week handles
Step 4 ("Weeks") SHALL show the week chart fitting the screen width with
the y-axis ("Intensity", 0–110 %), weeks on the x-axis ("Week"), each
week's number and point on the line where its block starts, the intensity
as the curve, one pink handle per week, ▲/▼ above or below high and low
weeks, and a slider on each block border. Each handle SHALL move one 5 %
step up (high week) or down (low week) by dragging or tapping.

#### Scenario: Make a week high
- **GIVEN** week 11 at 80 % intensity in step 4
- **WHEN** the coach drags its handle up
- **THEN** the handle snaps to 85 %, the week is marked high, and the change is saved

#### Scenario: Back to medium
- **GIVEN** a high week
- **WHEN** the coach drags its handle down by one step
- **THEN** the week is medium again

#### Scenario: No more than one step
- **GIVEN** a high week
- **WHEN** the coach tries to drag its handle further up
- **THEN** it stays at one step above the curve

#### Scenario: Whole cycle on a phone
- **GIVEN** a 52-week macrocycle
- **WHEN** the coach opens step 4 on a phone
- **THEN** all 52 weeks are visible without scrolling sideways

#### Scenario: No volume in the planning chart
- **GIVEN** exercises are chosen for the mesocycles
- **WHEN** the coach looks at the chart in step 4
- **THEN** the chart and its tooltips show the intensity only, no volume

#### Scenario: Mesocycle colours
- **WHEN** the coach looks at the chart of a 21-week macrocycle
- **THEN** no area is coloured by mesocycle, and thin lines at weeks 1, 4 and 14 are labelled GPB, SPB and CPB

#### Scenario: Points at the start of a week
- **GIVEN** the special preparation block starts in week 4
- **WHEN** the coach looks at the chart in step 4
- **THEN** the point and the number of week 4 are exactly on the line where the special preparation block begins

### Requirement: Adjustable mesocycle borders
In step 4, the coach SHALL be able to move the two borders between the
mesocycles left and right by whole weeks by dragging a handle on each
border. Each mesocycle SHALL keep at least one week.
Every change SHALL be saved.

#### Scenario: Longer general preparation
- **GIVEN** a 21-week macrocycle with the default blocks 1–3, 4–13 and 14–21
- **WHEN** the coach drags the first border two weeks to the right
- **THEN** the blocks are 1–5, 6–13 and 14–21, and the weeks' mesocycles and calculated values follow

#### Scenario: At least one week
- **WHEN** the coach drags the second border onto the first one
- **THEN** it stops one week after the first border

### Requirement: Exercises per mesocycle
Step 5 SHALL show one table of the exercise catalog, grouped by exercise
group, with one row per exercise and one column per mesocycle (GLP, ABP,
LAP). In each cell the coach SHALL be able to choose the exercise for that
mesocycle with a reason and an optional variation (free text, the catalog
comment as a hint), change both later, or remove the choice. The same
exercise MAY be chosen for several mesocycles. The variation SHALL NOT
change the calculated values.

#### Scenario: Choose exercises
- **WHEN** the coach chooses exercises 1, 13 and 19 in the special preparation column, each with a reason
- **THEN** these three exercises belong to that mesocycle with their reasons

#### Scenario: Variation and note
- **WHEN** the coach chooses exercise 1 for the general preparation block with the variation "No feet snatch" and the own reason "Footwork in the turnover"
- **THEN** the cell shows the variation, and the choice keeps the variation and the reason

#### Scenario: No variation
- **WHEN** the coach chooses an exercise without a variation
- **THEN** its cell shows only the check mark, no text

#### Scenario: Prefill from another block
- **GIVEN** exercise 7 chosen for the general preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks"
- **WHEN** the coach taps "+" for exercise 7 in the special preparation column
- **THEN** no dialog opens; exercise 7 is chosen and saved for the special preparation block with the tag "Hoher Zug", the own reason "Technique" and the variation "From blocks", and its cell shows the check mark and "From blocks"

#### Scenario: Remove an exercise
- **GIVEN** exercise 13 chosen for a mesocycle
- **WHEN** the coach removes it in its cell
- **THEN** it no longer belongs to that mesocycle

### Requirement: Exercise table summary
Above the exercise table, step 5 SHALL show all of the athlete's deficits
(snatch, clean, jerk and other) instead of an explanation text. Below the
table, a total row SHALL show the number of chosen exercises per mesocycle.

#### Scenario: Deficits above the table
- **WHEN** the coach opens step 5
- **THEN** the snatch, clean, jerk and other deficits are shown above the table

#### Scenario: Totals
- **GIVEN** exercises 1, 7 and 13 chosen for the special preparation block and none for the others
- **WHEN** the coach looks at the end of the table
- **THEN** the total row shows 0, 3 and 0, and it changes as soon as an exercise is chosen or removed

### Requirement: One week chart
The intensity chart of the planning, the exercise chart of the macrocycle
view and the chart on the athlete page SHALL be one chart element in the
same minimal style (one smoothed curve, its colour fading downwards below it, a thin line at each block start, week numbers). The
intensity chart's curve SHALL be magenta #ba2db3. Parameters SHALL set the curve's colours and switch its parts on or off: the y-axis, axis titles, a
visible legend, the current-week line, the week handles and the sliders.

#### Scenario: Same look in planning and view
- **WHEN** the coach compares the chart in steps 3 and 4 with the chart in the macrocycle view
- **THEN** both show a smoothed curve with a gradient and block start lines; the planning curve is magenta and only steps 3 and 4 show the y-axis, the handles and the sliders

### Requirement: No visible legend in the planning chart
The planning chart in steps 3 and 4 SHALL show no legend on screen; its legend
(mesocycles, high and low weeks, main competition) SHALL stay available to
screen readers, as in the exercise chart.

#### Scenario: Step 3 without a legend
- **WHEN** the coach opens step 3 or 4
- **THEN** no legend is shown above the chart, and screen readers still find the legend with the three block names, "High / low week" and "Main competition"

### Requirement: Planning steps on one page
The four planning steps SHALL be on one page. Choosing a step in the
stepper, "Continue" or "Back" SHALL switch the step without navigating to
another page and without a loading state. The page SHALL keep the current
step in its address (`?step=base-data|swot|curve|intensity|exercises`), so a
reload or a shared link opens that step; without a macrocycle it SHALL open
step 1. The former step addresses SHALL lead to the planning page at that
step.

#### Scenario: Switch steps without loading
- **GIVEN** a coach in step 2 of an athlete with a macrocycle
- **WHEN** they choose step 3 in the stepper
- **THEN** the curve chart is shown at once, no loading placeholder appears, the page is not reloaded, and the address ends with `?step=curve`

#### Scenario: Reload keeps the step
- **GIVEN** a coach in step 4 of the planning
- **WHEN** they reload the page
- **THEN** step 4 is open again

#### Scenario: Step address without a macrocycle
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the planning with `?step=exercises`
- **THEN** step 1 is open and steps 2–5 are disabled

#### Scenario: Old step address
- **WHEN** the coach opens `/athletes/<id>/macrocycle/intensity`
- **THEN** the planning page opens at step 4 ("Weeks")

#### Scenario: Latest data in every step
- **GIVEN** a 21-week macrocycle
- **WHEN** the coach changes the duration to 24 weeks in step 1, continues and then chooses step 4
- **THEN** the chart in step 4 shows 24 weeks without reloading the page

## REMOVED Requirements

### Requirement: Planning in four steps
**Reason**: The progression curve and the high/low weeks are separate steps now, so the planning has five steps.
**Migration**: See "Planning in five steps".
