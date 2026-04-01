import type {
  BasePrimitive,
  FieldOverrides,
  OptionPrimitive,
  FilePrimitive,
} from "./primitive.type";
import type { Block } from "./block.type";
import type { Behaviour } from "./behavior.type";

export interface FormStep {
  step_id: string; // ID for the step
  title: string; // Title to display for the page
  description?: string; // Optional subheading to display
  elements: Array<BasePrimitive | Block | OptionPrimitive | FilePrimitive>; // Makes up the fields.
  behaviours?: Array<Behaviour>; // Behaviour to apply on the step level.
}

export interface RecipeComponentField {
  ref: `components/${string}`;
  overrides?: FieldOverrides;
}

export interface RecipeBlockField {
  ref: `blocks/${string}`;
  overrides?: Record<string, FieldOverrides>; // keyed by fieldId within the block
}

export type RecipeFormStepField = RecipeComponentField | RecipeBlockField;

export interface RecipeFormStep extends Omit<FormStep, "elements"> {
  elements: Array<RecipeFormStepField>;
}
