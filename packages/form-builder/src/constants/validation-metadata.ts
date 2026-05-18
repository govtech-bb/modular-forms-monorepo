import type { ValidationType } from "@govtech-bb/form-types";
import type {
  ValidationRuleDescriptor,
  ValidationRuleParam,
} from "../types/metadata.types";

// ---------------------------------------------------------------------------
// Reusable parameter definitions
// ---------------------------------------------------------------------------

const valueParam: ValidationRuleParam = {
  key: "value",
  label: "Value",
  inputType: "text",
  optional: false,
};

const numericValueParam: ValidationRuleParam = {
  key: "value",
  label: "Value",
  inputType: "number",
  optional: false,
};

const dateValueParam: ValidationRuleParam = {
  key: "value",
  label: "Date (DD/MM/YYYY)",
  inputType: "date",
  optional: false,
};

const errorParam: ValidationRuleParam = {
  key: "error",
  label: "Error message",
  inputType: "text",
  optional: true,
};

const referenceFieldParam: ValidationRuleParam = {
  key: "referenceFieldId",
  label: "Reference field",
  inputType: "fieldRef",
  optional: false,
};

const referenceStepParam: ValidationRuleParam = {
  key: "referenceStepId",
  label: "Reference step",
  inputType: "stepRef",
  optional: true,
};

// ---------------------------------------------------------------------------
// Default-error helpers
// ---------------------------------------------------------------------------

/**
 * Format a value param for use in an error message. Handles `undefined`
 * (the user hasn't filled in the parameter yet) by rendering a stable
 * placeholder, and arrays by joining with commas — mirroring the wording
 * the server-side `ValidationBuilder` produces.
 */
function fmtValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "N";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** Pluralise a unit label based on a numeric quantity. */
function plural(value: unknown, singular: string, pluralForm: string): string {
  return value === 1 || value === "1" ? singular : pluralForm;
}

// ---------------------------------------------------------------------------
// Descriptor table — one entry per ValidationType value
// ---------------------------------------------------------------------------

/**
 * Static descriptors for all 32 `ValidationType` values.
 *
 * These drive the dynamic validation-rule configuration UI in the form builder
 * without requiring the frontend to hardcode any domain knowledge.
 *
 * Each entry specifies:
 * - The `ValidationType` enum value it corresponds to
 * - A human-readable label and description
 * - The runtime parameters the user must supply
 * - Which HTML input types the rule is applicable to
 * - A `getDefaultError` function whose output matches the server-side
 *   `ValidationBuilder` for that rule type — so a recipe authored in the
 *   UI without a custom error renders identically to one built in code.
 */
