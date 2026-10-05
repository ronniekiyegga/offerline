# Subscription API

Backend system for handling authentication, user access, and subscription-style data. Built with Node.js (Express), TypeScript, Prisma, and Neon Postgres.

The focus here is predictable behaviour under load: clear boundaries between HTTP, business logic, and data, with guardrails around auth, validation, and rate limiting.

---

## Overview

I structured this as a layered API rather than a collection of routes:

- Routes stay thin and only deal with HTTP concerns
- Services handle business logic and data access
- Middleware handles cross-cutting concerns (authentication, errors, rate limiting)

The goal was to keep the system easy to extend without turning it into tightly coupled route logic.

---

## Key Decisions

- **Typed validation at the edge (Zod)**
  I validate requests before they reach business logic so services can assume correct input.

- **JWT-based auth with resource ownership boundaries**
  Access is scoped per user; endpoints like `GET /users/:id` are explicitly self-only.

- **Rate limiting at the edge**
  I use Arcjet token-bucket limits for now. It’s optional in local/test environments, but protects auth routes in production.

- **Separation of transactional vs future async work**
  Billing and subscription-style flows are implemented synchronously; heavier reconciliation and webhooks are expected to move to background jobs later.

---

## Architecture

- **routes/**: HTTP layer only (Express handlers)
- **middleware/**: auth (`requireAuth`), error handling, rate limiting
- **services/**: business logic (e.g. create user, auth flow)
- **models/**: Zod schemas + small domain helpers
- **prisma/**: database schema

I keep Prisma behind the service layer so the rest of the app isn’t tightly coupled to the ORM.

---

## API Surface (current)

- `POST /api/v1/auth/sign-in` / `sign-up`
  Returns JWT access token.

- `GET /api/v1/users/me`
  Current user (Bearer token required)

- `GET /api/v1/users/:id`
  Self-only access (enforced in middleware)

- `GET /api/v1/billing` and `GET /api/v1/billing/renewals`
- `POST /api/v1/billing/subscribe`
- `GET`, `PUT`, and `DELETE /api/v1/billing/:id`
- `PUT /api/v1/billing/:id/cancel`

  Every billing endpoint requires a Bearer token and constrains data access to
  the authenticated user. Monthly and yearly renewals use UTC calendar dates,
  including end-of-month clamping.

- `GET /health`
  Basic health check

---

## Data Layer

- **Prisma 7 + Neon Postgres (serverless driver)**
- `DATABASE_URL` used at runtime (pooled)
- `DIRECT_URL` used for migrations (falls back to `DATABASE_URL` when omitted)

I keep migrations separate from runtime connections so deploys don’t block on schema changes.

---

## Rate Limiting

- Token-bucket via Arcjet
- Tighter limits on auth routes
- Skipped in tests and optional in development
- `ARCJET_KEY` is required when the application starts in production
- Authentication requests fail closed if the rate-limit service is unavailable

If this needed to scale further, I’d move to Redis-backed limits for cross-instance coordination.

---

## Tradeoffs

- **JWT over sessions**
  Simpler stateless auth, but no built-in revocation without extra work (planned via refresh tokens)

- **Arcjet over custom limiter**
  Faster to ship, but less control than a Redis-backed system

- **Single service (no queues yet)**
  Keeps the system simple now, but billing/reconciliation will need background workers later

- **Prisma abstraction**
  Speeds up development, but adds an extra layer vs raw SQL when tuning queries

---

## Running locally

Requirements: Node.js 20 or newer and pnpm 10.12.1. Copy `.env.example` to
local environment files and provide `DATABASE_URL` plus a JWT secret of at
least 32 characters. This repository uses `pnpm-lock.yaml` as its only lockfile.

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm dev
```

Before deploying, run the same checks as CI:

```bash
pnpm run typecheck
pnpm run lint
pnpm test
```
