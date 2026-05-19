/**
 * Pure reducer for the RecipeDraft builder state.
 *
 * The leading dash in the filename (`-recipe-reducer.ts`) follows the
 * TanStack Router file-based routing convention: files prefixed with `-`
 * are NOT treated as route segments.
 */

import type {
  RecipeDraft,
  RecipeStepDraft,
  RecipeDraftAction,
} from "@govtech-bb/form-builder";

// ---------------------------------------------------------------------------
// Unique ID generation — avoids a nanoid dependency
// ---------------------------------------------------------------------------

let _idCounter = 0;
export function makeFieldId(): string {
  return `field-${Date.now()}-${++_idCounter}`;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function recipeDraftReducer(
  state: RecipeDraft,
  action: RecipeDraftAction,
): RecipeDraft {
  switch (action.type) {
    case "ADD_STEP": {
      return { ...state, steps: [...state.steps, action.payload] };
    }

    case "REMOVE_STEP": {
      return {
        ...state,
        steps: state.steps.filter((s) => s.stepId !== action.stepId),
      };
    }

    case "UPDATE_STEP_META": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === action.stepId ? { ...s, ...action.patch } : s,
        ),
      };
    }

    case "SET_STEP_BEHAVIOURS": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === action.stepId
            ? { ...s, behaviours: action.behaviours }
            : s,
        ),
      };
    }

    case "ADD_FIELD": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === action.stepId
            ? { ...s, fields: [...s.fields, action.field] }
            : s,
        ),
      };
    }

    case "REMOVE_FIELD": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === action.stepId
            ? {
                ...s,
                fields: s.fields.filter((f) => f._id !== action.fieldDraftId),
              }
            : s,
        ),
      };
    }

    case "UPDATE_FIELD_OVERRIDES": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === action.stepId
            ? {
                ...s,
                fields: s.fields.map((f) =>
                  f._id === action.fieldDraftId
                    ? { ...f, overrides: action.overrides }
                    : f,
                ),
              }
            : s,
        ),
      };
    }

    case "REORDER_STEPS": {
      const lookup = new Map(state.steps.map((s) => [s.stepId, s]));
      const reordered = action.orderedIds
        .map((id) => lookup.get(id))
        .filter((s): s is RecipeStepDraft => s !== undefined);
      return { ...state, steps: reordered };
    }

    case "REORDER_FIELDS": {
      return {
        ...state,
        steps: state.steps.map((s) => {
          if (s.stepId !== action.stepId) return s;
          const lookup = new Map(s.fields.map((f) => [f._id, f]));
          const reordered = action.orderedIds
            .map((id) => lookup.get(id))
            .filter(
              (f): f is RecipeStepDraft["fields"][number] => f !== undefined,
            );
          return { ...s, fields: reordered };
        }),
      };
    }

    case "LOAD_DRAFT": {
      return action.draft;
    }

    case "RESET": {
      return emptyDraft();
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function emptyDraft(): RecipeDraft {
  return {
    formId: "",
    title: "",
    description: undefined,
    steps: [],
    processors: undefined,
  };
}
