# Domain model

How the domain entities relate to each other, at a conceptual level.
Training terms are defined in [glossary.md](glossary.md); app and role
terms use their English names. Technical details (tables,
keys, columns) belong in each change's `design.md` and in the code.

## How this file is maintained

- A change that adds or changes entities or relations describes them in a
  "Domain model changes" section of its `design.md`. That is where they are
  reviewed.
- When the change is implemented, those changes are applied here. This file
  therefore shows only what is built.

## Current model

```mermaid
erDiagram
    UserAccount ||--o| Team : "leads as coach"
    Team ||--o{ Athlete : "has"
    UserAccount |o--o| Athlete : "is linked to"
    Athlete ||--o{ Invitation : "is invited via"
    UserAccount {
        string name
        string email
        string picture
    }
    Athlete {
        string name
        date dateOfBirth
        string gender
        date careerStartDate
        int heightCm
    }
    Invitation {
        datetime expiresAt
        datetime acceptedAt
        datetime revokedAt
    }
    ExerciseGroup ||--o{ Exercise : "contains"
    Exercise }o--o{ ExerciseTag : "addresses"
    Athlete ||--o| Macrocycle : "is planned in"
    Macrocycle ||--|{ MacrocycleWeek : "consists of"
    Macrocycle ||--|{ Mesocycle : "is divided into"
    Mesocycle ||--o{ MesocycleExercise : "uses"
    MesocycleExercise }o--|| Exercise : "is"
    Macrocycle ||--|{ ScheduledSession : "has weekly schedule"
    MacrocycleWeek ||--o| WeekPlan : "is planned in"
    WeekPlan ||--o{ TrainingSession : "has"
    TrainingSession ||--o{ SessionExercise : "contains"
    SessionExercise }o--|| Exercise : "is"
    SessionExercise ||--o{ SetGroup : "is done in"
    Macrocycle {
        date startDate
        int durationWeeks
        decimal entryValuePct
        decimal snatchGoalKg
        decimal cleanAndJerkGoalKg
        date competitionDate
        string strengths
        string snatchDeficits
        string cleanDeficits
        string jerkDeficits
        string otherDeficits
        string experience
        string[] focusPoints
    }
    MacrocycleWeek {
        int weekNumber
        string level
    }
    Mesocycle {
        string type
        int firstWeek
        int lastWeek
    }
    MesocycleExercise {
        string variation
        string[] tags
        string[] ownReasons
    }
    ExerciseTag {
        string name
    }
    ScheduledSession {
        int weekday
        int slot
    }
    WeekPlan {
        int weekNumber
    }
    TrainingSession {
        int weekday
        int slot
    }
    SessionExercise {
        int position
        string coachNote
        string freeText
        string feedback
    }
    SetGroup {
        int position
        int sets
        int reps
        decimal weightKg
    }
    Exercise {
        int number
        string name
        string referenceLift
        string[] liftCategories
        decimal bestValuePct
        decimal maxWeeklyAverageWeightPct
        int minRepsPerSet
        int maxRepsPerSet
        int minRepsPerWeek
        int maxRepsPerWeek
    }
```

- The exercise catalog consists of exercise groups (K1–K9), each with its
  exercises. Exercises are identified by their catalog number. The catalog
  is shared by all Teams and read-only (each exercise has its lift
  categories: snatch, clean, jerk; several or none); later changes reference exercises
  from mesocycles and weekly plans and add per-athlete adjustments of the
  values.
- An Athlete has at most one Macrocycle, planned by the coach of the
  athlete's Team. It consists of its weeks (each high, medium or low) and is
  divided into three Mesocycles (general preparation, special preparation
  and competition preparation block, by default 15 % / 50 % / rest of the
  weeks; the coach can move the borders, and a duration change scales the
  block lengths). Its base data is planned in two steps: the base data
  itself and the SWOT (strengths, deficits per lift and other deficits,
  experience, 1 to 3 ordered focus points, injuries and illnesses). A
  Mesocycle uses exercises from the exercise catalog, each with a reason
  (tags the exercise addresses and/or own reasons) and optionally a
  variation; the same exercise can be used in several mesocycles.
  Intensity, planned weights, reps and volume are calculated, not stored.
- A Macrocycle has a weekly schedule: the training sessions of a usual
  week (weekday and slot, up to 3 per day, 1–14 per week). The training
  frequency is its count and is not stored.
- A week of a Macrocycle has at most one Week plan, planned by the coach of
  the athlete's Team and readable by the linked athlete. It consists of
  training sessions (weekday and slot), each with exercises from the
  catalog (at most once per session, in order, with an optional coach note)
  and their set groups (sets × reps @ weight, the weight optional, at most
  10 sets), or a free text for exercises without values (30 and up). The linked
  athlete writes a feedback per session exercise; it stays with the same
  exercise in the same session when the coach saves the week. A new
  Week plan starts with the weekly schedule or a copy of the previous week.
  The week's actual values per exercise and their deviation from the
  macrocycle projection are calculated, not stored. Shortening a
  Macrocycle is refused while a removed week has a Week plan.
- Each exercise of the catalog addresses an ordered list of points (exercise
  tags, e.g. "High pull"); the same tag can be addressed by several
  exercises.
- A user account is created by the first sign-in with Google and is
  identified by that Google account. Name and picture follow the Google
  profile on every sign-in.
- Roles are per Team and derived from the data: a user account is the coach
  of the Team it leads (created with "Start as Coach") and an athlete of the
  Team whose Athlete it is linked to. It leads at most one Team and is
  linked to at most one Athlete; it can hold both roles, in the same Team or
  in different Teams. A user account without either role chooses one on the
  start page.
- A Team has exactly one coach. An Athlete belongs to exactly one Team and is
  created by its coach.
- Email address and profile picture are part of an athlete's basic data but
  come from the linked user account; they are not stored on the Athlete.
- An Invitation belongs to one Athlete, can be accepted once, expires after
  7 days and is replaced by a newer Invitation for the same Athlete.
  Accepting it links the accepting user account to the Athlete.
- A coach can link themselves to an Athlete of their own Team without an
  Invitation ("This is me").

## Draft (not yet built)

Nothing is drafted at the moment. Changes for training planning
(macrocycles, mesocycles, weekly plans) add their parts here or directly in
their `design.md`.

### Decisions (answered by the user on 2026-11-15)

- A Team has exactly one coach.
- A user account is linked to at most one Athlete, in one Team.
- An Invitation can be used once and expires after 7 days. The coach can
  create a new one at any time; the previous one then stops working.
- A coach trains themselves by linking their own user account to an
  Athlete in their own Team ("This is me"), without an invitation.
- A user account can be the coach of one Team and at the same time be
  linked to an Athlete in another Team; it is still linked to at most one
  Athlete overall.
- Users whose automatically created Team has no athletes lose it when user
  roles are introduced and choose their role again.
