## 1. Stepper and title

- [x] 1.1 Add `firstName(name)` with unit tests (single word, two words, extra spaces).
- [x] 1.2 Rebuild `StepIndicator` as a stepper:
  - **Look:** circles, connector line and labels below.
  - **States:** completed (check), current (filled, `aria-current="step"`) and upcoming.
  - **Navigation:** disabled steps 2–4 without a macrocycle.

  Verify with component tests for the states, the links, the disabled steps and the German labels.
- [x] 1.3 `PlanningHeader`: title "{first name}'s macrocycle planning" / "Makrozyklusplanung für {first name}", without the name line. Verify with the planning header test and the message completeness test.
- [x] 1.4 Browser check of all four steps, with and without a macrocycle, at phone and desktop width in light and dark mode; review the screenshots.
