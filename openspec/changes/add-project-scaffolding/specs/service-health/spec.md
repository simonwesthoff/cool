# Spec Delta

## Purpose

Lets the container runtime, the reverse proxy and later monitoring check
whether the app is running and can reach its database.

## ADDED Requirements

### Requirement: Health endpoint
The system SHALL provide an unauthenticated HTTP endpoint at `/api/health`
that reports whether the app and its database are available. The response
SHALL NOT reveal configuration, versions of dependencies, or other internal
details.

#### Scenario: App and database are available
- **WHEN** a client requests `/api/health` and the database is reachable
- **THEN** the response has status 200 and reports the app and the database as available

#### Scenario: Database is unavailable
- **WHEN** a client requests `/api/health` and the database cannot be reached
- **THEN** the response has status 503 and reports the database as unavailable

#### Scenario: Health check is fast when the database hangs
- **WHEN** the database does not answer within 2 seconds
- **THEN** the endpoint responds with status 503 instead of waiting longer
