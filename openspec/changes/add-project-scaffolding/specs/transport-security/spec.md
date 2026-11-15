# Spec Delta

## Purpose

Ensures that browsers only talk to the app over encrypted, trusted HTTPS
connections, in local development as well as in production.

## ADDED Requirements

### Requirement: HTTPS only
The system SHALL serve pages and API responses to browsers only over HTTPS,
in every environment including local development on `localhost`. No page or
API response SHALL be served over plain HTTP.

#### Scenario: Opening the app
- **WHEN** a user opens the app in a browser
- **THEN** the connection uses HTTPS

#### Scenario: Plain HTTP request
- **WHEN** a browser requests any URL of the app over plain HTTP
- **THEN** the response is a redirect to the same URL over HTTPS and contains no page or API content

#### Scenario: Local development server
- **WHEN** a developer starts the local development server
- **THEN** it is reachable only over HTTPS

### Requirement: Certificates
In production the certificate presented to the browser SHALL be issued by a
publicly trusted certificate authority, so no user sees a certificate
warning. On `localhost` a certificate that the browser does not trust is
acceptable; the developer confirms the browser warning once.

#### Scenario: Public certificate in production
- **WHEN** a user opens the app on its public domain
- **THEN** the certificate is issued by a publicly trusted certificate authority and the browser shows no certificate warning

#### Scenario: Local certificate needs no extra tools
- **GIVEN** a developer machine with only the documented prerequisites
- **WHEN** the developer opens the app on `localhost` and confirms the certificate warning
- **THEN** the app is shown over an encrypted HTTPS connection

### Requirement: HSTS in production
On its public domain the system SHALL send a `Strict-Transport-Security`
header so browsers use HTTPS for all later visits.

#### Scenario: HSTS header on the public domain
- **WHEN** a browser receives any response from the public domain
- **THEN** the response contains a `Strict-Transport-Security` header with a max-age of at least one year

#### Scenario: No HSTS on localhost
- **WHEN** a browser receives a response from `localhost`
- **THEN** the response contains no `Strict-Transport-Security` header, so other local projects are not affected
