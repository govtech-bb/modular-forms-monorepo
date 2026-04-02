export interface ValidationConfig {
  error?: string;
  value?: any;
  reference?: string;
}

export type ValidationType =
  | "required"
  | "minLength"
  | "maxLength"
  | "pattern"
  | "min"
  | "max"
  | "conditionalOn"
  | "past"
  | "pastOrToday"
  | "future"
  | "futureOrToday"
  | "after"
  | "before"
  | "onOrAfter"
  | "onOrBefore"
  | "between"
  | "minYear"
  | "maxYear"
  | "minItems"
  | "maxItems"
  | "showHide"
  | "radio"
  | "minSelection"
  | "maxSelection"
  | "email"
  | "fileTypes"
  | "itemMaxSize"
  | "maxSize"
  | "equal"
  | "notEqual"
  | "gt"
  | "lt"
  | "contains"
  | "Equality"
  | "strictEquality";

export type ValidationRule = Partial<Record<ValidationType, ValidationConfig>>;
