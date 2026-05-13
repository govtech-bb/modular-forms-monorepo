---
name: registry-builder-ui
description: Active task — implement the /builder route with three-panel recipe builder UI consuming the registry API and @govtech-bb/form-builder types
metadata:
  type: project
---

## Task: Build the `/builder` Route in `apps/web`

A new shared package `@govtech-bb/form-builder` exists at `packages/form-builder/src/index.ts` with alias `@govtech-bb/form-builder`. Use it for all types — do not define your own.

The backend API endpoints (`GET /registry`, `GET /registry/primitives`, etc.) are being built in parallel by another agent. Build the UI against these endpoint contracts — use the types from `@govtech-bb/form-builder` as the contract.

**Why:** The recipe builder dramatically improves the speed of creating new form recipes by providing a visual, interactive composition interface instead of hand-authoring JSON.

**How to apply:** Follow existing `apps/web` patterns for routing, data fetching, and component structure throughout.

---

## What `@govtech-bb/form-builder` provides

```typescript
// Registry item types
import type {
  RegistryCatalog, PrimitiveRegistryItem, BlockRegistryItem, RegistryItem
} from '@govtech-bb/form-builder';

// Draft state types + reducer actions
import type {
  RecipeDraft, RecipeStepDraft, RecipeFieldDraft, RecipeDraftAction
} from '@govtech-bb/form-builder';

// Dynamic form generation metadata
import type { BuilderMetadata } from '@govtech-bb/form-builder';

// Validation rule and behaviour descriptors
import { VALIDATION_RULE_DESCRIPTORS, BEHAVIOUR_TYPE_DESCRIPTORS, EQUALITY_OPERATOR_OPTIONS } from '@govtech-bb/form-builder';

// API envelopes
import type { RecipeValidateRequest, RecipeValidateResponse, RecipePreviewResponse } from '@govtech-bb/form-builder';

// Serialization utilities (fully implemented)
import { serializeRecipeDraft, deserializeRecipe } from '@govtech-bb/form-builder';

// Ref utilities
import { isBlockRef, refLabel, buildComponentRef, buildBlockRef } from '@govtech-bb/form-builder';
```

---

## Files to create

### API layer
```
apps/web/src/lib/api/registry.ts     ← all fetch functions for registry endpoints
```

### Route + state
```
apps/web/src/routes/builder/
  index.tsx                           ← route entry, RecipeDraftProvider wrapper
  _state/
    recipe-draft.reducer.ts           ← pure reducer implementing all RecipeDraftAction cases
    recipe-draft.context.tsx          ← context + provider + useRecipeDraft() hook
```

### Components
```
apps/web/src/routes/builder/_components/
  BuilderLayout.tsx                   ← three-panel shell
  RegistryBrowser/
    index.tsx                         ← left panel — tabbed primitive/block/custom list
    PrimitiveCard.tsx
    BlockCard.tsx
    RegistrySearch.tsx
  RecipeCanvas/
    index.tsx                         ← center panel — list of step cards
    StepCard.tsx
    FieldChip.tsx
    StepBehaviourEditor.tsx
  PropertyPanel/
    index.tsx                         ← right panel — field override config
    FieldOverridesForm.tsx
    ValidationRuleEditor.tsx
    BehaviourEditor.tsx
    BlockOverridesForm.tsx
  RecipeToolbar.tsx                   ← top bar: validate / preview / save / load
```

---

## API layer: `apps/web/src/lib/api/registry.ts`

Follow the same pattern as `apps/web/src/lib/api/forms.ts`. All functions hit `VITE_API_URL`. All API responses are wrapped in `{ status, message, data, statusCode }` — unwrap `.data` before returning.

```typescript
export async function fetchRegistryCatalog(): Promise<RegistryCatalog>
export async function fetchPrimitives(): Promise<PrimitiveRegistryItem[]>
export async function fetchBlocks(): Promise<BlockRegistryItem[]>
export async function fetchRegistryItem(ref: string): Promise<RegistryItem>
export async function fetchBuilderMetadata(): Promise<BuilderMetadata>
export async function validateRecipe(req: RecipeValidateRequest): Promise<RecipeValidateResponse>
export async function previewRecipe(recipe: ServiceContractRecipe): Promise<ServiceContract>
```

