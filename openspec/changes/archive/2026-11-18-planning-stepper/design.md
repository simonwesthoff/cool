## Context

`StepIndicator` renders the four steps as pill links; `PlanningHeader`
shows the athlete's name above "Macrocycle planning". Both are used on all
four planning pages.

## Goals / Non-Goals

**Goals:** a stepper that shows order and progress, works on phones and
keeps the existing navigation rules; the first name in the title.

**Non-Goals:** tracking whether a step's data is complete; changing the
back link or the steps' content.

## Decisions

- **Progress:** steps before the current one count as completed (check
  mark), because the steps are filled in order and saved on "Continue".
  There is no extra completion state in the data. Alternative (completion
  from stored data) rejected: SWOT and exercises have no clear "done" flag.
- **Look:** 32 px circles in the black/white style. Current is filled
  (zinc-900 / zinc-100), completed is outlined with a check, upcoming is
  outlined with its number. A 2 px connector line runs between the
  circles, solid up to the current step and lighter after it. Labels sit
  below the circles in an `ol` with four equal columns, so it fits 390 px
  ("Stammdaten", "Intensität" included).
- **Accessibility:** `nav` + `ol`; the current step has `aria-current="step"`;
  completed steps carry a screen-reader text "completed"; disabled steps
  are not links.
- **First name:** the first whitespace-separated word of the athlete's name
  (`firstName("Anna Weber") = "Anna"`), a small pure helper. German uses
  "Makrozyklusplanung für {name}" to avoid possessive rules (Max' / Annas).

- **Unsaved changes:** a small context in the macrocycle layout. The form
  of steps 1 and 2 registers a guard (whether its values differ from the
  stored snapshot, and how to save). The stepper asks the guard before
  following a link and opens a native `<dialog>`. Unregistering only
  removes the own guard, because Next keeps the previous page mounted but
  hidden and may clean it up after the next page registered. Only stepper
  links are guarded; the back link, the tabs and closing the tab are not
  part of this request.
- **Stacking:** connector line `z-[1]` above the hover highlight, circles
  `z-[2]` above the line, the user menu `z-30` above page content.

## Risks / Trade-offs

- [A step reached directly by URL shows earlier steps as completed even if
  they were skipped] → Acceptable: earlier steps are always saved before
  later ones become reachable (they need an existing macrocycle).
