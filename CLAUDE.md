# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
# Install dependencies
npm install

# Development
npm run dev:web        # Vite dev server for React frontend (port 3000)
npm run dev:api        # NestJS API in watch mode (port 3001)

# Build
npm run build          # Build all apps and packages via Nx
npx nx build web       # Build only the web app
npx nx build api       # Build only the API

# Lint / Format
npm run lint           # ESLint across all packages
npm run format         # Prettier write
npm run format:check   # Prettier check (CI)

# Database migrations (run from repo root)
npm run migration:generate -- src/database/migrations/<MigrationName>
npm run migration:run
npm run migration:revert
npm run migration:show

# Nx utilities
npx nx graph           # Visualize dependency graph
npx nx show projects   # List all projects
```

There is no test runner script at the root level; individual packages have their own Jest configs under `packages/` and `apps/api/src`.

## Environment

Copy `.env.example` files before first run:
```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Key web env vars:
- `VITE_API_URL` — API base URL (default `http://localhost:3001`)
- `DESIGN_SYSTEM` — design system variant (`basic`)
- `SKIP_CONTINUE_VALIDATION` — set `true` in dev to skip step validation on continue

## Architecture Overview

This is a Nx monorepo for Barbados government digital form services.

### Workspaces

| Path | Stack | Purpose |
|---|---|---|
| `apps/web` | React 19 + Vite + TanStack Router/Form | Citizen-facing form renderer |
| `apps/api` | NestJS + TypeORM + PostgreSQL | REST API for form definitions, drafts, submissions |
| `packages/form-types` | TypeScript + Zod | Shared schema definitions and runtime validators |
| `packages/form-conditions` | TypeScript | Condition evaluation engine (step/field show-hide) |
| `packages/form-validation` | TypeScript | Field-level validation rules engine |
| `packages/expressions` | TypeScript | Expression evaluation (used in submission processors) |

### TypeScript path aliases

Defined in `tsconfig.base.json`, available in all packages:

| Alias | Resolves to |
|---|---|
| `@govtech-bb/form-types` | `packages/form-types/src/index.ts` |
| `@govtech-bb/form-conditions` | `packages/form-conditions/src/index.ts` |
| `@govtech-bb/form-validation` | `packages/form-validation/src/index.ts` |
| `@web/types` | `apps/web/src/types/index.ts` |
| `@web/lib` | `apps/web/src/lib/form-builder/index.ts` |
| `@web/form-api` | `apps/web/src/lib/api/forms.ts` |
| `@web/components` | `apps/web/src/components` |

---

## Web App (`apps/web`)

### Data flow: contract → rendered form

1. **Route loader** (`src/routes/forms/$formId/index.tsx`) fetches a `ServiceContract` via `fetchContract(formId)`.
2. `fetchContract` calls the API (`GET /form-definitions/:id`) and runs the response through `mapContractToLocale()`, which produces a `ClientServiceContract`. The special IDs `"example"` and `"master"` load local JSON fixtures instead.
3. `buildForm(contract)` converts a `ClientServiceContract` into `FormMeta`:
   - Builds Zod validation schema and default values via `buildValidation()`.
   - Configures repeatable step state via `setupRepeatSteps()`.
   - Injects a synthetic `check-your-answers` step before `declaration`.
   - Computes `stepConditionalTargets` for reactive visible-step tracking.
4. `useForm` (TanStack Form) is initialised with `defaultValues` merged with any session-storage restoration.
5. `FormRenderer` renders the current step, handles Previous/Continue/Submit navigation.

### Field ID convention

Every field in the form state is keyed as `{stepId}_{fieldId}` (separator defined as `stepFieldIdConcactenator = "_"` in `field-mapper.ts`). Helper: `getFullFieldId(stepId, fieldId)`.

Repeatable step IDs use `{baseStepId}~{count}` (separator `repeatStepConcactenator = "~"`). So repeat instance 1 of step `applicants` is `applicants~1`.

### Step navigation and guards

`useStepGuard` (`src/hooks/use-step-guard.tsx`) enforces sequential access:
- If no step is in the URL, redirects to the first incomplete active step.
- If the current step was hidden by a condition change, redirects to the first incomplete active step.
- If a preceding step is incomplete, redirects to the first incomplete active step.
- Completed steps are tracked in `sessionStorage`.

