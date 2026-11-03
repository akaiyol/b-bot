---
name: bbot-cost-efficiency
description: Assess and reduce b-bot development overhead, model usage, runtime expense, and unnecessary complexity while preserving correctness. Use for model selection, polling, context, retries, budgets, and measured optimization.
---
# b-bot cost and efficiency

Use REQUIREMENTS.md for product constraints and the applicable IMPLEMENTATION.md settings for proposed technical limits. Separate estimates, configured limits, and observed usage. Do not change approved budgets or create paid resources without authorization.

## Development effort and context

- Search filenames and relevant symbols first; read needed sections and summarize long outputs. Reuse verified findings rather than reloading whole repositories or histories. Do not omit evidence needed to make a decision.
- Use one agent by default. Delegate only when explicitly authorized and the expected benefit justifies additional context and model use. No mandatory model panels, perpetual reviewers, or repeated runs after the evidence is sufficient.
- Consolidate repeated decisions and remove obsolete paths. Favor a small change over new abstraction layers, frameworks, services, and documentation. Keep product and implementation decisions in their existing authoritative files.

## Runtime model use

- Use deterministic routing, parsing, filtering, deduplication, and stored results where they reliably satisfy the requirement. Use a model for language interpretation and synthesis that actually needs it.
- Send only relevant, minimal source content. Bound input length, output length, tool calls, and attempts. Cache reusable results using source version and relevant configuration; invalidate stale results and respect retention rules.
- Choose the least expensive available model that meets the required correctness on representative tasks. Escalate ambiguous cases selectively; do not assume a cheaper model is cheaper per successfully completed task.
- Verify current official pricing, plan eligibility, model availability, and hosting limits before estimating or selecting a provider. Subscription-backed calls still consume finite allowance; account for shared limits and never silently switch to a paid fallback.

## Budget and operational cost

- Distinguish development usage, runtime model usage, hosting/storage, messaging, and third-party APIs. Estimate from event volume, calls per event, token sizes, retry rates, and provider billing units. State assumptions and include failure/retry overhead.
- Before live paid automation, configure enforceable workload limits, retry/backoff limits, concurrency, and an owner-approved spending budget. Use provider spending controls where available; disclose when enforcement is only an estimate or local cap.
- At a limit, preserve queued tasks, expose the paused or deferred state, and notify the owner only through an authorized channel. Do not discard tasks or retry indefinitely.
- Match polling frequency to required latency and provider limits. Use incremental synchronization and batching when appropriate; add push infrastructure only when its latency or cost benefit justifies maintenance.
- Measure successful task completion, correctness, latency, and cost together before optimizing. A reduction in calls is not a saving if tasks are skipped or results become unreliable.

## Provenance

Adapted from Lauren Tan's MIT-licensed pstack: principle-laziness-protocol, principle-guard-the-context-window, and principle-explain-the-number. b-bot budgeting and provider controls are local additions, not claims about upstream capabilities. See PSTACK-LICENSE.txt in the parent skills directory.

Reviewed upstream revision: `190d28736eff128ec94f502a22c7fe0c4b56cd37`. Source: https://github.com/cursor/plugins/blob/190d28736eff128ec94f502a22c7fe0c4b56cd37/pstack/skills/
