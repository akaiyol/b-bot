# b-bot — Implementation and Validation

Updated: 2026-10-25. Product authority: [REQUIREMENTS.md](REQUIREMENTS.md).

Status: feasibility review completed; account integrations and end-to-end behavior are **not validated**. The repository contains requirements, development skills, and a local preflight script. It has no working bot or connected credentials. This revision replaces the earlier Gmail-only Cloud Run/Sheets/SMS proposal; jobs, Sheets, and SMS are outside the current implementation scope.

## 1. Validation findings

“Documented” means supported by primary documentation, not proven on this account. “Local check” means observed on this Mac. Proposed controls remain requirements until implemented and exercised.

Platform findings date to October 22; local prerequisites were rerun successfully October 25, with the bridge still absent. The October 25 revision adds engineering research in section 9 and changes the preferred account approach to the owner's existing session. No account integration has been validated.

| Area | Evidence and finding | Readiness / consequence |
| --- | --- | --- |
| Mac prerequisites | Local: macOS 26.4.1, arm64, Node 24.15.0, Swift 6.3.2; Messages app present; System Integrity Protection enabled. | Adequate development prerequisites. No sign-in or permission status inferred. |
| Local Apple SDK | A Swift typecheck passed for EventKit calendar/reminder access methods, without executing them. | API surface available; permission prompts, records, and iCloud sync untested. |
| iMessage bot identity | Apple supports an Apple Account email for Messages. A different bot account is not the same account as the owner's personal Messages sync. [Apple setup](https://support.apple.com/guide/messages/set-up-messages-ichte16154fb/mac) · [iCloud sync](https://support.apple.com/en-gb/guide/icloud/mm0de0d4528d/icloud) | Prefer the owner's existing account/session for source access. A self-conversation is the first interface experiment, not a validated bot identity. Do not change the owner's sign-in. A separate bot account is only a fallback requiring an owner decision. |
| iMessage bridge | The standalone `imsg` CLI documents local history/watch, a resume cursor, and AppleScript sends without private send APIs. [Project](https://github.com/openclaw/imsg) · [Send behavior](https://github.com/openclaw/imsg/blob/main/docs/send.md) | Preferred candidate for a small proof, not yet installed or tested. It needs Full Disk Access for reads and Messages Automation for sends. Account isolation remains unresolved. |
| BlueBubbles alternative | Documented local database reads and AppleScript basic sends; broader private features are optional. Its setup also introduces additional configuration. [Server](https://docs.bluebubbles.app/server) · [Setup](https://docs.bluebubbles.app/server/installation-guides/manual-setup) | Not the default for this proof. Do not disable SIP, follow permissive cloud database rules, or expose a bridge publicly to complete setup. Current-Mac compatibility has not been demonstrated. |
| Sleep and restart | A local process cannot act while the Mac is asleep/off. `imsg` documents replay from a saved row cursor. [Quickstart](https://github.com/openclaw/imsg/blob/main/docs/quickstart.md) | Durable catch-up is feasible, but synchronization, edits/deletes, and restart behavior need live tests. Do not guarantee complete history recovery. |
| ChatGPT subscription | Official Sign in with ChatGPT supports eligible local personal apps and plan-backed requests. It grants no ChatGPT conversation/memory access. [Overview](https://developers.openai.com/siwc/token-sharing-open-source) | Candidate model authorization; this account's consent, available models, renewal, and limits are untested. No credential reuse from Siri or existing Codex sessions. |
| Model route limitations | The current plan-backed route requires streaming and `store:false`; hosted MCP, native computer use, and several request fields are unsupported, including `max_output_tokens`. [Limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) | Harness must own history and local adapters. Do not promise a provider-enforced output-token cap on this route or assume full API parity. |
| Calendar and Reminders | EventKit has no read-only grant: reading requires full access, including write capability. [Apple access model](https://developer.apple.com/documentation/eventkit/accessing-the-event-store) · [macOS API changes](https://developer.apple.com/documentation/technotes/tn3153-adopting-api-changes-for-eventkit-in-ios-macos-and-watchos) | A small Mac helper with a stable identity/usage descriptions is required. “Read-only” is our enforced operation policy, not an OS scope. Account data must be available in that helper's session. |
| Gmail | `gmail.readonly` supports reading; `gmail.modify` includes compose/send. Testing refresh tokens generally expire after seven days; personal-use verification exceptions exist. [Scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) · [Token lifecycle](https://developers.google.com/identity/protocols/oauth2/) · [Verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) | Start with readonly, no sending/draft endpoint. Mailbox identity, OAuth configuration, bounded backfill, and recovery need live validation. |
| Restaurants | OpenTable directs API users through partner onboarding and documents reservation links. [Partner FAQ](https://www.opentable.com/restaurant-solutions/api-partners/faqs/) | First version provides current recommendations and booking links. Automatic submission is deferred until provider access and confirmation behavior are proven. |
| Discord | Bots can use allowed server channels; automating a personal account is prohibited. [Permissions](https://docs.discord.com/developers/topics/permissions) · [Account policy](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots) | Personal DMs with friends are excluded from the standard bot design. Exact requested chat type remains open; Discord is not a launch dependency. |
| 1Password | Optional approved-login integration, not authorization for actions after sign-in. [Product announcement](https://1password.com/blog/1password-for-ai-agents) | Custom b-bot compatibility is unconfirmed; account region and partner support must be checked before adoption. Not required for the first proof. |
| Safety, memory, cost, persistence | No implementation exists to exercise these controls. Device encryption was not confirmed: `fdesetup status` returned an unknown-volume error. | All behavior gates below remain pending. Do not store live personal data until storage protection and retention are settled. |

Local prerequisite checks are repeatable with `node scripts/preflight.mjs`. It performs no network calls, reads no personal records, requests no privacy permissions, and sends no messages. Its output is not a product-readiness verdict.

## 2. Smallest viable architecture — proposal

Start with the existing Mac while awake. No iPhone app, separate phone number, paid cloud service, or MCP server is required for the first proof. Continuous operation remains an owner decision.

| Component | Proposed responsibility |
| --- | --- |
| Node 24 / TypeScript harness | One local coordinator, explicit tool registry, scheduling, routing, pause/status controls, bounded calls. |
| SQLite | Task state, source cursors, proposals, memory, usage reservations, and notification outbox. Node's SQLite API availability is checked locally; recovery behavior must be tested in our implementation. |
| Messages adapter | Candidate: pinned, reviewed `imsg` release, invoked with argument arrays. Only a dedicated allowlisted owner conversation; no model access to a generic CLI or its unrestricted send operation. |
| Swift EventKit helper | Narrow, explicit commands for chosen calendars/lists. No changes until the relevant write capability is approved. Runs in the session holding the authorized data. |
| Model adapter | Official local-app ChatGPT authorization if eligible. A separately billed API is an explicit alternative, never an automatic fallback. |
| Gmail adapter | Readonly OAuth, recent-mail processing, source evidence, incremental synchronization. |
| Identity and memory | Small relevant context assembled from REQUIREMENTS.md's voice and confirmed owner memory; no bulk transcript injection. |
| Service lifecycle | LaunchAgent after interactive setup is proven; starts within the correct logged-in user session. Logout, reboot, locked/unlocked state, and fast user switching are explicit tests. |

New primary-source finding (October 25): Anthropic documents an official Claude Code iMessage channel using the existing account's self-chat, with Bun, Full Disk Access, Messages Automation, and a running authenticated Claude Code session. This is an evaluation candidate before creating another account or buying hosted transport; adopting Claude Code is a model/runtime decision, not an automatic change to the ChatGPT preference. Official setup uses `/plugin install imessage@claude-plugins-official` and `claude --channels plugin:imessage@claude-plugins-official`, rather than the MindStudio guide's unverified notification settings. [Official channels guide](https://code.claude.com/docs/en/channels)

The reviewed plugin source filters recently sent echoes in self-chat, which provides a concrete approach to loop prevention but does not prove the owner's duplicate-display issue is fixed. It initializes its polling cursor to the latest database row at startup: messages already synchronized before startup are not automatically replayed. Durable catch-up, fixed owner-only outbound enforcement, attachment exclusions, history scope, and bounded execution still require review and tests before b-bot adoption. Broad macOS access is not narrowed by a chat allowlist. [Plugin README](https://github.com/anthropics/claude-plugins-official/blob/main/external_plugins/imessage/README.md) · [Source](https://github.com/anthropics/claude-plugins-official/blob/main/external_plugins/imessage/server.ts)

Current experiment result (owner-reported, October 25): texting self from the Mac produces a notification and duplicate-looking messages on the iPhone. The underlying message records have not been inspected; do not assume whether this is a display effect or duplicate events. Pause automated self-chat replies pending routing investigation.

Apple documents additional email addresses for Messages, not delegated subaccounts: these addresses belong to the same Apple Account and can also be used to sign in. A dedicated address/device routing experiment is a candidate, not evidence of isolation or a fix for duplication. [Apple email addresses](https://support.apple.com/en-ie/102529)

OpenAI's Apple Messages plugin can read/search chats and send through Messages on an Apple Silicon Mac in Codex or ChatGPT Work, with send approval by default. It explicitly does not provide remote interaction with ChatGPT through Messages, so it may help test data access but does not replace b-bot's inbound transport/harness. Account availability and permissions remain untested. [Official plugin documentation](https://learn.chatgpt.com/docs/plugins#use-apple-messages-from-codex)

Preferred first experiment: use the owner's existing Apple Account and macOS session. Manually test a dedicated self-conversation between iPhone and Mac before bridge installation. Confirm which chat identity and message records appear, whether synchronization creates duplicates, and whether phone commands can be distinguished from bot outputs without relying only on inbound/outbound direction. A contact label does not create an independent bot sender. No separate account or macOS user is required for this experiment.

If manual behavior is suitable, review and pin the bridge, obtain the specific permissions, and build a deterministic echo proof limited to that conversation. Persist processed message IDs and bot-output references; use an explicit command marker for the proof, reject unmarked records, and reconcile ambiguous sends before retrying. Test loops, duplicates, sleep/wake, restart, and wrong-chat rejection. If the bridge cannot distinguish commands and its own outputs reliably, stop automated replies and ask the owner to choose an alternative; do not silently introduce another account. Personal conversation reading remains separately selected and authorized even when the same session can access it.

Use direct adapters first. Add MCP only for a specific vetted connector that saves work. Use one bounded model call for routine language tasks, with a stronger model only when ambiguity justifies it. Do not require persistent specialist agents or universal model review.

## 3. Core state and correctness contract

All records are scoped to the configured owner and account. Suggested records:

- `source_event`: provider/account, stable event ID, source timestamp, cursor, content fingerprint, processing result. Ingest source events durably before advancing the cursor.
- `task`: task ID, source event, requested action, arguments, expiry, revision, status, attempts, lease. Separate commands from conversational observations; another person's text never creates authorization.
- `approval`: one-use action ID, owner identity, exact arguments/hash, expected source revision, expiry, consumed state. A generic “yes” must not approve a different or revised action.
- `outbox`: stable event ID, fixed destination reference, short content, expiry, transport reference, attempts, accepted/delivered/failed/unknown state.
- `memory`: fact, source, confirmed timestamp, relevance/expiry where needed, deleted state. Plans and completed milestones remain distinct.
- `usage`: root task and parent/child request IDs, model/route, budget reservation, actual usage, uncertain outcome, policy/prompt/tool versions, duration, and termination reason. Keep redacted metadata rather than full prompts or source bodies.

Task states: `queued`, `running`, `awaiting_clarification`, `awaiting_approval`, `completed`, `retryable_failed`, `outcome_unknown`, `cancelled`, `expired`. Define permitted transitions in code, including reconciliation after a process crash. Leases and uniqueness constraints prevent two workers claiming the same action; they do not make external services exactly-once.

Reconcile ambiguous external results before retrying. No fallback recipient, account, service, time slot, or paid route. A send accepted by the local transport is not proof the owner received it. Exclude outbound bot messages from ingestion to prevent loops. Handle edits, removed messages, and stale cursors conservatively; a changed plan invalidates an unexecuted proposal.

For Gmail, the initial mailbox window is a frozen 60-day interval whose dates are shown during setup. Scope grants remain mailbox-wide. Bound retrieval and recovery in code, suppress historical delivery alerts, and avoid whole-thread retrieval. Expired history cursors require a bounded deduplicated rescan. [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync)

## 4. Security boundaries

- Pin the owner account, exact self-chat identity, permitted command pattern, and outbound destination outside model-writable data. Validate participant membership and account identity immediately before sending; self-chat commands may be marked outgoing, so direction alone is insufficient authentication or loop prevention. Reject group chats, wrong senders, unknown identities, and unapproved attachments for the first proof.
- The model receives data and proposes structured actions. It cannot invoke a shell, select arbitrary recipients, retrieve secrets, create tools, or change policy. Parse external inputs and schema-check model outputs at boundaries; verify extracted facts against evidence.
- Reject credentials, authentication codes, payment details, and unnecessary sensitive source content from model context and logs. Treat email/website instructions as untrusted text. No automatic loading of tracking pixels, attachments, or arbitrary URLs from email.
- Store authorization tokens in macOS Keychain with runtime-specific access, not plaintext configuration, prompts, Git, or backups. Persist only opaque credential references. Local helper communication must authenticate the caller and expose only permitted operations; no public HTTP listener is required.
- Grant privacy access to the narrow helper identity where macOS permits it, rather than a general model/shell process. Full Disk Access and Automation still grant broader power than our task policy: compromise of the privileged helper remains a residual risk. Test actual TCC attribution after packaging and restart.
- Gmail writes, unsubscribe, restaurant submissions, invites, purchases, and payments remain disabled until their separate action/authorization gates pass. `gmail.modify` cannot provide a token-level no-send guarantee. Keep email writes manual initially rather than claiming an allowlisted tool removes that residual risk.
- Calendar/Reminders writes must reject unapproved calendars/lists, other people's attendee addresses, stale arguments, and changes outside the approved action. No invitations or notifications to others, including through shared resources, without the relevant exception.
- A detected restaurant commitment triggers a private proposal. The initial version returns a booking link; it does not submit, hold inventory, or enter payment details. Later submissions require exact terms and independent provider confirmation. Login approval is not booking approval.
- Provide separate pause controls for ingestion, models, notifications, and writes. Revocation must prevent pending work from executing; preserve a local status/error view when messaging is unavailable.

## 5. Memory, privacy, and proposed defaults

These are setup proposals, not accepted provider-retention guarantees. Agree on the policy before live data ingestion.

| Data | Proposed treatment |
| --- | --- |
| Raw mail/message bodies | Transient processing only; no full-history mirror; attachments excluded initially. |
| Profile and milestone memory | Explicit owner saves or confirmed proposals; inspect, correct, and forget through owner controls. Retain until deletion or configured expiry. |
| Task evidence | Minimum excerpt/source reference; completed task evidence expires after 90 days unless owner keeps it. |
| Dedupe/action identifiers | Retain while the authorized source-replay window can reproduce an event, without raw content. |
| Logs and backups | Redacted logs 14 days; protected state backup 7 days; no credentials in backups. Backup encryption/restore must be proven. |

SQLite is not automatically encrypted. Verify FileVault or an equivalent storage protection before placing personal data on disk; protect database and backups with owner-only filesystem access. Deletion removes active records and derived indexes, invalidates cached context, and expires backup copies under the disclosed policy. It cannot retract information already sent to a model provider or device.

Model calls may transmit necessary selected content to the approved processor. `store:false` is not a promise of zero provider retention. Review the applicable route/account data policy before authorization. Identity never alters permissions or silently changes itself. No existing ChatGPT memory is imported automatically.

## 6. Cost and operational bounds

Before model-connected operation, choose the owner-approved model/usage budget and any paid-services budget. Default paid fallback and credit use to off. Do not buy a number, provision cloud resources, or connect paid place APIs as part of validation.

- Local bridge communication avoids SMS rental/segment fees; electricity, internet, hardware availability, and model allowance still have costs. No hosting purchase is needed for the proposed local proof.
- The ChatGPT route consumes finite shared allowance. Fetch eligible model capabilities after authorized sign-in. Cost/latency/quality selection must use representative tasks, not a model's self-reported confidence.
- Input proposal: at most 6,000 relevant text tokens per call; one concurrent model request; at most two issued model requests per root task, including workers, synthesis, review, escalation, and transport retries. Child tasks cannot reset the budget. Reject oversized context before dispatch. Cap tool execution, elapsed time, and model rounds in code; configure numeric limits before enabling each workflow.
- Provider output caps are route-specific. Plan-backed Responses currently rejects `max_output_tokens`; prompt brevity, deadlines, and stream cancellation are only best-effort bounds on generated/billed usage. Use plan controls and call admission; do not present them as a hard per-call token cap.
- Authorize no paid call without configured admission accounting. For a separately approved API route, reserve a conservative maximum using actual supported output limits and current rates. If no enforceable bound exists, disclose that limitation before enabling the route.
- Proposed nonurgent mail polling: 15 minutes while awake, bounded batches of 50. After wake, reconcile once rather than replaying every missed scheduled poll. Exact shipment “out for delivery” alerts depend on when the source email arrives; they are not live carrier tracking.
- Proposed quiet hours: 22:00–08:00 America/Toronto for proactive alerts; direct replies remain available. Coalesce repeated alerts; weekly digest timing remains an owner choice. Limit missed-run digest catch-up to one relevant digest.
- Preserve tasks and expose a paused state when limits, credentials, or providers prevent progress. Do not silently skip work or retry indefinitely. Record uncertain usage conservatively.

No recurring dollar estimate is validated: mailbox volume, chosen model entitlement, representative token lengths, and optional provider pricing are not established.

## 7. Proof sequence and release gates

Do not call an integration validated until the actual owner-approved flow passes. The immediate next step is a constrained iMessage proof, not deployment of every feature.

1. **Identity and transport:** manually validate the existing-account self-conversation on iPhone and Mac first. If suitable, review and pin a bridge release; the owner grants specific macOS permissions. Build an echo-only proof with no model or external tools, using an explicit command marker. Verify one command and one reply to the exact owner destination, including actual phone display and command/output discrimination. Test screen lock, sleep/wake, restart, and session switching; prove no group/other-recipient sends and no bot-reply loop. Persist cursor before acknowledgment; reconcile after a crash. No personal-history scan.
2. **Harness and model:** implement state, action allowlists, protected configuration, pause controls, and official sign-in. Test a minimal request, token renewal/revocation, plan-limit failure, response interruption, and absence of silent paid fallback. Prove concise replies using synthetic requests before including personal context.
3. **Memory and Apple tools:** implement owner-confirmed memory with inspect/correct/forget; validate backup expiry and storage protection. Package the EventKit helper, obtain permissions, select calendars/lists, and begin read behavior. Prove scope rejection and safe revoked-permission behavior before enabling approved personal reminders/events.
4. **Gmail usefulness:** authorize the verified readonly mailbox, show exact initial window, evaluate sanitized shipment/newsletter samples, then process a small selected live sample. Check pagination, wrong-account rejection, evidence, stale-alert suppression, OAuth expiry, history recovery, and cost admission. Review all classification failures; do not claim accuracy from a few examples.
5. **Extensions:** restaurant recommendations/booking links, then separately validated submission if access exists; selected personal Messages only after safe account/session separation; Discord only for supported contexts; 1Password only after compatible access is established. Jobs remain deferred.

Required cross-cutting evidence: wrong recipients and operations rejected; permitted cases succeed; injected source instructions cannot change policy; duplicates/reordered events and crash points do not repeat side effects; changed/expired/replayed approvals fail; cancelled/expired tasks stay inactive; uncertain results reconcile; budget limits pause work; source removal and memory deletion invalidate derived state; restore and revocation work as documented.

## 8. Remaining owner-specific setup

These facts cannot be verified from public documentation or a compiler check:

- Whether the existing-account self-conversation works reliably across iPhone and Mac. The owner has confirmed no separate bot Apple Account exists; do not require one unless this experiment fails and the owner chooses that fallback. Account credentials and verification codes stay in the provider UI.
- Exact owner iMessage handle and bot chat, selected mailbox/calendars/reminder lists/conversations, and consent for sending necessary content to the model provider.
- Mac availability expectations and acceptance of delayed alerts; the actual login/session configuration.
- ChatGPT sign-in consent, available allowance, approved spending limits, quiet hours/digest preferences, and retention/storage choices.

Do not mark these complete, connect unselected accounts, or change personal account settings by inference. Maintain this document and REQUIREMENTS.md as the only planning sources of truth; executable checks and runtime policy become authoritative for their implemented behavior.

## 9. Engineering research and adopted practices

Reviewed October 25, 2026. These are long-form engineering accounts published on X, not independent benchmarks or proof of b-bot behavior. Lauren Tan identifies her Grok Bot work in the pstack article. Thariq Shihipar's articles were published while he worked on Claude Code at Anthropic; he [announced his departure October 24](https://x.com/trq212/status/2113844051938054167). Product-specific features and performance claims do not establish support on b-bot's chosen model route.

| Engineering resource | Implication for b-bot |
| --- | --- |
| Lauren Tan, [The Complete Guide to pstack Pt.1](https://x.com/poteto/article/2094457600259842065), August 31 | Build reusable controls that exercise real behavior. Add a small diagnostic/control interface with explicit commands, structured results, safe previews, and observable outcomes as features are implemented. Map each feature to its actual verification procedure; the existing preflight is only a prerequisite check. |
| Thariq Shihipar, [Seeing Like an Agent](https://x.com/trq212/article/2027463795355095314), February 27 | Design narrow tools and clear failure responses around observed task failures. Retrieve relevant instructions and source material on demand. Do not inject every skill, document, or conversation into every request. |
| Thariq Shihipar and Sid Bidasaria, [A Harness for Every Task: Dynamic Workflows in Claude Code](https://x.com/trq212/article/2061907337154367865), June 2 | Use deterministic orchestration and fresh contexts for independent subtasks when useful. The article also warns that elaborate workflows can consume substantially more tokens. Default to one coordinator; do not build an always-running agent fleet or assume agent count improves correctness. |
| Thariq Shihipar, [Prompt Caching Is Everything](https://x.com/trq212/article/2024574133011673516), February 19 | Keep stable instructions and tool definitions ahead of changing task content where the provider supports prefix caching. A cheaper model can lose savings through cache misses and repeated context. Measure total task cost; Anthropic caching behavior is not evidence of OpenAI route parity. |
| Thariq Shihipar, [How We Use Skills](https://x.com/trq212/article/2033949937936085378), March 17 | Keep skills focused on useful procedures, scripts, and observed pitfalls. Load them selectively; keep runtime state outside versioned skill files. Existing development skills are sufficient until implemented behavior demonstrates a missing capability. |

### Delegation and context contract

- Code handles permission checks, scheduling, state transitions, deduplication, and budget admission. Routine extraction or summarization uses one bounded model request. A worker is optional for a separable task or independent review with a measurable benefit; dependent actions remain sequential.
- A fresh worker receives only its objective, allowed source references, minimum necessary evidence, scoped read tools, output schema, and remaining deadline/budget. It returns findings, evidence references, uncertainty, and failure status. Do not copy the full conversation or let a worker recursively create workers.
- Workers have no credentials, unrestricted shell, outbound messaging, calendar writes, booking submission, or policy modification. All proposed actions return to the coordinator and the same deterministic authorization gate. A fresh model context is not an operating-system security boundary; compromise of a shared privileged process remains a risk.
- The two-request default applies to the entire root task. Worker plus synthesis uses both requests; a third review or retry must pause or follow a separately configured, owner-approved experiment budget. Concurrency remains one initially. Fan-out is a later measured option, not a launch requirement.
- Assemble context from the current task revision, current constraints, relevant confirmed memories, and selected source evidence. Treat retrieved instructions as untrusted data. Persist resumable task summaries separately from personal memory, and reconstruct current permissions on resume. Recheck cancellation, source revisions, memory deletion, and approval expiry before an action; stale worker output cannot revive invalidated state.

### Verification and adoption gate

Model agreement and fresh reviewers are supporting signals, not completion evidence. Claims must trace to source records, adapter results, provider receipts, or observed state. An independent reviewer should inspect the relevant evidence and acceptance criteria, rather than only the first model's explanation. Deterministic checks remain mandatory even when review is used.

Before adopting a more elaborate workflow, compare deterministic processing, one model, and selective delegation on the same small sanitized evaluation set with a held-out portion. Include ambiguous intent, injected source instructions, stale facts, wrong recipients, missing permissions, duplicates, changed approvals, interrupted responses, and uncertain external outcomes. Record case counts and failures, useful task completion, latency, and total root-plus-child usage/cost. Where available, record cache hits. Fix any observed unauthorized action or duplicate side effect before release; zero failures in a small set is not a general safety guarantee. Adopt added agents only when the measured benefit justifies the added cost and failure modes.

### Cache and operational discipline

Version stable prompt/tool prefixes and place changing timestamps and retrieved content later where supported. Keep caches isolated by owner/account and relevant model/policy/data versions. Never widen tools for cache efficiency, retain deleted memories to preserve a cache, reuse cached approval as authority, or treat cached results as current availability. Validate chosen-route cache behavior before claiming savings. Local deletion cannot erase provider-retained data; provider retention still needs review under section 5.

Bound retries and diagnose failures before repeating a workflow. On restart, resume from durable task state and reconcile external outcomes; do not replay the whole conversation or every missed schedule. Track redacted task traces under the existing retention policy so failures and actual cost can be explained without creating a second personal-data archive.

The next implementation step remains the constrained iMessage identity/transport proof in section 7. Research does not remove the account-layout, consent, storage, or live-validation prerequisites.
