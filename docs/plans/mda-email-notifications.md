# MDA Email Notifications Plan

**Status:** Draft
**Date:** 2026-05-21
**Owner:** TBD

## Goal

When a citizen submits a form, the responsible Ministry/Department/Agency (MDA) staff receive an email notification so they know a new submission needs handling. The citizen continues to receive the existing confirmation email. Both emails are derived from the form contract — no environment variables or per-form code changes required.

## Approach

**One processor, two sends.** Extend the existing `EmailProcessor` to issue up to two SES emails per submission:

- **Citizen confirmation** (unchanged) — uses `processors[].config.recipientField` to pull the citizen email from a form field; renders `submission-confirmation.hbs`.
- **MDA notification** (new) — uses `contract.contactDetails.email` as the recipient; renders a new `mda-notification.hbs` template with staff-oriented framing.

Sends run concurrently via `Promise.allSettled`. Failure isolation:

- Citizen send fails → propagate, mark processor `failed` (retried by the listener).
- MDA send fails → log and continue; the citizen still gets their confirmation and the submission row is intact.

**Alternatives considered:**

- _Separate `mda-notification` processor type._ Cleaner separation but doubles the wiring (factory, config schema, tests) for a side-effect that always travels with the email processor. Rejected.
- _Read MDA address from env vars per `formId`._ Adds ops overhead and another source of truth. Rejected — the contract is already the right home.
- _Use the same template for both recipients._ Quick, but the citizen confirmation reads oddly to staff (and vice versa). Rejected.

## Scope

### Code

- Add `contactDetails` to `EmailTemplateContext` so the processor can read it without re-fetching the contract.
- Add `submitterEmail` derivation (from `recipientField`) into a separate context the MDA template gets — the citizen's email is useful staff context.
- Concurrent two-send logic with `Promise.allSettled` and MDA failure isolation.
- Optional `processors[].config.notifyMda: false` to opt out per form.
- Optional `processors[].config.mdaSubject` to override the MDA subject line.

### Templates

- New: `apps/api/src/email/templates/mda-notification.hbs` — staff-oriented header ("New submission received: {formTitle}"), reference + timestamp + submitter email block, then the same field sections the citizen email uses.

### Contract

- Update `apps/web/contracts/master-contract.json` to include a working `processors` block: an `email` processor with a real `recipientField` (the existing email field), so master-contract becomes a working end-to-end exemplar of both flows. (`contactDetails.email` already exists on this contract.)

### Out of scope

- Fixing `example-service-contract.json` — uses dead config fields (`to`, custom `template`) the processor doesn't read. Separate cleanup.
- Configuring SES sandbox / production verification in AWS — runbook concern.
- Localising email content. Templates remain English-only for now.

## Files

**Modified:**

- `apps/api/src/email/email-body.builder.ts` — add `contactDetails` to context; add `buildMdaContext()` that includes `submitterEmail` and a staff-framed header
- `apps/api/src/forms/submissions/processors/email.processor.ts` — concurrent two-send logic
- `apps/api/src/forms/submissions/processors/email.processor.spec.ts` — extended test matrix
- `apps/api/src/email/email-body.builder.spec.ts` — coverage for new context fields
- `apps/web/contracts/master-contract.json` — add working `processors` block

**New:**

- `apps/api/src/email/templates/mda-notification.hbs`
- `docs/plans/mda-email-notifications.md` (this file)

## Test matrix

For the processor:

| `recipientField` | `contactDetails.email`   | `notifyMda`    | Expected                                                                |
| ---------------- | ------------------------ | -------------- | ----------------------------------------------------------------------- |
| set              | set                      | (default true) | Sends both.                                                             |
| set              | absent                   | (default true) | Sends citizen only; logs MDA skip.                                      |
| absent           | set                      | (default true) | Sends MDA only; logs citizen skip.                                      |
| absent           | absent                   | (default true) | Sends neither; logs both skips.                                         |
| set              | set                      | `false`        | Sends citizen only.                                                     |
| set              | set, citizen send throws | (default true) | MDA still attempted; processor returns failed.                          |
| set              | set, MDA send throws     | (default true) | Citizen still completed; processor returns completed; MDA error logged. |

## Verify

- `npx nx test api` — all green; new test cases listed above.
- `npx tsc -b` — clean (the pre-push gate).
- Manual smoke (post-merge, with SES creds): submit the master-contract, confirm two emails arrive — one to the citizen email field, one to `registrationdept@barbados.gov.bb`.

## Open questions / follow-ups

- Should `notifyMda` default to `true` (current proposal) or `false` (opt-in)? Default `true` matches "ensure emails are being sent to MDA" — opt-out via config is the safety valve.
- `example-service-contract.json` is misconfigured (uses `to`/`template` fields the processor ignores). Worth a small follow-up to either fix that contract or remove the dead config fields. Spawned as a separate task.
