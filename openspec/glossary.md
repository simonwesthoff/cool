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

## App

| German | Abbreviation | English | Definition |
|---|---|---|---|
| Benutzerkonto | - | User account | The identity of a person in the app, created by their first sign-in with Google. Has no role by itself. |
| Team | - | Team | The group of athletes one coach trains. Has exactly one coach. |
| Trainer | - | Coach | The user account that leads a Team and plans the training of its athletes. |
| Athlet | - | Athlete | A person trained in a Team. Created by the coach; can later be linked to a user account through an invitation. |
| Stammdaten | - | Basic data | An athlete's personal data that rarely changes: name, date of birth, gender, start date of the weightlifting career, height, email address and profile picture. |
