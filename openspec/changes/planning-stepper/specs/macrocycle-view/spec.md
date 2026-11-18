# Spec Delta

## MODIFIED Requirements

### Requirement: Macrocycle view access
The coach of the athlete's Team SHALL open the macrocycle view from the
athlete details page; the athlete linked to the Athlete SHALL open the same
view from "My training". Whichever way it is opened, the view SHALL offer
"Change planning" exactly when the user may plan the macrocycle, which is
when they lead the athlete's Team. Other users SHALL get the "not found"
page. Without a macrocycle, the coach SHALL be sent to step 1 of the
planning, and the athlete SHALL see that no macrocycle is planned yet.

#### Scenario: Coach opens the view
- **GIVEN** an athlete of the coach's Team with a planned macrocycle
- **WHEN** the coach opens the macrocycle from the athlete details page
- **THEN** they see the macrocycle view with "Change planning" and a way back to the athlete details page

#### Scenario: Athlete opens the view
- **GIVEN** a user linked to an Athlete of another user's Team with a planned macrocycle
- **WHEN** they open the macrocycle from "My training"
- **THEN** they see the same view without "Change planning" and without any other way to change the macrocycle

#### Scenario: Coach who trains themselves
- **GIVEN** a coach linked to an Athlete of their own Team with a planned macrocycle
- **WHEN** they open the macrocycle from "My training" or from the athlete details page
- **THEN** both show the same view with "Change planning"

#### Scenario: Another user
- **WHEN** a user who is neither the coach of the athlete's Team nor linked to the Athlete opens the view
- **THEN** they see the "not found" page

#### Scenario: Not planned yet
- **GIVEN** an athlete without a macrocycle
- **WHEN** the coach opens the view, or the linked athlete opens their macrocycle
- **THEN** the coach is sent to step 1 of the planning, and the athlete sees that their coach has not planned a macrocycle yet

### Requirement: Layout of the view
The view SHALL have the title "<first name>'s macrocycle" ("Makrozyklus von
<first name>" in German) and show, from top to bottom: the exercise chart,
the focus points in their order, and the new macrocycle plan. It SHALL be
as wide as the planning step with the intensity chart.

#### Scenario: Order
- **WHEN** the coach opens the view
- **THEN** the exercise chart is at the top, followed by the focus points and the new macrocycle plan, and the historical data, deficits and injuries are not shown

#### Scenario: Width
- **WHEN** the coach opens the view on a desktop screen
- **THEN** the exercise chart is as wide as the intensity chart in planning step 3

#### Scenario: Title with the first name
- **GIVEN** the athlete "Anna Weber"
- **WHEN** the coach or Anna opens the macrocycle view
- **THEN** the title is "Anna's macrocycle", without a separate name line above it

