## MODIFIED Requirements

### Requirement: Automatic saving
Every change in the week editor SHALL be saved on its own shortly after it
is made, so both steps always show the stored week; a week without
sessions SHALL be unplanned again. A change still waiting for its save
SHALL be sent when the editor is left, without a dialog.

#### Scenario: Automatic saving
- **WHEN** the coach adds a set in step 2 or moves an exercise in step 1
- **THEN** the week is saved without a save button, the editor says "All changes saved.", and the week opens later with the same content

#### Scenario: Empty the week
- **GIVEN** a planned week
- **WHEN** the coach removes all sessions
- **THEN** the week is no longer planned

#### Scenario: Saving fails
- **WHEN** a save fails
- **THEN** the editor says "Could not save." and offers "Try again"

#### Scenario: Leaving before the change is saved
- **GIVEN** a change that is not saved yet (just made, invalid or failed)
- **WHEN** the coach chooses the back link
- **THEN** no dialog appears; a valid change is saved before the page changes, an invalid one is not stored
