# Proposal

## Why

The macrocycle is the frame of all training planning towards a main
competition: it fixes the athlete's starting point and goals, how the load
develops week by week, the three mesocycles and the exercises used in each.
Weekly plans (features 9 and 10) and the athlete details (feature 5) build
on it. This change implements feature 8 of `feature_list.txt`, the
macrocycle planning, together with the calculation of the planned values,
as described by the user on 2026-11-16.

## What Changes

- **Macrocycle base data** (entered in step 1 of the planning): current
  personal bests and goals in snatch and clean & jerk, current and target
  body weight, optional body fat and muscle mass, free texts for current
  deficits and for injuries and illnesses, start date and duration in
  weeks, date and type of the main competition, and the entry value (% of
  the max values the cycle starts with; usually 60 %).
- **Mesocycles** by default: general preparation block = first 15 % of the
  weeks (floored), special preparation block = next 50 % (floored),
  competition preparation block = the remaining weeks.
- **Planned values per week** (calculated, not stored), following the
  user's modified sine curve over the cycle progress t = (k−1)/(N−1) of
  week k of N:
  - intensity (progress) = ((1−E)/2)·sin(t·π − π/2) + E + (1−E)/2 for entry
    value E, ±5 percentage points in high/low weeks;
  - per exercise: best value = intensity × exercise best value × goal of its
    reference lift; average weight (mHG) the same with the exercise's max.
    weekly average weight;
  - per exercise: set size and weekly reps from the exercise's maximum down
    to its minimum along the same curve shape; weekly reps (not set size)
    higher in high weeks and lower in low weeks;
  - volume = sum of the weekly reps of the exercises chosen for the week's
    mesocycle.
- **Planning flow for coaches** in three steps:
  1. base data form;
  2. macrocycle chart: intensity per week with a handle each that can be
     moved up or down by 5 %: up = high week, unchanged = medium, down =
     low; weeks coloured by mesocycle; volume shown once exercises are
     chosen;
  3. exercise selection per mesocycle from the exercise catalog.
  After step 3 the macrocycle is planned. All steps can be revisited.
- **Entry point**: the athlete details page gets a macrocycle section for
  coaches: "Plan macrocycle" before one exists, otherwise a link to change
  the planning. (The chart section of feature 5 and the macrocycle view of
  feature 7 come later.)
- HTTP API for creating and changing the macrocycle, its week levels and
  the exercises per mesocycle, and for reading it with all calculated
  values. All new texts in English and German.

### Assumptions (to confirm in review)

- High/low changes weekly reps by ±5 % of the value (×1.05 / ×0.95).
- Weights are rounded to 0.5 kg, repetitions to whole numbers; percentages
  are shown with one decimal.
- The start date is a Monday (weeks are calendar weeks); duration 7 to 52
  weeks (each mesocycle has at least one week).
- One macrocycle per athlete for now; a new cycle after the competition is
  a later change.
- Mesocycle borders use the default split and are not adjustable yet.
- Competition type is a free text (e.g. "German Championships").
- Exercises without reference values (K8, K9) can be chosen but get no
  calculated weights or reps.

### Out of scope

- The macrocycle view (feature 7) and the athlete details sections
  (feature 5).
- Weekly plans and training sessions (features 9 and 10).
- Adjusting mesocycle borders, taper and transition blocks, several
  macrocycles per athlete.
- Athletes seeing their macrocycle.
- Per-athlete adjustments of catalog values.

### New domain terms

- **Entry value** (Einstiegswert): % of the max values a macrocycle starts
  with.
- **Intensity** (Intensität): planned % of the max values for a week.
- **Week level** (Wochenintensität: hoch / mittel / niedrig): high, medium
  or low week.
- **Set size** (Satzgröße): repetitions per set.
- **Weekly reps** (Wochenwiederholungen): repetitions of an exercise per
  week.
- **Volume** (Umfang): sum of the weekly reps of a week's exercises.
- **Personal best** (Bestleistung) and **Goal** (Zielleistung) in snatch and
  clean & jerk; **Main competition** (Hauptwettkampf).

## Capabilities

### New Capabilities

- `macrocycle-planning`: The macrocycle's base data, mesocycles, week
  levels, exercise selection per mesocycle, the three-step planning flow
  and its API.
- `macrocycle-calculation`: How intensity, best value, average weight, set
  size, weekly reps and volume are calculated per week.

### Modified Capabilities

- `athlete-details`: The details page gets the macrocycle entry point for
  coaches.

## Impact

- New tables for macrocycles, weeks, mesocycles and mesocycle exercises
  with a migration.
- New domain modules `src/domain/macrocycles` (data and rules) and a pure
  calculation module; new API routes; three planning pages; a chart
  component without a new dependency.
- Glossary terms; domain model: Macrocycle, Mesocycle, Macrocycle week and
  their relations to Athlete and Exercise.
