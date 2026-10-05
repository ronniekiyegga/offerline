# Subscription API

A TypeScript and Express backend foundation for authentication, user-scoped
access, and subscription-oriented data. Built with Prisma and Neon Postgres.

The focus is predictable behaviour at the application boundary: clear
separation between HTTP handling, business logic, and persistence, with
validation, authentication, authorization, and rate limiting applied before
protected operations execute.

> **Project direction:** This repository is being evolved publicly into
> Offerline, a private candidate-workflow platform. The current API is the
> reviewed backend baseline; new candidate-workflow capabilities will be added
> incrementally and documented as they are implemented.

---

## Overview

This API uses a layered structure rather than placing business logic directly
inside route handlers:

- Routes compose endpoints and middleware.
- Controllers translate HTTP requests and responses.
- Middleware handles authentication, errors, and rate limiting.
- Services enforce business rules, ownership boundaries, and persistence.
- Zod schemas validate incoming request data.
- Prisma manages the PostgreSQL data model and migrations.

The aim is to keep route handlers thin, make the service layer testable, and
avoid coupling the rest of the application directly to the ORM.

---

## Current capabilities

- User creation through sign-up, with strict request validation, asynchronous
  password hashing, and duplicate-email conflict handling.
- JWT-based sign-up and sign-in with issuer, audience, algorithm, and expiry
  validation.
- Bearer-token authentication for protected endpoints.
- Self-only access to current-user and user-profile routes.
- Owner-scoped billing creation, reads, updates, cancellation, and deletion.
- Calendar-aware subscription renewal dates and effective expiry status.
- Arcjet token-bucket protection for authentication and API routes.
- Prisma migrations and Neon Postgres persistence.
- Structured client and server errors, security headers, and request-size
  limits.
- Health check endpoint.

Billing records currently model plan assignments and usage metrics. They are
not connected to an external payment provider, webhook flow, or entitlement
system.

---

## Architecture

```text
HTTP request
  ↓
Route and middleware composition
  ↓
Controller: HTTP translation
  ↓
Service: validation, ownership, domain rules, and persistence
  ↓
Prisma
  ↓
PostgreSQL / Neon
```

```text
routes/       Route definitions and middleware composition
controllers/  HTTP request and response handling
middleware/   Authentication, errors, and rate limiting
services/     Business rules, ownership checks, and Prisma access
models/       Zod schemas and domain helpers
prisma/       Database schema and migrations
```

Prisma access remains behind the service layer so that HTTP handlers are not
tightly coupled to persistence details.

---

## API surface

### Authentication and users

```text
POST /api/v1/auth/sign-up
POST /api/v1/auth/sign-in

GET  /api/v1/users/me
GET  /api/v1/users/:id

GET  /health
```

`GET /api/v1/users/me` and `GET /api/v1/users/:id` require a Bearer token.
The `:id` route is self-only: an authenticated user cannot retrieve another
user's record through that endpoint.

### Billing baseline

```text
GET    /api/v1/billing
GET    /api/v1/billing/renewals
POST   /api/v1/billing/subscribe
GET    /api/v1/billing/:id
PUT    /api/v1/billing/:id
DELETE /api/v1/billing/:id
PUT    /api/v1/billing/:id/cancel
```

Every billing route requires authentication. Reads and mutations are
constrained by both record ID and authenticated owner where applicable, so a
valid token alone is not sufficient to access another user's billing data.

This is a subscription-management baseline, not a completed payment-provider
integration.

---

## Key decisions and trade-offs

### Typed validation at the service boundary

Zod schemas parse untrusted request data before business and persistence logic
executes. Strict write schemas reject unexpected fields rather than silently
discarding them.

### JWT authentication and ownership checks

The API uses stateless JWT authentication and server-enforced self-only access.
Billing services include the authenticated owner in their database queries,
including mutation constraints. JWTs simplify the service boundary, but
refresh tokens and server-side revocation are not implemented yet.

### Arcjet rate limiting

Arcjet provides token-bucket limits for authentication and general API routes.
It is optional in development, skipped in tests, and required at production
startup. Authentication fails closed if the configured limiter is unavailable;
general API traffic fails open and logs the limiter error.

A Redis-backed limiter is deliberately deferred. It becomes appropriate only
when deployed requirements demonstrate a need for self-managed distributed
coordination, caching, or queue behaviour.

### Synchronous workflows today

The service does not use a queue or background worker. That keeps the baseline
simple, but it is not sufficient for durable payment processing, webhooks,
notifications, or reconciliation.

Those capabilities require persisted event state, idempotency handling, and
explicit retry and recovery behaviour before a workflow engine such as
Temporal should be considered.

### Prisma over raw SQL

Prisma provides typed data access and migration tooling. It improves delivery
speed and schema consistency while adding an abstraction layer that must be
understood when investigating query behaviour or performance.

---

## Planned evolution

The Offerline rebuild will focus on inspectable evidence rather than a large
feature list:

```text
Candidate-owned applications and tasks
    ↓
Explicit application lifecycle transitions and audit history
    ↓
Database-enforced ownership boundaries and negative tests
    ↓
Subscription entitlements
    ↓
Verified, idempotent payment-provider events
    ↓
Persistent outbox and retryable notification delivery
```

Deliberately deferred until a real requirement justifies them:

- Redis
- Temporal
- Kafka
- Microservices
- Separate analytics warehouse
- Real-time collaboration
- Automated job applications or scraping
- AI career-agent features

---

## Data layer

- Prisma 7 with Neon Postgres and the serverless driver.
- `DATABASE_URL` configures the pooled runtime connection.
- `DIRECT_URL` configures migrations and falls back to `DATABASE_URL` when
  omitted.

Migrations run separately from normal application startup. The application
runtime deliberately rejects localhost database URLs because it uses the Neon
serverless adapter.

---

## Running locally

### Requirements

- Node.js 20 or newer
- pnpm 10.12.1
- A Neon Postgres database

Configure the variables described in [`.env.example`](./.env.example):

```text
DATABASE_URL=  # pooled Neon connection
DIRECT_URL=    # direct Neon connection for migrations
JWT_SECRET=    # random value of at least 32 characters
ARCJET_KEY=    # required in production, optional in development
```

Do not commit real credentials.

### Start the API

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm dev
```

### Quality checks

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm audit --prod
```

---

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability-reporting guidance.

Environment files and generated clients are excluded from version control. No
real user, payment, or production data is included in this repository.