`completeAndContinue(stepId, stepsOverride?)` marks a step complete and navigates forward. `stepsOverride` must be passed when the caller has already mutated the step list (e.g. after inserting a repeatable step) so the guard doesn't operate on a stale memoised list.

### Repeatable steps

Steps with a `repeatable` behaviour produce dynamic clones at runtime. `setupRepeatSteps` pre-generates the minimum required instances at form load. `addRepeatableStep` / `removeRepeatableStep` insert/remove clones in both `formMeta.steps` (source of truth) and the current memoised `visibleSteps` (future-state override passed directly to `completeAndContinue`).

### Visible steps

`getVisibleSteps(formMeta.steps, form)` filters steps whose `stepConditionalOn` behaviours currently pass. The route component subscribes to only the fields named in `formMeta.stepConditionalTargets` to avoid over-rendering.

### Submission

On submit, `formatDataForSubmission` transforms flat form state (`{stepId_fieldId: value}`) into nested `FormValuesByStep` (`{stepId: {fieldId: value}}`), collapses repeatable instances into arrays, and strips hidden/empty fields. `postFormSubmission` sends this to `POST /submissions` with an idempotency key.

---

## API (`apps/api`)

### Module structure

- **RegistryModule** — resolves component refs to full definitions. Builtins are always in-memory; custom components are DB-backed with a 60-second NodeCache TTL. `hydrateForm(recipe)` turns a `ServiceContractRecipe` (refs) into a full `ServiceContract`.
- **FormsModule**
  - `FormDefinitionsModule` — CRUD for stored form definitions (`GET /form-definitions`, `GET /form-definitions/:id`).
  - `SubmissionsModule` — `POST /submissions`. Runs the **submission pipeline**: expand → condition-evaluate → validate → normalize → persist → emit events → run processors.
  - `FormDraftsModule` — save/restore in-progress form sessions.
- **PaymentsModule** — EzPay webhook reconciliation and abandoned-payment cleanup.
- **ExpressionsModule** — evaluates dynamic expressions referenced by submission processors.

### Submission pipeline

`SubmissionPipelineService.run()` in `apps/api/src/forms/submissions/submission-pipeline.service.ts`:
1. **Pin version** — resolves the `ServiceContract` at the version the draft was created (or the latest).
2. **Expand** — `expandSubmission()` validates the payload shape against the contract (repeatable steps become instances).
3. **Conditions** — `evaluateFormConditions()` from `@govtech-bb/form-conditions` determines which steps/fields are active.
4. **Validate** — `validateFields()` from `@govtech-bb/form-validation` checks all active field values.
5. **Normalize** — `normalizeForStorage()` strips hidden data before persisting.
6. **Persist + emit** — saved as `FormSubmission`, then `submission.created` event triggers `SubmissionProcessorListener`.

Processors (email, spreadsheet, OpenCRVS, payment) are dispatched from the listener.

### API response envelope

All endpoints return `{ status, message, data, statusCode, meta? }` via `ApiResponse.success()` / `ApiResponse.error()` from `apps/api/src/common/response.ts`.

### Database

TypeORM with PostgreSQL. Entities live in `apps/api/src/database/entities/`. Migrations in `apps/api/src/database/migrations/`. The TypeORM CLI datasource is `apps/api/typeorm.config.ts`. Never enable `DB_SYNCHRONIZE=true` in production.

---

## Shared packages

### `@govtech-bb/form-types`

Zod schemas and inferred TypeScript types for all domain objects: `ServiceContract`, `FormStep`, `Primitive` (all HTML field types), `Behaviour` (conditional, repeatable, sharedFields), `ValidationRule`. The `serviceContractSchema` is the canonical validator for form definitions entering the system.

### `@govtech-bb/form-conditions`

`evaluateFormConditions(contract, values)` — returns which steps and fields are active/hidden given the current submission values. Used by both the API pipeline (server-side gating) and the web renderer (client-side step visibility).

### `@govtech-bb/form-validation`

`validate({ primitives, stepValues })` — runs all validation rules for a set of fields. Used by the API pipeline; the web app uses a wrapper in `validation-builder.ts` that integrates with TanStack Form's `onChange`/`onBlur` lifecycle.
