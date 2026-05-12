import type {
  ServiceContractRecipe,
  RecipeFormStep,
  RecipeFormStepField,
  RecipeComponentField,
  RecipeBlockField,
  FieldOverrides,
} from "@govtech-bb/form-types";
import type {
  RecipeDraft,
  RecipeFieldDraft,
  RecipeStepDraft,
} from "../types/builder.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a `RecipeFieldDraft` to the wire-format `RecipeFormStepField`.
 *
 * - Strips the UI-only `_id` field.
 * - Strips the `kind` discriminant (the wire format uses the `ref` prefix instead).
 * - Emits `RecipeComponentField` for `kind === "component"`.
 * - Emits `RecipeBlockField` for `kind === "block"`.
 */
function serializeField(field: RecipeFieldDraft): RecipeFormStepField {
  if (field.kind === "block") {
    const blockField: RecipeBlockField = {
      ref: field.ref as `blocks/${string}`,
    };
    // Block overrides are Record<string, FieldOverrides> — include only if non-empty
    if (
      field.overrides !== undefined &&
      !isFieldOverrides(field.overrides) &&
      Object.keys(field.overrides).length > 0
    ) {
      blockField.overrides = field.overrides as Record<string, FieldOverrides>;
    }
    return blockField;
  }

  // kind === "component" or kind === "custom" — both serialize as RecipeComponentField
  const componentField: RecipeComponentField = {
    ref: field.ref as `components/${string}`,
  };
  if (
    field.overrides !== undefined &&
    isFieldOverrides(field.overrides) &&
    Object.keys(field.overrides).length > 0
  ) {
    componentField.overrides = field.overrides;
  }
  return componentField;
}

/**
 * Convert a `RecipeStepDraft` to a `RecipeFormStep`.
 * Maps `fields` → `elements` and serializes each field.
 */
function serializeStep(step: RecipeStepDraft): RecipeFormStep {
  const result: RecipeFormStep = {
    stepId: step.stepId,
    title: step.title,
    elements: step.fields.map(serializeField),
    behaviours: step.behaviours.length > 0 ? step.behaviours : undefined,
  };

  if (step.description !== undefined) {
    result.description = step.description;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Serialize a `RecipeDraft` (UI state) into a `ServiceContractRecipe` (API contract).
 *
 * This function:
 * - Strips the UI-only `_id` from every `RecipeFieldDraft`.
 * - Maps `fields` → `elements` on each step.
 * - Injects placeholder `createdAt`, `updatedAt`, and `version` values that
 *   the API will overwrite on persist. Pass a partial override if you need to
 *   preserve existing timestamps (e.g. when saving an already-persisted draft).
 *
 * @param draft - The mutable recipe draft from the builder UI.
 * @param meta - Optional timestamp/version fields to include. Defaults to empty
 *   ISO strings and version `"0"` when not provided — the API overwrites these.
 */
export function serializeRecipeDraft(
  draft: RecipeDraft,
  meta: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  } = {},
): ServiceContractRecipe {
  return {
    formId: draft.formId,
    title: draft.title,
    description: draft.description,
    steps: draft.steps.map(serializeStep),
    processors: draft.processors,
    createdAt: meta.createdAt ?? new Date().toISOString(),
    updatedAt: meta.updatedAt ?? new Date().toISOString(),
    version: meta.version ?? "0",
  };
}

/**
 * Deserialize a `ServiceContractRecipe` (API contract) into a `RecipeDraft` (UI state).
 *
 * This function:
 * - Injects a stable `_id` string into every field using a simple
 *   `"field-{index}"` scheme. The index is unique within the full draft
 *   (not scoped to each step).
 * - Maps `elements` → `fields` on each step.
 * - Determines `kind` from the ref prefix: `"blocks/"` → `"block"`, else `"component"`.
 *
 * Note: `createdAt`, `updatedAt`, and `version` from the recipe are intentionally
 * dropped — they are managed by the API and not part of the draft model.
 */
export function deserializeRecipe(recipe: ServiceContractRecipe): RecipeDraft {
  let fieldIndex = 0;

  const steps: RecipeStepDraft[] = recipe.steps.map((step) => ({
    stepId: step.stepId,
    title: step.title,
    description: step.description,
    behaviours: step.behaviours ?? [],
    fields: step.elements.map((element): RecipeFieldDraft => {
      const id = `field-${fieldIndex++}`;
      if (element.ref.startsWith("blocks/")) {
        return {
          _id: id,
          ref: element.ref,
          kind: "block",
          overrides: (element as RecipeBlockField).overrides ?? {},
        };
      }
      return {
        _id: id,
        ref: element.ref,
        kind: "component",
        overrides: (element as RecipeComponentField).overrides ?? {},
      };
    }),
  }));

  return {
    formId: recipe.formId,
    title: recipe.title,
    description: recipe.description,
    steps,
    processors: recipe.processors,
  };
}

// ---------------------------------------------------------------------------
// Internal type guard
// ---------------------------------------------------------------------------

/**
 * Determines whether `overrides` is a flat `FieldOverrides` object (component)
 * rather than a nested `Record<string, FieldOverrides>` (block).
 *
 * Heuristic: a flat `FieldOverrides` object will not have values that are
 * themselves plain objects with `FieldOverrides`-shaped keys. We use the
 * presence of known `FieldOverrides` keys as the positive signal.
 */
function isFieldOverrides(
  overrides: FieldOverrides | Record<string, FieldOverrides>,
): overrides is FieldOverrides {
  const knownKeys: ReadonlySet<string> = new Set([
    "fieldId",
    "label",
    "hint",
    "placeholder",
    "validations",
    "defaultValue",
    "isDisabled",
    "isHidden",
    "behaviours",
    "multiple",
    "options",
    "ui",
  ]);
  // If at least one top-level key is a known FieldOverrides property,
  // treat as flat FieldOverrides. Empty objects are also treated as flat
  // (the caller already guards against empty objects).
  const keys = Object.keys(overrides);
  if (keys.length === 0) return true;
  return keys.some((k) => knownKeys.has(k));
}
