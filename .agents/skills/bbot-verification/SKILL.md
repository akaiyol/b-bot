---
name: bbot-verification
description: Verify b-bot behavior, integration changes, and correctness claims with observable evidence. Use when implementing, fixing, reviewing, or validating b-bot; do not treat planning documents as running software.
---
# b-bot verification

Derive checks from REQUIREMENTS.md and the changed behavior. Read the relevant implementation and existing checks. Select the smallest verification that could expose a meaningful failure; do not add tests that merely repeat code, prompts, headings, or constants.

## Evidence of behavior

- State the behavior being checked and the observation that would disprove it. Reproduce a reported defect before fixing when practical. Exercise the same interface the caller uses and derive expected results from the contract.
- Check actual persisted state and external results when authorized access is available. A successful request, build, model response, or mock does not establish provider completion or message delivery.
- Use local fixtures and controlled provider substitutes first for sensitive workflows. Report their limits. A live check must stay within existing account, disclosure, and external-action authorization; this skill does not grant permission to send, book, invite, or spend.
- Tests should fail if the promised effect disappears, becomes incorrect, or happens twice, and survive a refactor that preserves observable behavior. Assertions on an external request payload can verify a real boundary contract.

## Choose checks by the changed risk

For queue or write changes, cover duplicate events, restart with pending work, stale or cancelled tasks, and an ambiguous provider response at the affected failure points. Check that reconciliation cannot cause duplicate external effects.

For permission changes, demonstrate that unauthorized recipients and operations are rejected at the action boundary. Pair rejection cases with permitted cases so a broken adapter that rejects everything cannot appear correct. Include untrusted-content instructions when the change processes external text.

For integration changes, distinguish local validation, provider acceptance, provider completion, and independently observed outcome. Verify the relevant level and state which levels remain unverified.

For performance or cost claims, record the workload, successful completion rate, configuration, run count, variability, and what was actually counted. Rule out skipped work, failures, or incomparable cache conditions. Do not report estimates as measured savings.

Use existing reproducible checks before adding new tooling. Keep new scripts only when they provide a useful repeated check. Stop after the relevant checks pass unless a change, failure, or unresolved concern warrants more work.

Report what was observed, what failed, and what remains unverified. If the product does not exist yet, validate only the artifact actually created and say that runtime behavior is unverified.

## Provenance

Adapted from Lauren Tan's MIT-licensed pstack: principle-prove-it-works, principle-test-behavior-not-implementation, and principle-explain-the-number. See PSTACK-LICENSE.txt in the parent skills directory. No dependency on Cursor control skills, model panels, or automatic external actions.

Reviewed upstream revision: `190d28736eff128ec94f502a22c7fe0c4b56cd37`. Source: https://github.com/cursor/plugins/blob/190d28736eff128ec94f502a22c7fe0c4b56cd37/pstack/skills/
