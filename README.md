# Subscription API

A TypeScript and Express backend foundation for authentication, user-scoped
access and subscription-oriented data. Built with Prisma and Neon Postgres.

The focus is predictable behaviour at the application boundary: clear
separation between HTTP handling, business logic and persistence, with
validation, authentication and rate limiting applied before protected
operations execute.

> **Project direction:** This repository is being evolved publicly into
> Offerline, a private candidate-workflow platform. The current API is the
> reviewed backend baseline; new candidate-workflow capabilities will be added
> incrementally and documented as they are implemented.

---

## Overview

This API uses a layered structure rather than placing business logic directly
inside route handlers:

- Routes and controllers handle HTTP concerns.
- Middleware handles authentication, validation, errors and rate limiting.
- Services contain business logic and persistence access.
- Zod schemas validate incoming request data.
- Prisma manages the PostgreSQL data model and migrations.

The aim is to keep route handlers thin, make the service layer testable, and
avoid coupling the rest of the application directly to the ORM.

---

## Current capabilities

- User creation with request validation, password hashing and duplicate-email
  conflict handling.
- JWT-based sign-up and sign-in.
- Bearer-token authentication for protected endpoints.
- User-scoped access to current-user and self-only profile routes.
- Arcjet token-bucket protection for authentication routes where configured.
- Prisma migrations and PostgreSQL persistence.
- Health check endpoint.

Subscription and billing routes are present as a scaffold but are not yet
connected to an external payment provider or a complete billing workflow.

---

## Architecture

```text
HTTP request
  ↓
Route / controller
  ↓
Middleware: validation, authentication, rate limiting, error handling
  ↓
Service: domain logic and persistence operations
  ↓
Prisma
  ↓
PostgreSQL / Neon
```

```text
routes/       Route definitions and middleware composition
controllers/  HTTP request and response handling
middleware/   Authentication, validation, errors and rate limiting
services/     Business logic and Prisma access
models/       Zod schemas and small domain helpers
prisma/       Database schema and migrations
```

Prisma access remains behind the service layer so that HTTP handlers and
domain logic are not tightly coupled to persistence details.

---

## API surface

### Authentication and users

```text
POST /api/v1/users
POST /api/v1/auth/sign-up
POST /api/v1/auth/sign-in

GET  /api/v1/users/me
GET  /api/v1/users/:id

GET  /health
```

`GET /api/v1/users/me` and `GET /api/v1/users/:id` require a Bearer token.
The `:id` route is self-only: an authenticated user cannot retrieve another
user’s record through that endpoint.

### Subscription baseline

Subscription routes exist as an implementation scaffold. They are not
presented as a completed payment or billing integration.

The next domain milestone will define candidate-owned application workflows,
subscription entitlements, verified external events and the testable
invariants required to keep those operations correct.

---

## Key decisions and trade-offs

### Typed validation at the edge

Zod schemas validate incoming requests before they enter services. This keeps
malformed input from reaching business and persistence logic.

### JWT authentication and ownership checks

The current API uses stateless JWT authentication and middleware-enforced
self-only access for protected user routes. JWTs simplify the service boundary,
but refresh tokens and server-side revocation are not implemented yet.

### Arcjet rate limiting

Authentication routes use Arcjet token-bucket limits when configured. This is
a fast way to protect a security-sensitive boundary, but it introduces an
external dependency and does not provide a self-managed coordination layer.

A Redis-backed limiter is deliberately deferred. It becomes appropriate only
when the deployed system needs distributed coordination, caching or queue
behaviour that the current approach cannot safely provide.

### Synchronous workflows today

The current service does not use a queue or background worker. That keeps the
baseline simple, but it is not sufficient for durable payment processing,
webhooks, notifications or reconciliation.

Those capabilities will require persisted event state, idempotency handling
and explicit retry/recovery behaviour before a workflow engine such as
Temporal should be considered.

### Prisma over raw SQL

Prisma provides typed data access and migration tooling. It improves delivery
speed and schema consistency, while adding an abstraction layer that must be
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
- `DATABASE_URL` configures the runtime database connection.
- `DIRECT_URL` is used for migrations when configured.

Migrations run separately from normal application startup.

---

## Running locally

### Requirements

- Node.js 20 or newer
- pnpm 10.12.1
- A PostgreSQL-compatible database

Copy `.env.example` to your local environment configuration and provide:

```text
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
ARCJET_KEY=
```

`JWT_SECRET` should be at least 32 characters. Do not commit real credentials.

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
```

---

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability-reporting guidance.

No real user, payment or production data is included in this repository.