export const VALIDATION_RULE_DESCRIPTORS: ValidationRuleDescriptor[] = [
  // ---- General ---------------------------------------------------------- //

  {
    type: "required",
    label: "Required",
    description: "The field must have a non-empty value.",
    params: [
      {
        key: "value",
        label: "Required (true/false)",
        inputType: "boolean",
        optional: true,
      },
      errorParam,
    ],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName) => `${fieldName} is required`,
  },

  {
    type: "email",
    label: "Email format",
    description: "The value must be a valid e-mail address.",
    params: [errorParam],
    applicableHtmlTypes: ["email", "text"],
    getDefaultError: (fieldName) => `${fieldName} must be a valid email`,
  },

  // ---- Text / string ---------------------------------------------------- //

  {
    type: "minLength",
    label: "Minimum length",
    description: "The text must be at least N characters long.",
    params: [
      { ...numericValueParam, label: "Minimum character count" },
      errorParam,
    ],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be at least ${fmtValue(value)} characters`,
  },

  {
    type: "maxLength",
    label: "Maximum length",
    description: "The text must be at most N characters long.",
    params: [
      { ...numericValueParam, label: "Maximum character count" },
      errorParam,
    ],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be at most ${fmtValue(value)} characters`,
  },

  {
    type: "pattern",
    label: "Regex pattern",
    description: "The value must match the given regular expression.",
    params: [{ ...valueParam, label: "Regular expression" }, errorParam],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
    getDefaultError: (fieldName) => `${fieldName} is invalid`,
  },

  {
    type: "contains",
    label: "Contains substring",
    description: "The value must contain the specified substring.",
    params: [{ ...valueParam, label: "Substring to find" }, errorParam],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must contain ${fmtValue(value)}`,
  },

  // ---- Number ----------------------------------------------------------- //

  {
    type: "min",
    label: "Minimum value",
    description: "The numeric value must be at least N.",
    params: [{ ...numericValueParam, label: "Minimum number" }, errorParam],
    applicableHtmlTypes: ["number"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be at least ${fmtValue(value)}`,
  },

  {
    type: "max",
    label: "Maximum value",
    description: "The numeric value must be at most N.",
    params: [{ ...numericValueParam, label: "Maximum number" }, errorParam],
    applicableHtmlTypes: ["number"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be at most ${fmtValue(value)}`,
  },

  // ---- Date ------------------------------------------------------------- //

  {
    type: "past",
    label: "Must be in the past",
    description: "The date must be strictly before today.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName) => `${fieldName} must be in the past`,
  },

  {
    type: "pastOrToday",
    label: "Must be today or in the past",
    description: "The date must be today or earlier.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName) => `${fieldName} must be today or in the past`,
  },

  {
    type: "future",
    label: "Must be in the future",
    description: "The date must be strictly after today.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName) => `${fieldName} must be in the future`,
  },

  {
    type: "futureOrToday",
    label: "Must be today or in the future",
    description: "The date must be today or later.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName) =>
      `${fieldName} must be today or in the future`,
  },

  {
    type: "after",
    label: "Must be after date",
    description: "The date must be strictly after the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be after ${fmtValue(value)} (DD/MM/YYYY)`,
  },

  {
    type: "before",
    label: "Must be before date",
    description:
      "The date must be strictly before the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be before ${fmtValue(value)} (DD/MM/YYYY)`,
  },

  {
    type: "onOrAfter",
    label: "Must be on or after date",
    description: "The date must be on or after the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be on or after ${fmtValue(value)} (DD/MM/YYYY)`,
  },

  {
    type: "onOrBefore",
    label: "Must be on or before date",
    description: "The date must be on or before the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be on or before ${fmtValue(value)} (DD/MM/YYYY)`,
  },

  {
    type: "minYear",
    label: "Minimum year",
    description: "The year component of the date must be at least N.",
    params: [
      { ...numericValueParam, label: "Minimum year (4-digit)" },
      errorParam,
    ],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} year must be at least ${fmtValue(value)}`,
  },

  {
    type: "maxYear",
    label: "Maximum year",
    description: "The year component of the date must be at most N.",
    params: [
      { ...numericValueParam, label: "Maximum year (4-digit)" },
      errorParam,
    ],
    applicableHtmlTypes: ["date"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} year must be at most ${fmtValue(value)}`,
  },

  // ---- Collections (checkbox / radio / select) -------------------------- //

  {
    type: "radio",
    label: "Radio selection required",
    description: "Exactly one option must be selected in a radio group.",
    params: [errorParam],
    applicableHtmlTypes: ["radio"],
    getDefaultError: (fieldName) => `${fieldName} is required`,
  },

  {
    type: "minItems",
    label: "Minimum items",
    description: "At least N values must be present in the field array.",
    params: [{ ...numericValueParam, label: "Minimum item count" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must have at least ${fmtValue(value)} items`,
  },

  {
    type: "maxItems",
    label: "Maximum items",
    description: "At most N values may be present in the field array.",
    params: [{ ...numericValueParam, label: "Maximum item count" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must have at most ${fmtValue(value)} items`,
  },

  {
    type: "minSelection",
    label: "Minimum selections",
    description: "At least N options must be selected.",
    params: [{ ...numericValueParam, label: "Minimum selections" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must have at least ${fmtValue(value)} ${plural(
        value,
        "selection",
        "selections",
      )}`,
  },

  {
    type: "maxSelection",
    label: "Maximum selections",
    description: "At most N options may be selected.",
    params: [{ ...numericValueParam, label: "Maximum selections" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must have at most ${fmtValue(value)} ${plural(
        value,
        "selection",
        "selections",
      )}`,
  },

  // ---- File ------------------------------------------------------------- //

  {
    type: "fileTypes",
    label: "Allowed file types",
    description:
      "The uploaded file(s) must have one of the specified MIME types or extensions.",
    params: [
      {
        key: "value",
        label: "Allowed types (comma-separated)",
        inputType: "string[]",
        optional: false,
      },
      errorParam,
    ],
    applicableHtmlTypes: ["file"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be one of: ${fmtValue(value)}`,
  },

  {
    type: "itemMaxSize",
    label: "Maximum file size (per item)",
    description: "Each individual uploaded file must not exceed N bytes.",
    params: [
      { ...numericValueParam, label: "Maximum bytes per file" },
      errorParam,
    ],
    applicableHtmlTypes: ["file"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} each item must be at most ${fmtValue(value)} ${plural(
        value,
        "byte",
        "bytes",
      )}`,
  },

  {
    type: "maxSize",
    label: "Maximum total upload size",
    description:
      "The combined size of all uploaded files must not exceed N bytes.",
    params: [
      { ...numericValueParam, label: "Maximum total bytes" },
      errorParam,
    ],
    applicableHtmlTypes: ["file"],
    getDefaultError: (fieldName, value) =>
      `${fieldName} total size must be at most ${fmtValue(value)} ${plural(
        value,
        "byte",
        "bytes",
      )}`,
  },

  // ---- Cross-field ------------------------------------------------------ //
  // Note: cross-field rules reference another field by ID. The server-side
  // builder uses the raw `fieldId` (not its label) in the message, because
  // it only has the ID at hand. We replicate that wording exactly — the
  // builder UI passes the chosen `referenceFieldId` as `value` when asking
  // for the default error so callers don't need a second arg.

  {
    type: "equal",
    label: "Must equal another field",
    description:
      "This field's value must equal the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName, value) =>
      `${fieldName} must equal ${fmtValue(value)}'s value`,
  },

  {
    type: "notEqual",
    label: "Must not equal another field",
    description:
      "This field's value must differ from the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName, value) =>
      `${fieldName} must not equal ${fmtValue(value)}'s value`,
  },

  {
    type: "gt",
    label: "Must be greater than another field",
    description:
      "This field's value must be strictly greater than the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be greater than ${fmtValue(value)}'s value`,
  },

  {
    type: "lt",
    label: "Must be less than another field",
    description:
      "This field's value must be strictly less than the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName, value) =>
      `${fieldName} must be less than ${fmtValue(value)}'s value`,
  },

  {
    type: "strictEquality",
    label: "Strict equality with another field",
    description:
      "This field's value must exactly match (type and value) the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName, value) =>
      `${fieldName} must exactly match ${fmtValue(value)}'s value`,
  },

  {
    type: "conditionalOn",
    label: "Conditionally required",
    description:
      "This field is required only when a referenced field equals the specified value.",
    params: [
      {
        key: "referenceFieldId",
        label: "Triggering field",
        inputType: "fieldRef",
        optional: false,
      },
      {
        key: "value",
        label: "Triggering value",
        inputType: "text",
        optional: false,
      },
      errorParam,
    ],
    applicableHtmlTypes: "all",
    getDefaultError: (fieldName) => `${fieldName} has a condition`,
  },
];

/**
 * Look up the `ValidationRuleDescriptor` for a given `ValidationType`.
 *
 * @returns The descriptor, or `undefined` if no entry exists (should never
 * happen in a correctly-maintained table, but callers should handle the gap).
 */
export function getValidationDescriptor(
  type: ValidationType,
): ValidationRuleDescriptor | undefined {
  return VALIDATION_RULE_DESCRIPTORS.find((d) => d.type === type);
}
