## 1. Stepper and title

- [x] 1.1 Add `firstName(name)` with unit tests (single word, two words, extra spaces).
- [x] 1.2 Rebuild `StepIndicator` as a stepper:
  - **Look:** circles, connector line and labels below.
  - **States:** completed (check), current (filled, `aria-current="step"`) and upcoming.
  - **Navigation:** disabled steps 2–4 without a macrocycle.

  Verify with component tests for the states, the links, the disabled steps and the German labels.
- [x] 1.3 `PlanningHeader`: title "{first name}'s macrocycle planning" / "Makrozyklusplanung für {first name}", without the name line. Verify with the planning header test and the message completeness test.
- [x] 1.4 Browser check of all four steps, with and without a macrocycle, at phone and desktop width in light and dark mode; review the screenshots.

## 2. Acceptance feedback

- [x] 2.1 Unsaved-changes dialog on step changes (save, discard, cancel; failed save keeps the step with the errors). Verify with component tests (all three choices, failed save, no dialog without changes, German) and a registry test for the hidden previous page.
- [x] 2.2 Hover highlight behind the connector line; circles above the line, user menu above the stepper. Language switch not stretched to the menu width; one shared `firstName` helper. Verify with a browser check (hover, dialog flow with save and discard, menu width) and screenshots.
- [x] 2.3 Dialog buttons in one row of three equal widths, in the order Save, Discard, Cancel. User menu with a fixed width: name and truncated email, "Language" label with a full-width switch, full-width sign-out, separated by lines. Verify with screenshots (German phone dark, English desktop light) and button widths without overflow.
- [x] 2.4 "Change planning" by permission on both entry points: `canPlanMacrocycle` in the domain, used by the view loader. Verify with PGlite tests (coach, linked athlete with and without own Team, stranger, coach who trains themselves), loader and page tests, and a server check of both entry points for a self-coached coach and an athlete.
- [x] 2.5 "My training" by permission: `isCoachOfAthlete` decides the edit icon and "Plan macrocycle" (`canEdit`). Macrocycle view title "{first name}'s macrocycle". Verify with PGlite, component and page tests, and screenshots for a coach who trains themselves.

