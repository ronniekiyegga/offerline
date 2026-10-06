# Offerline

Offerline is evolving into a full-stack candidate-workflow product. Today this
repository contains the reviewed TypeScript and Express API baseline and a
minimal Next.js landing page in a pnpm workspace. Candidate-workflow
capabilities have not been added yet.

The focus is predictable behaviour at the application boundary: clear
separation between HTTP handling, business logic, and persistence, with
validation, authentication, authorization, and rate limiting applied before
protected operations execute.

The existing API provides authentication, user-scoped access, and
subscription-management data backed by Prisma and Neon Postgres. New product
capabilities will be added incrementally and documented only after they are
implemented and verified.

---

## Overview

The repository currently has two independently configured workspace packages:

```text
apps/
├── api/    Express, TypeScript, Prisma, and Vitest
└── web/    Next.js, React, TypeScript, and Vitest
```

### Project structure

```text
apps/api/src/      API implementation
apps/api/prisma/   Prisma schema and migrations
apps/api/tests/    API tests using a mocked Prisma client
apps/web/src/      Next.js frontend implementation
docs/              Product documentation and architecture decisions
```

The API uses a layered structure rather than placing business logic directly
inside route handlers:

- Routes compose endpoints and middleware.
- Controllers translate HTTP requests and responses.
- Middleware handles authentication, errors, and rate limiting.
- Services enforce business rules, ownership boundaries, and persistence.
- Zod schemas validate incoming request data.
- Prisma manages the PostgreSQL data model and migrations.

The aim is to keep route handlers thin, make the service layer testable, and
avoid coupling the rest of the application directly to the ORM.

### Current status

| Area | Status |
| --- | --- |
| Express API and liveness endpoint | Implemented |
| JWT authentication and owner-scoped access | Implemented |
| Billing CRUD, cancellation, and renewal rules | Implemented |
| Prisma schema and migrations | Implemented for Neon Postgres |
| Tests | 36 tests; Prisma is mocked, so these are not database integration tests |
| Candidate workflow | Proposed, not implemented |
| Web frontend | Landing page and API-liveness connectivity implemented |
| Payment-provider integration and entitlements | Not implemented |
| Row-level security | Not implemented |

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
Browser
  ↓ same-origin /api/health
Next.js route handler
  ↓ server-side HTTP
Express API
  ↓
Prisma → PostgreSQL / Neon
```

```text
apps/api/src/routes/       Route definitions and middleware composition
apps/api/src/controllers/  HTTP request and response handling
apps/api/src/middleware/   Authentication, errors, and rate limiting
apps/api/src/services/     Validation, business rules, ownership, and persistence
apps/api/src/models/       Zod schemas and domain helpers
apps/api/prisma/           Database schema and migrations
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
user's record through that endpoint. User creation is exposed through
`POST /api/v1/auth/sign-up`; there is no `POST /api/v1/users` route.

`GET /health` is a process-liveness endpoint. It does not query PostgreSQL and
must not be presented as a database-readiness check.

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
This ownership enforcement is implemented in the API service layer; the
database schema does not currently use row-level security.

This is a subscription-management baseline, not a completed payment-provider
integration.

---

## Key decisions and trade-offs

### Typed validation in services and models

Zod schemas live in the model modules and are invoked by services before
business and persistence logic executes. There is no separate validation
middleware layer. Strict write schemas reject unexpected fields rather than
silently discarding them.

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

### Product documentation

- [Offerline product brief](./docs/product/product-brief.md) defines the target
  user, V1 outcome, scope, exclusions, and delivery sequence.
- [ADR 001: Product boundary](./docs/architecture/adr/001-product-boundary.md)
  records the proposed candidate-workflow boundary and the evidence required
  before it is considered implemented.
- [ADR 002: Full-stack workspace](./docs/architecture/adr/002-full-stack-workspace.md)
  records why the API and web application share a repository while retaining
  separate runtime and deployment boundaries.

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

- Node.js 22.21.0 (see [`.nvmrc`](./.nvmrc))
- pnpm 10.12.1
- A Neon Postgres database

The API variables are documented in
[`apps/api/.env.example`](./apps/api/.env.example). The API loads environment
files from `apps/api`, not the workspace root:

```text
DATABASE_URL=  # pooled Neon connection
DIRECT_URL=    # direct Neon connection for migrations
JWT_SECRET=    # random value of at least 32 characters
ARCJET_KEY=    # required in production, optional in development
```

Do not commit real credentials.

The frontend has a separate server-only variable documented in
[`apps/web/.env.example`](./apps/web/.env.example):

```text
OFFERLINE_API_BASE_URL=http://127.0.0.1:5500
```

Do not prefix it with `NEXT_PUBLIC_`. Browser code calls the same-origin Next.js
health route and never receives the upstream API URL.

### Start the API

```bash
pnpm install
pnpm run prisma:generate
pnpm run dev:api
```

### Build and start the API for production

```bash
pnpm run build:api
pnpm run start:api
```

The build generates Prisma Client and compiles the API plus its generated
runtime into `apps/api/dist`. The production start command runs the emitted
JavaScript with Node; it does not use `tsx` or other development-only runtime
packages.

At build time, Prisma configuration requires `DATABASE_URL` or `DIRECT_URL`,
but generation does not connect to the database. At runtime, host-provided
variables are read first, `apps/api/.env` fills missing values, and
`apps/api/.env.production.local` overrides earlier values when present.
Production startup requires a pooled Neon `DATABASE_URL`, a `JWT_SECRET` of at
least 32 characters, and `ARCJET_KEY`. The process verifies database
connectivity before it begins listening.

### Start the frontend

With the API running in another terminal:

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm run dev:web
```

`pnpm dev` starts both workspace applications. The connectivity panel reports
only whether the Express liveness response is reachable through the Next.js
route; it does not test PostgreSQL.

Migrations are intentionally separate from application startup. After checking
that `DIRECT_URL` targets the intended database, an operator can run:

```bash
pnpm --filter @offerline/api exec prisma migrate deploy
```

Do not run that command as part of ordinary local checks or against a database
that has not been explicitly selected for migration.

### Quality checks

```bash
pnpm run prisma:validate
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build:api
pnpm run build:web
pnpm audit --prod
```

The current test suite replaces Prisma operations with test doubles. Passing
tests prove API behavior at the mocked persistence boundary; they do not prove
connectivity, migration application, or query behavior against a real database.

---

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability-reporting guidance.

Environment files and generated clients are excluded from version control. No
real user, payment, or production data is included in this repository.
