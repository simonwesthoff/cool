# Glossary

Domain terms for the weightlifting coaching app.

## Conventions

- **Specs, other OpenSpec artifacts and code** use the English name only,
  never the German term or its abbreviation. Code identifiers follow it,
  e.g. `macrocycle`.
- **Input** (change descriptions, prompts, review comments) may use the German
  term or its abbreviation. Translate it to the English name using this table.
- **UI** shows the German term in the German locale and the English name in the
  English locale.
- New terms are added here in the same change that introduces them.

## Training

| German | Abbreviation | English | Definition |
|---|---|---|---|
| Trainingsmittelkatalog | TMK | Exercise catalog | The set of exercises available for planning, based on a German weightlifting training catalog. Defined in its own spec. |
| Makrozyklus | MAZ | Macrocycle | Training cycle that consists of several mesocycles. Can take up to a year. Usually ends with the main competition. |
| Mesozyklus | MEZ | Mesocycle | Each mesocycle has its focus. Usually takes 2-8 weeks. |
| Grundlagenphase | GLP | General preparation block | First mesocycle in a macrocycle. Focus on hypertrophy. |
| Aufbauphase | ABP | Special preparation block | Second mesocycle in a macrocycle. Focus on transferring abilities to the competition exercises. |
| Leistungsausprägungsphase | LAP | Competition preparation block | Third mesocycle in a macrocycle. Focus on high weight competition lifts. |
| Unmittelbare Wettkampfvorbereitung | UWK | Taper | Sometimes part of the competition preparation block. Lower intensity to reduce fatigue right before the competition. |
| Übergangsphase | - | Transition block | Phase after the competition to cure injuries. No special training. |
| Mikrozyklus | MIZ | Microcycle | Usually a week of training. |
| Trainingseinheit | TE | Training session | Unit of training. Can be up to 3 times a day. |
| Trainingsübung | TÜ | Exercise | Training exercise from the exercise catalog. |
| Mittleres Hantelgewicht | mHG | Average Weight | Average weight for a TÜ within a TE. Can also be calculated for all of the weights moved within a week. |
| Komplex | K | Exercise group | Group of exercises in the exercise catalog with the same training focus, numbered K1–K9. |
| Bestwert | - | Best value | Reference value of an exercise in % of the max of its reference lift. |
| Referenzübung | - | Reference lift | The competition lift (snatch or clean & jerk) an exercise's percentages refer to. |

| Einstiegswert | - | Entry value | Share of the max values (in %) a macrocycle starts with, usually 60 %. |
| Intensität | - | Intensity | Planned share of the max values for a week, following the macrocycle's curve. |
| Wochenintensität (hoch, mittel, niedrig) | - | Week level (high, medium, low) | A high week adds 5 percentage points to the intensity, a low week subtracts 5. |
| Satzgröße | - | Set size | Repetitions per set. |
| Wochenwiederholungen | - | Weekly reps | Repetitions of an exercise per week. |
| Umfang | - | Volume | Sum of the weekly reps of all exercises of a week. |
| Bestleistung | - | Personal best | An athlete's best result in snatch or clean & jerk. |
| Zielleistung | - | Goal | The result in snatch or clean & jerk the macrocycle aims at. |
| Hauptwettkampf | - | Main competition | The competition a macrocycle leads to. |

### Exercise groups

| German | Abbreviation | English | Definition |
|---|---|---|---|
| Wettkampfübungen | K1, WKÜ | Competition exercises | Snatch, clean and jerk and their parts. |
| Teilwettkampfübungen | K2, TWKÜ | Partial competition exercises | Parts and variations of the competition exercises. |
| Schnellkraftfähigkeit | K3, SKF | Speed strength | Pulls. |
| Maximalkraftfähigkeit Beschleunigen | K4, MKF | Maximum strength: acceleration | Deadlifts and jerk dip squats. |
| Maximalkraftfähigkeit Abbremsen | K5 | Maximum strength: deceleration | Squats. |
| Maximalkraftfähigkeit Umgruppieren | K6 | Maximum strength: turnover | Pulls from elevated positions, muscle snatch, presses. |
| Übungskombinationen | K7 | Exercise combinations | Combinations of exercises in one set. |
| Allgemeines Muskelkrafttraining 1 | K8, AMKT | General strength training 1 | General strength exercises with free weights and body weight. |
| Allgemeines Muskelkrafttraining 2 | K9 | General strength training 2 | General strength exercises on machines. |

## App

| German | Abbreviation | English | Definition |
|---|---|---|---|
| Benutzerkonto | - | User account | The identity of a person in the app, created by their first sign-in with Google. Has no role by itself. |
| Team | - | Team | The group of athletes one coach trains. Has exactly one coach. |
| Trainer | - | Coach | The user account that leads a Team and plans the training of its athletes. |
| Athlet | - | Athlete | A person trained in a Team. Created by the coach; can later be linked to a user account through an invitation. |
| Stammdaten | - | Basic data | An athlete's personal data that rarely changes: name, date of birth, gender, start date of the weightlifting career, height, email address and profile picture. |
| Rolle | - | Role | Coach or athlete. A user account holds roles per Team: coach of the Team it leads, athlete of the Team whose Athlete it is linked to. |
| Einladung | - | Invitation | A link a coach creates for one Athlete of their Team. Accepting it links the user account to that Athlete. Usable once, valid for 7 days, replaced by a newer one. |