---

## Route entry: `apps/web/src/routes/builder/index.tsx`

- Use `createFileRoute('/builder')` — follow the pattern in `apps/web/src/routes/forms/index.tsx`
- Route loader: call `fetchRegistryCatalog()` and `fetchBuilderMetadata()` in parallel via `Promise.all`
- Component: wrap with `<RecipeDraftProvider>` + `<BuilderLayout>`
- Use TanStack Query with `staleTime: Infinity` for registry data (it doesn't change at runtime)

---

## Draft state: `recipe-draft.reducer.ts`

Pure reducer implementing every `RecipeDraftAction` case. No side effects.

```typescript
export function recipeDraftReducer(state: RecipeDraft, action: RecipeDraftAction): RecipeDraft
```

Cases to implement:
- `ADD_STEP` — append to `state.steps`
- `REMOVE_STEP` — filter by `stepId`
- `UPDATE_STEP_META` — patch `title` / `description` on matching step
- `SET_STEP_BEHAVIOURS` — replace `behaviours` array on matching step
- `ADD_FIELD` — append `RecipeFieldDraft` to matching step's `fields`
- `REMOVE_FIELD` — filter by `fieldDraftId` (`_id`) within matching step
- `UPDATE_FIELD_OVERRIDES` — replace `overrides` on matching field within matching step
- `REORDER_STEPS` — reorder `state.steps` to match `orderedIds` (by `stepId`)
- `REORDER_FIELDS` — reorder matching step's `fields` to match `orderedIds` (by `_id`)
- `LOAD_DRAFT` — replace entire state
- `RESET` — return empty draft: `{ formId: '', title: '', steps: [], processors: [] }`

---

## Draft context: `recipe-draft.context.tsx`

```typescript
export function RecipeDraftProvider({ children }: PropsWithChildren): JSX.Element
export function useRecipeDraft(): { draft: RecipeDraft; dispatch: Dispatch<RecipeDraftAction> }
```

---

## BuilderLayout: three-panel shell

```
┌──────────────────────────────────────────────────────────────────────┐
│  RecipeToolbar (full width top bar)                                   │
├──────────────────┬───────────────────────────────┬───────────────────┤
│  RegistryBrowser │       RecipeCanvas             │  PropertyPanel    │
│    (280px)       │       (flex-1)                 │    (320px)        │
└──────────────────┴───────────────────────────────┴───────────────────┘
```

Panels communicate via `RecipeDraftContext`:
- RegistryBrowser dispatches `ADD_FIELD`
- RecipeCanvas dispatches `REMOVE_FIELD`, `REORDER_FIELDS`, `REORDER_STEPS`, `REMOVE_STEP`, `ADD_STEP`
- PropertyPanel dispatches `UPDATE_FIELD_OVERRIDES`, `SET_STEP_BEHAVIOURS`, `UPDATE_STEP_META`

Use local state (useState) in the layout to track `selectedFieldId: { stepId, fieldDraftId } | null` — passed down to PropertyPanel.

---

## RegistryBrowser (left panel)

- Three tabs: **Primitives** | **Blocks** | **Custom** (custom tab hidden if `catalog.custom` is empty)
- `RegistrySearch`: debounced text filter on `label` and `fieldId`/`blockId`
- `PrimitiveCard`: shows `label`, `htmlType` badge, "Add to step" button. Clicking opens PropertyPanel inspect mode.
- `BlockCard`: shows `label`, version badge, expandable list of constituent `PrimitiveCard` (read-only). "Add to step" button.
- "Add to step" dispatches `ADD_FIELD` to the currently active step. If no step exists, show a tooltip: "Create a step first".
- Use `refLabel()` and `isBlockRef()` from `@govtech-bb/form-builder` for display logic.
- For `_id`, generate via: `` `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` ``

---

## RecipeCanvas (center panel)

- Lists `draft.steps` as `StepCard` components
- `StepCard` shows: stepId chip, editable title, list of `FieldChip` per field, "Add field" shortcut, delete step button
- `FieldChip` shows: `refLabel(field.ref)`, `htmlType` or "block" badge, edit icon (selects for PropertyPanel), remove icon (dispatches `REMOVE_FIELD`)
- "Add step" button at bottom: dispatches `ADD_STEP` with a generated stepId (`step-${draft.steps.length + 1}`) and empty title prompt
- `StepBehaviourEditor`: simple list of current step behaviours with add/remove. Uses `BEHAVIOUR_TYPE_DESCRIPTORS` filtered to `scope === 'step' || scope === 'both'`.
- For drag-and-drop reordering: check if `@dnd-kit/sortable` is installed in `apps/web/package.json`. If not, use simple up/down arrow buttons that dispatch `REORDER_STEPS` / `REORDER_FIELDS` instead.

---

## PropertyPanel (right panel)

Renders when a field is selected (`selectedFieldId` is set).

**For `kind === 'component'`** — renders `FieldOverridesForm`:
- Text inputs for: `label`, `hint`, `placeholder`
- Checkbox for: `isDisabled`, `isHidden`
- Width select for: `ui.width` — options: short / medium / long
- `multiple` checkbox (only shown for `htmlType === 'select'` or `htmlType === 'file'`)
- `OptionsEditor` (only shown for `htmlType` in `['checkbox', 'radio', 'select']`) — add/remove `{ label, value }` pairs
- `ValidationRuleEditor` — see below
- `BehaviourEditor` — see below

**For `kind === 'block'`** — renders `BlockOverridesForm`:
- Lists each block element field with an expandable `FieldOverridesForm` (without `ValidationRuleEditor` or `BehaviourEditor` — block elements don't support those in overrides)

**`ValidationRuleEditor`:**
- "Add rule" `<select>` populated from `VALIDATION_RULE_DESCRIPTORS`, filtered to rules where `applicableHtmlTypes === 'all'` OR includes the current field's `htmlType`
- Each active rule renders its `params` as typed inputs: `'text'` → `<input type="text">`, `'number'` → `<input type="number">`, `'boolean'` → `<input type="checkbox">`, `'fieldRef'` → `<select>` of fieldIds in current step, `'stepRef'` → `<select>` of stepIds in draft, `'string[]'` → comma-separated text input
- Rules are removable

**`BehaviourEditor`:**
- "Add behaviour" `<select>` from `BEHAVIOUR_TYPE_DESCRIPTORS` filtered by scope (`'field'` or `'both'` when editing a field)
- `operator` params render as `<select>` from `EQUALITY_OPERATOR_OPTIONS`
- `fieldRef` params render as `<select>` of fieldIds in current step
- `stepRef` params render as `<select>` of stepIds in draft

On any change: dispatch `UPDATE_FIELD_OVERRIDES`.

---

## RecipeToolbar (top bar)

Four actions:

1. **Validate** — `serializeRecipeDraft(draft)` → call `validateRecipe()` → show inline issue count badge on toolbar; on click show issues panel
2. **Preview** — `serializeRecipeDraft(draft)` → call `previewRecipe()` → open modal with pretty-printed JSON of the hydrated `ServiceContract`
3. **Save** *(stub for now)* — show a "coming soon" toast. The `POST /form-definitions` endpoint doesn't exist yet.
4. **Load** *(stub for now)* — show a "coming soon" toast. Requires a raw-recipe endpoint that doesn't exist yet.

Also show: recipe `formId` input (editable inline) and `title` input.

---

## Existing files to read before building

- `apps/web/src/routes/forms/index.tsx` — route file structure pattern
- `apps/web/src/routes/__root.tsx` — root route layout
- `apps/web/src/lib/api/forms.ts` — API call pattern to mirror
- `apps/web/src/components/` — existing UI primitives to reuse
- `apps/web/package.json` — check for @dnd-kit, lucide-react, or other useful deps already installed

---

## Constraints

- No `any` types.
- All path aliases used — never relative cross-package imports.
- Handle loading, error, and empty states in all data-dependent components.
- Do not modify anything outside `apps/web/src/`.
- Do not hardcode registry data — all registry knowledge comes from the API responses.
