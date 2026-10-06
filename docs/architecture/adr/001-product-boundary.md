# ADR 001: Define the Offerline Product Boundary

**Status:** Proposed
**Date:** 6 October 2026

## Context

This repository currently implements authentication, self-scoped user access,
and owner-scoped subscription records. Its next product milestone is a private
candidate workflow rather than a broader collection of billing endpoints.

Without an explicit boundary, the project could drift toward unrelated job
board, recruiting, automation, payment, or infrastructure features before it
proves the central user workflow.

## Decision

Offerline V1 will be a private system for an individual candidate to manage
their own job applications, lifecycle changes, next actions, and relevant
history.

The first domain slice will follow these rules:

1. Every application belongs to one authenticated candidate.
2. All reads and mutations are constrained by both resource identity and
   candidate ownership.
3. Lifecycle stages and allowed transitions are explicit domain concepts.
4. Meaningful lifecycle changes create durable history records.
5. The application remains a modular monolith using the existing Express,
   Prisma, and PostgreSQL boundaries.
6. Subscription records remain a baseline capability; entitlements will not be
   inferred until premium product boundaries are defined.

## In scope

- Candidate-owned applications
- Application stages and transition rules
- Notes, links, and next actions
- Lifecycle history
- Negative authorization tests
- Database-enforced ownership controls when the candidate schema is added

## Out of scope

- Job discovery, aggregation, or scraping
- Automated application submission
- Recruiter, employer, agency, or marketplace workflows
- AI agents acting autonomously for a candidate
- Shared workspaces and real-time collaboration
- Payment-provider integration during the first domain milestone
- Microservices or distributed workflow infrastructure

## Consequences

### Positive

- Product scope is testable through one coherent user journey.
- Authorization becomes a domain invariant rather than a UI assumption.
- Lifecycle behavior can be reviewed through explicit state and history.
- Existing API foundations can evolve incrementally without a rewrite.

### Trade-offs

- The first release serves one user type and omits collaboration.
- Subscription data will coexist with the candidate domain before entitlement
  rules connect them.
- Some future integrations will require schema and operational decisions that
  are intentionally deferred.

## Revisit when

Reconsider this boundary only when usage evidence requires another actor,
shared ownership, automated external actions, or a separately operated service.
Technology preference alone is not sufficient reason to expand the boundary.

## Verification

This decision becomes implemented evidence when the repository contains:

- a candidate-owned application schema and migration;
- authenticated application endpoints;
- tests proving candidate A cannot read or mutate candidate B's application;
- validated lifecycle transitions with history records.

Until those artifacts exist, this ADR remains **Proposed**.
