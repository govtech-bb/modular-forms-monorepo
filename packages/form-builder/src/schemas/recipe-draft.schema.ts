import { z } from "zod";
import {
  KEBAB_CASE_MESSAGE,
  KEBAB_CASE_REGEX,
  behaviourSchema,
  fieldOverridesSchema,
  processorSchema,
} from "@govtech-bb/form-types";

/**
 * Zod schema for a single field in a recipe step draft.
 *
 * `_id` is a UI-only stable identifier used for drag-and-drop and React keys.
 * It MUST be stripped before the draft is serialized to `ServiceContractRecipe`.
 *
 * `overrides` is a union of:
 * - `FieldOverrides` for component refs (flat override object)
 * - `Record<string, FieldOverrides>` for block refs (per-fieldId override map)
 */
export const recipeFieldDraftSchema = z.object({
  _id: z.string(),
  ref: z.string(),
  kind: z.enum(["component", "block"]),
  overrides: z.union([
    fieldOverridesSchema,
    z.record(z.string(), fieldOverridesSchema),
  ]),
});

/**
 * Zod schema for a single step in a recipe draft.
 * Uses `fields` (UI name) rather than `elements` (API name).
 */
export const recipeStepDraftSchema = z.object({
  stepId: z.string().regex(KEBAB_CASE_REGEX, KEBAB_CASE_MESSAGE),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(recipeFieldDraftSchema),
  behaviours: z.array(behaviourSchema),
});

/**
 * Zod schema for the top-level recipe draft.
 * Does not include `createdAt`, `updatedAt`, or `version` — those are
 * assigned by the API on persist.
 */
export const recipeDraftSchema = z.object({
  formId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  steps: z.array(recipeStepDraftSchema),
  processors: z.array(processorSchema).optional(),
});

/** Inferred TypeScript type for `recipeFieldDraftSchema`. */
export type RecipeFieldDraftSchema = z.infer<typeof recipeFieldDraftSchema>;

/** Inferred TypeScript type for `recipeStepDraftSchema`. */
export type RecipeStepDraftSchema = z.infer<typeof recipeStepDraftSchema>;

/** Inferred TypeScript type for `recipeDraftSchema`. */
export type RecipeDraftSchema = z.infer<typeof recipeDraftSchema>;
