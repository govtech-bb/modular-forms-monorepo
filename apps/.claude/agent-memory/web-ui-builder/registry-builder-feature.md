---
name: registry-builder-feature
description: Registry Builder UI feature — route at /builder/, components, API layer, and state shape
metadata:
  type: project
---

Builder UI implemented on branch `platform/registry-builder` (2026-05).

**Route:** `apps/web/src/routes/builder/index.tsx` — accessible via direct URL `/builder/`. No link from the citizen-facing home page.

**Loader:** fetches `GET /registry` (catalog of primitives, blocks, custom components) at route load time. The `BuilderPage` component starts with an empty `RecipeDraft` state.

**File layout (all under `apps/web/src/routes/builder/`):**
- `index.tsx` — route entry, BuilderPage, BuilderError boundary
- `-recipe-reducer.ts` — pure `recipeDraftReducer` + `emptyDraft()` factory + `makeFieldId()` helper
- `-toolbar.tsx` — BuilderToolbar: formId/title inputs, Preview/Validate buttons, status indicator
- `-step-list.tsx` — StepList sidebar: step rows, up/down reorder, add/remove
- `-step-editor.tsx` — StepEditor: stepId/title/description inputs, field rows with up/down, embedded FieldPicker palette
- `-field-picker.tsx` — FieldPicker: search, tabs (Components / Blocks), add to step
- `-validation-panel.tsx` — ValidationPanel: shows RecipeValidateResponse issues inline
- `-preview-modal.tsx` — PreviewModal: calls previewRecipeApi, shows resolved ServiceContract structure

**API layer:** `apps/web/src/lib/api/registry.ts`
- `fetchCatalog()` — GET /registry
- `validateRecipeApi(recipe)` — POST /registry/recipes/validate
- `previewRecipeApi(recipe)` — POST /registry/recipes/preview
- `buildPreviewPayload(recipe)` — wraps recipe as `{ data: recipe }` (single place for payload shape)
- `buildValidatePayload(recipe)` — wraps recipe as `{ recipe }` (matches PreviewRecipeDto)

**Styling:** `apps/web/src/styles/builder.module.css` — standalone CSS, NOT routed through designSystem switcher.

**No drag-and-drop:** up/down buttons used for reordering steps and fields (no library installed).
No auth guard on the route (open access for now).
