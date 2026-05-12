import type {
  ValidationType,
  HtmlTypes,
  EqualityOperations,
} from "@govtech-bb/form-types";

/**
 * The set of parameter keys that validation rule configs may reference.
 * Maps to the fields of `ValidationConfig` from `@govtech-bb/form-types`.
 */
export type ValidationParamKey =
  | "value"
  | "error"
  | "referenceFieldId"
  | "referenceStepId";

/**
 * The input control type the UI should render for a given validation parameter.
 */
export type ValidationParamInputType =
  | "text"
  | "number"
  | "date"
  | "string[]"
  | "fieldRef"
  | "stepRef"
  | "boolean";

/** Describes a single configurable parameter of a validation rule. */
export interface ValidationRuleParam {
  key: ValidationParamKey;
  label: string;
  inputType: ValidationParamInputType;
  optional: boolean;
}

/**
 * Static descriptor for a single `ValidationType`.
 * Drives dynamic form generation in the builder UI without hardcoding domain knowledge.
 */
export interface ValidationRuleDescriptor {
  type: ValidationType;
  label: string;
  description: string;
  params: ValidationRuleParam[];
  /**
   * Which HTML input types this rule is applicable to.
   * `'all'` means the rule applies regardless of field type.
   */
  applicableHtmlTypes: HtmlTypes[] | "all";
}

/** The input control type for a behaviour configuration parameter. */
export type BehaviourParamInputType =
  | "string"
  | "string[]"
  | "number"
  | "fieldRef"
  | "stepRef"
  | "operator";

/** Describes a single configurable parameter of a behaviour. */
export interface BehaviourParam {
  key: string;
  label: string;
  inputType: BehaviourParamInputType;
  optional: boolean;
}

/**
 * Static descriptor for a single behaviour type.
 * Drives the behaviour configuration panel in the builder UI.
 */
export interface BehaviourTypeDescriptor {
  type: string;
  label: string;
  description: string;
  /** Whether this behaviour is applicable to fields, steps, or both. */
  scope: "field" | "step" | "both";
  params: BehaviourParam[];
}

/**
 * The complete set of static metadata the builder UI needs to render
 * all configuration panels without importing domain constants directly.
 */
export interface BuilderMetadata {
  validationRules: ValidationRuleDescriptor[];
  behaviourTypes: BehaviourTypeDescriptor[];
  equalityOperators: ReadonlyArray<{
    value: EqualityOperations;
    label: string;
  }>;
}
