# ADR 002: Use a Full-Stack pnpm Workspace

**Status:** Accepted
**Date:** 6 October 2026

## Context

Offerline began as a reviewed Express, TypeScript, and Prisma API. The next
delivery slice needs a browser interface while preserving the API's routes,
authentication, ownership rules, migrations, and tests.

## Decision

Keep the existing API and a Next.js frontend in one pnpm workspace:

```text
Browser
  ↓
apps/web (Next.js)
  ↓ HTTP
apps/api (Express)
  ↓
PostgreSQL / Neon
```

The applications share repository tooling and one lockfile, but remain
separate packages with separate runtime configuration and deployment
artifacts. The frontend communicates with the API over HTTP and must not import
Prisma, database credentials, or API persistence modules.

Application source is separated from package-level tooling in both packages.
The API implementation lives in `apps/api/src`, while its Prisma files, tests,
generated client, environment examples, and tool configuration remain at the
`apps/api` package level. The frontend implementation remains in
`apps/web/src`.

## Rationale

- Preserving the existing API avoids a rewrite of verified behavior.
- One repository keeps contract changes, documentation, and CI reviewable
  together while the product is small.
- Separate packages make runtime and security boundaries explicit.
- Separate deployment configuration allows the frontend and API to scale and
  release independently.
- Keeping implementation under `src` makes application code easier to locate
  without introducing new package or domain abstractions.

## Costs

- Root scripts and CI must orchestrate two applications.
- Environment variables need package-specific documentation.
- The lockfile contains dependencies for both runtimes.
- Cross-application changes require compatibility checks at the HTTP boundary.
- A monorepo does not remove the need for independent deployment verification.
- Moving API source under `src` adds relative-path maintenance for tests,
  generated Prisma imports, and package-local environment loading.

## Consequences

- `apps/api` remains the authority for authentication, authorization, billing,
  and persistence.
- `apps/web` owns presentation and browser interaction.
- Database and JWT configuration remain API-only.
- Source directories are organisational boundaries, not shared runtime
  packages; no additional abstraction is introduced by this decision.
- Frontend health connectivity is liveness evidence, not database readiness or
  production-readiness evidence.
- Docker and hosting configuration remain deferred decisions.

## Revisit when

Revisit this decision when independent teams require separate release access,
repository size materially slows delivery, compliance requires stronger source
separation, or deployment coupling creates measured operational problems.
Technology preference alone is not sufficient reason to split the repository.
