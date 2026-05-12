---
name: form-builder-package
description: @govtech-bb/form-builder package — types, schemas, and utils for the registry builder UI
metadata:
  type: project
---

Package at `packages/form-builder/src/index.ts`. Added to web app dependencies in 2026-05.

Key exports:
- `RecipeDraft`, `RecipeStepDraft`, `RecipeFieldDraft`, `RecipeDraftAction` — UI state types
- `RegistryCatalog`, `PrimitiveRegistryItem`, `BlockRegistryItem`, `CustomRegistryItem` — catalog/palette types
- `RecipeValidateResponse`, `RecipePreviewRequest` — API request/response types
- `BuilderMetadata`, `ValidationRuleDescriptor`, `BehaviourTypeDescriptor` — metadata for rendering config panels
- `serializeRecipeDraft(draft, meta?)` — converts UI RecipeDraft → wire ServiceContractRecipe (strips `_id`, maps `fields` → `elements`)
- `deserializeRecipe(recipe)` — converts wire ServiceContractRecipe → UI RecipeDraft (injects `_id`)
- `parseRef`, `buildComponentRef`, `buildBlockRef`, `isBlockRef`, `isComponentRef`, `refLabel` — ref string utilities

The `RecipeDraftAction` discriminated union is the complete set of mutations, designed for a reducer pattern.

**To add to web app:** add `"@govtech-bb/form-builder": "*"` to `apps/web/package.json` dependencies and add `{ "path": "../../packages/form-builder" }` to `apps/web/tsconfig.json` references.
