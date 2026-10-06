# Offerline Product Brief

**Status:** Proposed
**Last updated:** 6 October 2026

## Problem

Active job searches are fragmented across job boards, email, calendars,
documents, and private notes. Candidates lose an accurate view of their
pipeline, miss follow-ups, and repeatedly reconstruct the history of an
application.

## Target user

Offerline V1 is for an individual candidate managing their own active job
search. It is not designed for recruiters, agencies, hiring teams, or public
candidate profiles.

## V1 outcome

A candidate can maintain one private, trustworthy workflow for each
application:

```text
Create an application
    ↓
Track its current stage
    ↓
Record the next action and due date
    ↓
Review the history of meaningful changes
```

The product succeeds when candidates can answer three questions without
searching across other tools:

1. What applications are active?
2. What changed, and when?
3. What should I do next?

## V1 scope

- Candidate-owned applications
- Explicit lifecycle stages and validated transitions
- Notes and relevant links attached to an application
- Next actions with optional due dates
- An append-only history of meaningful lifecycle changes
- Private-by-default access enforced by the API and persistence layer

Subscription entitlements may later gate clearly defined premium capabilities,
but payment-provider integration is not part of the first candidate-workflow
milestone.

## Explicit exclusions

- Automated applications or job-board scraping
- Recruiter and employer workflows
- Public profiles or candidate discovery
- AI agents that act on a candidate's behalf
- Shared workspaces and real-time collaboration
- Native mobile applications
- Payment webhooks, credits, invoices, or refunds
- Microservices, Kafka, Temporal, or Redis without demonstrated need

## Product invariants

- A candidate can access only resources they own.
- Lifecycle changes are explicit and validated.
- Important changes leave an inspectable history.
- Retried requests must not create duplicate business effects.
- Failed asynchronous work must remain visible and recoverable when async
  processing is introduced.

## Delivery sequence

1. Define the candidate-owned application data model.
2. Add create, list, read, and update use cases.
3. Add negative tests proving cross-candidate access is denied.
4. Add explicit lifecycle transitions and history.
5. Add next actions and due dates.
6. Introduce entitlements only after premium boundaries are defined.

The existing authentication and subscription API remains the reviewed backend
baseline while these capabilities are introduced incrementally.
