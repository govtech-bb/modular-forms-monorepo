---
name: registry-builder-api
description: Active task — implement RegistryBuilderModule exposing registry read endpoints and recipe utilities for the recipe builder feature
metadata:
  type: project
---

## Task: Implement `RegistryBuilderModule` in `apps/api/src/registry/builder/`

A new shared package `@govtech-bb/form-builder` has been created at `packages/form-builder/src/index.ts` and is available via the `@govtech-bb/form-builder` path alias. It provides all the response types and contracts you must use — do not define your own types for registry items or builder metadata.

**Why:** The registry builder feature needs backend endpoints so the frontend can introspect all available primitives, blocks, and custom components, and validate/preview recipes interactively.

**How to apply:** Implement the full `RegistryBuilderModule` as described below, using `@govtech-bb/form-builder` types for all response shapes.

---

## The shared package — what it exports

Import these from `@govtech-bb/form-builder`:

```typescript
// Response shapes
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  CustomRegistryItem,
  RegistryItem,
  BuilderMetadata,
  RecipeValidateRequest,
  RecipeValidateResponse,
  RecipePreviewResponse,
} from '@govtech-bb/form-builder';

// Static metadata constants
import {
  VALIDATION_RULE_DESCRIPTORS,
  BEHAVIOUR_TYPE_DESCRIPTORS,
  EQUALITY_OPERATOR_OPTIONS,
} from '@govtech-bb/form-builder';
```

---

## Files to create

All under `apps/api/src/registry/builder/`:

```
registry-builder.module.ts
registry-builder.controller.ts
registry-builder.service.ts
registry-builder.docs.ts     (Swagger decorators — follow pattern in apps/api/src/forms/form-definitions/form-definitions.docs.ts)
```

**Also update:** `apps/api/src/registry/registry.module.ts` — add `RegistryBuilderController` to `controllers` and `RegistryBuilderService` to `providers` (and `exports` if needed).

---

## Endpoint contract

All responses use `ApiResponse.success()` from `apps/api/src/common/response.ts`.

```
GET  /registry                         → ApiResponse<RegistryCatalog>
GET  /registry/primitives              → ApiResponse<PrimitiveRegistryItem[]>
GET  /registry/primitives/:fieldId     → ApiResponse<PrimitiveRegistryItem>
GET  /registry/blocks                  → ApiResponse<BlockRegistryItem[]>
GET  /registry/blocks/:blockId         → ApiResponse<BlockRegistryItem>
GET  /registry/metadata                → ApiResponse<BuilderMetadata>
POST /registry/recipes/validate        → ApiResponse<RecipeValidateResponse>
POST /registry/recipes/preview         → ApiResponse<ServiceContract>
```

---

## `RegistryBuilderService` — key responsibilities

1. **`getCatalog(): Promise<RegistryCatalog>`**
   - Iterate `BUILTIN_REGISTRY` from `apps/api/src/registry/builtins/index.ts`
   - Map each `Primitive` → `PrimitiveRegistryItem` (set `kind: 'primitive'`, compute `ref` as `"components/${primitive.fieldId}"`, set `hasOptions` to `true` for htmlType in `['checkbox', 'radio', 'select']`, set `defaultDefinition` to the raw Primitive)
   - Map each `Block` → `BlockRegistryItem` (set `kind: 'block'`, compute `ref` as `"blocks/${block.blockId}"`, set `label` to `block.blockDescription`, set `version` to `block.blockVersion`, map `elements` recursively to `PrimitiveRegistryItem[]`)
   - For custom components: call `RegistryService` (already injectable) via `resolve()` — or directly query the DB via the `CustomComponent` repo. Map to `CustomRegistryItem` shape.

2. **`getPrimitives(): PrimitiveRegistryItem[]`** — subset of above, only primitives from BUILTIN_REGISTRY

3. **`getBlocks(): BlockRegistryItem[]`** — subset of above, only blocks from BUILTIN_REGISTRY

4. **`getItem(ref: string): Promise<RegistryItem>`** — calls `RegistryService.resolve(ref)`, maps to appropriate `RegistryItem` shape, throws `NotFoundException` if null

5. **`getBuilderMetadata(): BuilderMetadata`** — return static object:
   ```typescript
   {
     validationRules: VALIDATION_RULE_DESCRIPTORS,
     behaviourTypes: BEHAVIOUR_TYPE_DESCRIPTORS,
     equalityOperators: EQUALITY_OPERATOR_OPTIONS,
   }
   ```

6. **`validateRecipe(body: RecipeValidateRequest): RecipeValidateResponse`** — call `validateFormContract(body.recipe)` from `@govtech-bb/form-types`. Map `ValidationResult` to `RecipeValidateResponse`:
   ```typescript
   if (result.ok) return { valid: true, issues: [] };
   return { valid: false, issues: result.issues };
   ```

7. **`previewRecipe(body: { recipe: ServiceContractRecipe }): Promise<ServiceContract>`** — call `this.registryService.hydrateForm(body.recipe)`. Wrap `UnresolvableComponentError` in a `BadRequestException`.

---

## DTOs needed

```typescript
// validate-recipe.dto.ts
import { IsObject } from 'class-validator';
export class ValidateRecipeDto {
  @IsObject()
  recipe: ServiceContractRecipe;
}

// preview-recipe.dto.ts
export class PreviewRecipeDto {
  @IsObject()
  recipe: ServiceContractRecipe;
}
```

---

## Key existing files to read first

- `apps/api/src/registry/registry.module.ts` — to understand what to extend
- `apps/api/src/registry/registry.service.ts` — `RegistryService` is what you inject
- `apps/api/src/registry/builtins/index.ts` — `BUILTIN_REGISTRY` and `RegistryEntry` type
- `apps/api/src/registry/builtins/blocks/` and `components/` — actual builtin data
- `apps/api/src/forms/form-definitions/form-definitions.controller.ts` — pattern to follow for controller structure
- `apps/api/src/common/response.ts` — `ApiResponse.success()` / `ApiResponse.error()`
- `packages/form-types/src/validate-form-contract.ts` — `validateFormContract()`

---

## Constraints

- No new DB migrations needed — this is read-only.
- All responses use `ApiResponse.success()` envelope.
- No `any` types.
- `@ApiTags('Registry Builder')` and `@ApiBearerAuth()` on the controller (follow existing pattern).
- Do not modify anything outside `apps/api/src/registry/`.
