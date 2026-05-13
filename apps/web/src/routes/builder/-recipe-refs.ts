/**
 * Helpers for enumerating known steps and fields in the current `RecipeDraft`.
 *
 * The validation-rule and behaviour editors need to let the user pick a
 * `targetStepId` / `targetFieldId` (or `referenceStepId` / `referenceFieldId`)
 * from the steps and fields that actually exist in the recipe. This module
 * centralises the logic for building those option lists from the draft +
 * registry catalog.
 *
 * The leading dash in the filename follows the TanStack Router convention:
 * files prefixed with `-` are NOT treated as route segments.
 */

import type {
  RecipeDraft,
  RecipeStepDraft,
  RecipeFieldDraft,
  RegistryCatalog,
  PrimitiveRegistryItem,
  BlockRegistryItem,
  CustomRegistryItem,
} from "@govtech-bb/form-builder";
import type { FieldOverrides, HtmlTypes } from "@govtech-bb/form-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A resolvable field within the current recipe — produced by resolving a
 * `RecipeFieldDraft` against the registry catalog. One `RecipeFieldDraft`
 * of `kind === "block"` can produce multiple entries (one per primitive
 * inside the block).
 */
export interface RecipeFieldRef {
  /** Step the field belongs to. */
  stepId: string;
  /** Final field ID used at runtime (after overrides). */
  fieldId: string;
  /** Human-readable label (after overrides). */
  label: string;
  /** HTML type — used by editors to filter applicable validation rules. */
  htmlType: HtmlTypes;
  /** The originating field draft's `_id` — useful for grouping/deduping. */
  fieldDraftId: string;
  /** Registry ref string (e.g. "components/first-name"). */
  ref: string;
  /** Whether this entry came from a block's nested primitive. */
  fromBlock: boolean;
}

export interface RecipeStepRef {
  stepId: string;
  title: string;
}

// ---------------------------------------------------------------------------
// Catalog lookups
// ---------------------------------------------------------------------------

/**
 * Look up a registry item by its ref. Returns `undefined` if not found.
 */
export function findRegistryItem(
  catalog: RegistryCatalog,
  ref: string,
): PrimitiveRegistryItem | BlockRegistryItem | CustomRegistryItem | undefined {
  const primitive = catalog.primitives.find((p) => p.ref === ref);
  if (primitive) return primitive;
  const block = catalog.blocks.find((b) => b.ref === ref);
  if (block) return block;
  const custom = catalog.custom.find((c) => c.ref === ref);
  if (custom) return custom;
  return undefined;
}

// ---------------------------------------------------------------------------
// Step / field enumeration
// ---------------------------------------------------------------------------

/**
 * List all steps in the recipe as simple ref objects.
 */
export function getStepRefs(draft: RecipeDraft): RecipeStepRef[] {
  return draft.steps.map((s) => ({ stepId: s.stepId, title: s.title }));
}

/**
 * List all addressable fields in the recipe, expanding block fields into
 * their constituent primitives. Applies any active per-field overrides so
 * `label` reflects what the user actually sees.
 *
 * If `restrictToStepId` is provided, only fields from that step are returned.
 */
export function getFieldRefs(
  draft: RecipeDraft,
  catalog: RegistryCatalog,
  restrictToStepId?: string,
): RecipeFieldRef[] {
  const refs: RecipeFieldRef[] = [];

  for (const step of draft.steps) {
    if (restrictToStepId !== undefined && step.stepId !== restrictToStepId) {
      continue;
    }
    for (const field of step.fields) {
      const item = findRegistryItem(catalog, field.ref);
      if (item === undefined) continue;

      if (item.kind === "block") {
        // Block — one entry per primitive inside the block.
        const blockOverrides = field.overrides as
          | Record<string, FieldOverrides>
          | undefined;
        for (const child of item.elements) {
          const childOverrides = blockOverrides?.[child.fieldId];
          refs.push({
            stepId: step.stepId,
            fieldId: childOverrides?.fieldId ?? child.fieldId,
            label: childOverrides?.label ?? child.label,
            htmlType: child.htmlType,
            fieldDraftId: field._id,
            ref: child.ref,
            fromBlock: true,
          });
        }
      } else {
        // Primitive or custom — single entry.
        const overrides = field.overrides as FieldOverrides | undefined;
        refs.push({
          stepId: step.stepId,
          fieldId: overrides?.fieldId ?? item.fieldId,
          label: overrides?.label ?? item.label,
          htmlType: item.htmlType,
          fieldDraftId: field._id,
          ref: field.ref,
          fromBlock: false,
        });
      }
    }
  }

  return refs;
}

/**
 * Build a resolved, override-applied view of a single component field.
 * Returns `undefined` if the field is a block or the registry item is missing.
 *
 * Useful for the field-edit panel, which wants to display the effective
 * label/placeholder/hint/options after merging overrides on top of the
 * catalog default.
 */
export function resolveComponentField(
  step: RecipeStepDraft,
  field: RecipeFieldDraft,
  catalog: RegistryCatalog,
):
  | {
      registryItem: PrimitiveRegistryItem | CustomRegistryItem;
      overrides: FieldOverrides;
      effectiveLabel: string;
      effectiveFieldId: string;
      effectivePlaceholder: string | undefined;
      effectiveHint: string | undefined;
    }
  | undefined {
  if (field.kind === "block") return undefined;
  const item = findRegistryItem(catalog, field.ref);
  if (item === undefined || item.kind === "block") return undefined;

  const overrides = (field.overrides as FieldOverrides | undefined) ?? {};
  const base = item.defaultDefinition;
  return {
    registryItem: item,
    overrides,
    effectiveLabel: overrides.label ?? base.label,
    effectiveFieldId: overrides.fieldId ?? item.fieldId,
    effectivePlaceholder: overrides.placeholder ?? base.placeholder,
    effectiveHint: overrides.hint ?? base.hint,
  };
}

// Re-export for convenience — callers shouldn't need to know that the
// step parameter is currently unused, but keeping it in the signature
// future-proofs the helper for step-scoped resolution logic.
void resolveComponentField;

// ---------------------------------------------------------------------------
// Override status
// ---------------------------------------------------------------------------

/**
 * Returns true if the given field draft has any non-empty overrides applied.
 *
 * For component fields, this checks the flat `FieldOverrides` object.
 * For block fields, it checks each child override.
 */
export function hasActiveOverrides(field: RecipeFieldDraft): boolean {
  const overrides = field.overrides;
  if (overrides === undefined || overrides === null) return false;
  const keys = Object.keys(overrides);
  if (keys.length === 0) return false;

  if (field.kind === "block") {
    // Block — at least one child must have a non-empty FieldOverrides.
    const blockOverrides = overrides as Record<string, FieldOverrides>;
    return Object.values(blockOverrides).some(
      (child) => child !== undefined && Object.keys(child).length > 0,
    );
  }

  // Component / custom — at least one key on FieldOverrides must be set.
  return true;
}

/**
 * Returns a count of how many distinct override properties are set on the
 * field, summed across all children for blocks. Useful for the UI badge.
 */
export function countActiveOverrides(field: RecipeFieldDraft): number {
  const overrides = field.overrides;
  if (overrides === undefined || overrides === null) return 0;

  if (field.kind === "block") {
    const blockOverrides = overrides as Record<string, FieldOverrides>;
    return Object.values(blockOverrides).reduce(
      (acc, child) => acc + (child ? Object.keys(child).length : 0),
      0,
    );
  }

  const componentOverrides = overrides as FieldOverrides;
  return Object.keys(componentOverrides).length;
}
