# localization Specification

## Purpose

Makes the whole user interface available in English and German, so coaches
and athletes can use the app in their preferred language.

## Requirements

### Requirement: Supported UI languages
The system SHALL offer the user interface in English and German. Every
user-facing text SHALL exist in both languages. English SHALL be the fallback
language.

#### Scenario: Page shown in German
- **GIVEN** the selected language is German
- **WHEN** the user opens any page
- **THEN** all user-facing text on that page is shown in German

#### Scenario: Page shown in English
- **GIVEN** the selected language is English
- **WHEN** the user opens any page
- **THEN** all user-facing text on that page is shown in English

#### Scenario: Missing translation is detected before release
- **WHEN** a user-facing text exists in one language catalog but not in the other
- **THEN** the automated checks fail and name the missing text

### Requirement: Initial language from the browser
On a user's first visit, the system SHALL choose the UI language from the
browser's preferred languages: German if German is preferred over English,
otherwise English.

#### Scenario: Browser prefers German
- **GIVEN** the user has not chosen a language before
- **WHEN** the browser's preferred language is German
- **THEN** the UI is shown in German

#### Scenario: Browser prefers an unsupported language
- **GIVEN** the user has not chosen a language before
- **WHEN** the browser's preferred languages are neither German nor English
- **THEN** the UI is shown in English

### Requirement: User can switch the language
The system SHALL let the user switch the UI language between English and
German on any page. The choice SHALL be remembered on that device and take
precedence over the browser's preferred language.

#### Scenario: Switching to German
- **GIVEN** the UI is shown in English
- **WHEN** the user selects German in the language switcher
- **THEN** the current page is shown in German without losing the user's place

#### Scenario: Choice is remembered
- **GIVEN** the user selected German on this device
- **WHEN** the user returns later with a browser that prefers English
- **THEN** the UI is shown in German

### Requirement: Language-neutral URLs
Page URLs SHALL NOT depend on the UI language, so that a link opens the same
page for every recipient in their own language.

#### Scenario: Shared link opens in the recipient's language
- **GIVEN** a user with English selected copies the URL of a page
- **WHEN** a user with German selected opens that URL
- **THEN** the same page is shown in German

### Requirement: Language of API error messages
API error responses SHALL contain a stable, language-independent error code,
so that each client can show the message in its user's language.

#### Scenario: Validation error from the API
- **WHEN** a client sends a request that fails validation
- **THEN** the response contains a machine-readable error code and the affected fields, not only a translated text
