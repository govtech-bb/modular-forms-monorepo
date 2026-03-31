export interface ValidationConfig {
  error?: string;
  value?: any;
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
  | "equality"
  | "strictEquality";

export type ValidationRule = Partial<Record<ValidationType, ValidationConfig>>;
