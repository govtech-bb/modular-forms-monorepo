import type {
  BasePrimitive,
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

export interface RecipeFormStep extends Omit<FormStep, "elements"> {
  elements: Array<RecipeFormStepField>;
}

export interface RecipeFormStepField {
  ref: string; // This is a reference to a component in the registry
  overrides?: Partial<BasePrimitive>;
}
