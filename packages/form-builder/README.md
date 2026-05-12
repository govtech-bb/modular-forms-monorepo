# @govtech-bb/form-builder

Contract layer for the recipe-builder feature. Both the backend API agent and
the frontend UI agent import from this package to work independently against a
stable, versioned interface.

This package is framework-agnostic: it imports nothing from `apps/` and has no
runtime dependency on NestJS, React, or any UI library.

---

## Dependency

This package depends on `@govtech-bb/form-types` for all base domain types
(primitives, blocks, behaviours, processors, service contract shapes).

---

## Exports overview

### Types

| Export                     | File                      | Consumer  |
| -------------------------- | ------------------------- | --------- |
| `PrimitiveRegistryItem`    | `types/registry.types.ts` | API + Web |
| `BlockRegistryItem`        | `types/registry.types.ts` | API + Web |
| `CustomRegistryItem`       | `types/registry.types.ts` | API + Web |
| `RegistryItem`             | `types/registry.types.ts` | API + Web |
| `RegistryCatalog`          | `types/registry.types.ts` | API + Web |
| `RecipeFieldDraft`         | `types/builder.types.ts`  | Web       |
| `RecipeStepDraft`          | `types/builder.types.ts`  | Web       |
| `RecipeDraft`              | `types/builder.types.ts`  | Web       |
| `RecipeDraftAction`        | `types/builder.types.ts`  | Web       |
| `ValidationRuleDescriptor` | `types/metadata.types.ts` | API + Web |
| `BehaviourTypeDescriptor`  | `types/metadata.types.ts` | API + Web |
| `BuilderMetadata`          | `types/metadata.types.ts` | API + Web |
| `RegistryCatalogResponse`  | `types/api.types.ts`      | API + Web |
| `RegistryItemResponse`     | `types/api.types.ts`      | API + Web |
| `BuilderMetadataResponse`  | `types/api.types.ts`      | API + Web |
| `RecipeValidateRequest`    | `types/api.types.ts`      | API + Web |
| `RecipeValidateResponse`   | `types/api.types.ts`      | API + Web |
| `RecipePreviewRequest`     | `types/api.types.ts`      | API + Web |
| `RecipePreviewResponse`    | `types/api.types.ts`      | API + Web |

### Schemas (Zod — runtime validation)

| Export                   | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `recipeFieldDraftSchema` | Validate a single field draft at runtime           |
| `recipeStepDraftSchema`  | Validate a single step draft at runtime            |
| `recipeDraftSchema`      | Validate the full builder draft payload at runtime |

### Constants

| Export                          | Purpose                                            | Consumer  |
| ------------------------------- | -------------------------------------------------- | --------- |
| `VALIDATION_RULE_DESCRIPTORS`   | Descriptors for all 32 `ValidationType` values     | API + Web |
| `getValidationDescriptor(type)` | Look up a single rule descriptor by type           | API + Web |
| `BEHAVIOUR_TYPE_DESCRIPTORS`    | Descriptors for all 5 behaviour types              | API + Web |
| `getBehaviourDescriptor(type)`  | Look up a single behaviour descriptor by type      | API + Web |
| `EQUALITY_OPERATOR_OPTIONS`     | Human-readable labels for all 4 equality operators | Web       |

### Utilities

| Export                               | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `parseRef(ref)`                      | Parse a ref string into a typed `ParsedRef`     |
| `buildComponentRef(fieldId)`         | Construct `"components/<fieldId>"`              |
| `buildBlockRef(blockId)`             | Construct `"blocks/<blockId>"`                  |
| `buildCustomRef(ns, type)`           | Construct `"components/<ns>/<type>"`            |
| `isBlockRef(ref)`                    | Type predicate for block refs                   |
| `isComponentRef(ref)`                | Type predicate for builtin component refs       |
| `isCustomRef(ref)`                   | Type predicate for custom/namespaced refs       |
| `refLabel(ref)`                      | Extract the final path segment from a ref       |
| `serializeRecipeDraft(draft, meta?)` | Convert `RecipeDraft` → `ServiceContractRecipe` |
| `deserializeRecipe(recipe)`          | Convert `ServiceContractRecipe` → `RecipeDraft` |

