import type {
  Behaviour,
  FieldOverrides,
  Processor,
} from "@govtech-bb/form-types";

/**
 * A single field entry inside a step draft.
 *
 * `_id` is a UI-only stable identifier used by drag-and-drop libraries.
 * It MUST be stripped before serializing to `ServiceContractRecipe`.
 *
 * `overrides` is `FieldOverrides` for component refs and
 * `Record<string, FieldOverrides>` (keyed by fieldId) for block refs.
 */
export interface RecipeFieldDraft {
  /** UI-only nanoid — stripped on serialization to ServiceContractRecipe. */
  _id: string;
  /** Registry ref, e.g. "components/first-name" or "blocks/personal-information". */
  ref: string;
  kind: "component" | "block";
  overrides: FieldOverrides | Record<string, FieldOverrides>;
}

/**
 * A single step in the recipe draft.
 * Uses `fields` as the UI-facing name; serialized to `elements` in RecipeFormStep.
 */
export interface RecipeStepDraft {
  stepId: string;
  title: string;
  description?: string;
  fields: RecipeFieldDraft[];
  behaviours: Behaviour[];
}

/**
 * The top-level mutable draft shape managed by the builder UI.
 * Does NOT include `createdAt`, `updatedAt`, or `version` — those are
 * assigned by the API when the draft is persisted.
 */
export interface RecipeDraft {
  formId: string;
  title: string;
  description?: string;
  steps: RecipeStepDraft[];
  processors?: Processor[];
}

/**
 * All possible state mutations on a `RecipeDraft`.
 * Designed for use with a reducer or command-pattern dispatcher.
 */
export type RecipeDraftAction =
  | { type: "ADD_STEP"; payload: RecipeStepDraft }
  | { type: "REMOVE_STEP"; stepId: string }
  | {
      type: "UPDATE_STEP_META";
      stepId: string;
      patch: Partial<Pick<RecipeStepDraft, "title" | "description">>;
    }
  | { type: "SET_STEP_BEHAVIOURS"; stepId: string; behaviours: Behaviour[] }
  | { type: "ADD_FIELD"; stepId: string; field: RecipeFieldDraft }
  | { type: "REMOVE_FIELD"; stepId: string; fieldDraftId: string }
  | {
      type: "UPDATE_FIELD_OVERRIDES";
      stepId: string;
      fieldDraftId: string;
      overrides: RecipeFieldDraft["overrides"];
    }
  | { type: "REORDER_STEPS"; orderedIds: string[] }
  | { type: "REORDER_FIELDS"; stepId: string; orderedIds: string[] }
  | { type: "LOAD_DRAFT"; draft: RecipeDraft }
  | { type: "RESET" };
