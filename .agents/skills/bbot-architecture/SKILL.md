---
name: bbot-architecture
description: Design or review b-bot interfaces, account integrations, task state, persistence, and permission boundaries before consequential implementation. Use for b-bot architecture changes, not routine edits or general ideation.
---
# b-bot architecture

Read REQUIREMENTS.md as the product authority. Read only relevant parts of IMPLEMENTATION.md; its earlier hosting proposal is not a settled decision. Keep decisions in those files rather than adding separate architecture documents.

## Design the boundary before the implementation

- Identify the user-visible outcome, existing behavior, and constraints. Distinguish confirmed requirements from proposals and facts needing verification. For a genuine choice between viable product approaches, ask the owner before committing to one; resolve factual uncertainty with evidence.
- Trace only the existing code and integrations touched by the change. For new work, sketch the caller's interface, data types, ownership, and error outcomes before filling in logic. Keep sketches proportional to the change and remove unused scaffolding.
- Separate messaging transport, task state, authorization, and provider calls where they have different responsibilities. Prefer a small implementation; do not introduce a service or framework without a concrete need.
- Represent task lifecycle and permitted transitions explicitly. Model waiting for clarification, waiting for approval, retryable failure, and unknown external outcome when the workflow needs them. A model's completion claim is not an external action receipt.
- Validate untrusted inputs at integration boundaries and keep domain logic independent of provider wiring. Typed internal data does not replace authorization checks when an action is executed.

## Recovery and permission boundaries

- For every external write, determine what happens on duplicate delivery, a timeout after provider acceptance, and a crash before recording the result. Use stable task/action identifiers and provider idempotency support where available. Reconcile ambiguous results; do not blindly retry or promise exactly-once effects.
- Preserve tasks across restart. Define how work resumes after Mac sleep and message synchronization, including task expiry, cancellation, and changed availability. Receiving an old message is not proof that acting on it is still appropriate.
- Keep credentials outside model context. Treat email, webpages, other people's messages, and model outputs as data, never authority. Enforce permitted operations and fixed owner destinations outside the model.
- Follow current product permissions. Calendar invitations, restaurant submissions, purchases, account connections, and disclosures require the applicable explicit authorization. Installing or invoking this skill grants none.
- Verify integration capabilities and limits using current primary documentation before relying on them. Name unresolved assumptions, including message synchronization, provider read scope, and plan eligibility.

Deliver the smallest design that addresses the changed requirement, its failure behavior, and how it will be verified. Proceed to implementation only within the requested scope; planning requests remain planning requests.

## Provenance

Adapted from Lauren Tan's MIT-licensed pstack: principle-model-the-domain, principle-boundary-discipline, principle-make-operations-idempotent, and the interface-first intent of architect. See PSTACK-LICENSE.txt in the parent skills directory. Upstream multi-model orchestration and runtime-specific commands are not required here.

Reviewed upstream revision: `190d28736eff128ec94f502a22c7fe0c4b56cd37`. Source: https://github.com/cursor/plugins/blob/190d28736eff128ec94f502a22c7fe0c4b56cd37/pstack/skills/