---

## Usage examples

### API — building a `RegistryCatalog` response

```typescript
import type {
  RegistryCatalog,
  PrimitiveRegistryItem,
} from "@govtech-bb/form-builder";
import type { Primitive } from "@govtech-bb/form-types";

function toPrimitiveRegistryItem(
  ref: string,
  primitive: Primitive,
): PrimitiveRegistryItem {
  return {
    ref,
    kind: "primitive",
    fieldId: primitive.fieldId,
    label: primitive.label,
    htmlType: primitive.htmlType,
    hasOptions:
      primitive.htmlType === "checkbox" ||
      primitive.htmlType === "radio" ||
      primitive.htmlType === "select",
    defaultDefinition: primitive,
  };
}
```

### API — returning `BuilderMetadata`

```typescript
import {
  VALIDATION_RULE_DESCRIPTORS,
  BEHAVIOUR_TYPE_DESCRIPTORS,
  EQUALITY_OPERATOR_OPTIONS,
} from "@govtech-bb/form-builder";
import type { BuilderMetadata } from "@govtech-bb/form-builder";

const metadata: BuilderMetadata = {
  validationRules: VALIDATION_RULE_DESCRIPTORS,
  behaviourTypes: BEHAVIOUR_TYPE_DESCRIPTORS,
  equalityOperators: EQUALITY_OPERATOR_OPTIONS,
};
```

### Web — converting between UI state and API contract

```typescript
import {
  serializeRecipeDraft,
  deserializeRecipe,
} from "@govtech-bb/form-builder";
import type { RecipeDraft } from "@govtech-bb/form-builder";

// Load a recipe from the API into UI state
const draft: RecipeDraft = deserializeRecipe(apiResponse.data);

// Send the current UI state to the API
const recipe = serializeRecipeDraft(draft, {
  createdAt: existing.createdAt,
  updatedAt: new Date().toISOString(),
  version: existing.version,
});
await api.put(`/form-definitions/${draft.formId}/recipe`, { recipe });
```

### Web — rendering the validation rule config panel

```typescript
import {
  VALIDATION_RULE_DESCRIPTORS,
  getValidationDescriptor,
} from "@govtech-bb/form-builder";

// Filter rules applicable to the currently-selected field type
const applicableRules = VALIDATION_RULE_DESCRIPTORS.filter(
  (d) =>
    d.applicableHtmlTypes === "all" ||
    d.applicableHtmlTypes.includes(selectedHtmlType),
);

// Get params for a specific rule to render its config form
const descriptor = getValidationDescriptor("minLength");
if (descriptor) {
  descriptor.params.forEach((param) => {
    // render an input of param.inputType for param.key
  });
}
```

### Web — parsing and constructing refs

```typescript
import {
  parseRef,
  buildComponentRef,
  buildBlockRef,
  isBlockRef,
  refLabel,
} from "@govtech-bb/form-builder";

parseRef("components/first-name");
// → { kind: 'component', fieldId: 'first-name' }

parseRef("blocks/personal-information");
// → { kind: 'block', blockId: 'personal-information' }

parseRef("components/barbados/next-of-kin");
// → { kind: 'custom', namespace: 'barbados', type: 'next-of-kin' }

buildComponentRef("date-of-birth"); // → "components/date-of-birth"
buildBlockRef("contact-information"); // → "blocks/contact-information"

isBlockRef("blocks/personal-information"); // → true
refLabel("components/first-name"); // → "first-name"
```

---

## Conventions

- `RecipeStepDraft.fields` maps to `RecipeFormStep.elements` on the wire.
  `serializeRecipeDraft` handles this rename automatically.
- `RecipeFieldDraft._id` is a UI-only stable key (used for drag-and-drop).
  It is stripped by `serializeRecipeDraft` and injected as `"field-{n}"` by
  `deserializeRecipe`.
- Block overrides are `Record<string, FieldOverrides>` (keyed by `fieldId`).
  Component overrides are a flat `FieldOverrides` object. The `kind` field on
  `RecipeFieldDraft` makes this distinction explicit in UI state.
