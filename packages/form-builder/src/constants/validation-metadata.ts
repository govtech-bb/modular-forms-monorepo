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
  },

  {
    type: "email",
    label: "Email format",
    description: "The value must be a valid e-mail address.",
    params: [errorParam],
    applicableHtmlTypes: ["email", "text"],
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
  },

  {
    type: "pattern",
    label: "Regex pattern",
    description: "The value must match the given regular expression.",
    params: [{ ...valueParam, label: "Regular expression" }, errorParam],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
  },

  {
    type: "contains",
    label: "Contains substring",
    description: "The value must contain the specified substring.",
    params: [{ ...valueParam, label: "Substring to find" }, errorParam],
    applicableHtmlTypes: ["text", "textarea", "tel", "email"],
  },

  // ---- Number ----------------------------------------------------------- //

  {
    type: "min",
    label: "Minimum value",
    description: "The numeric value must be at least N.",
    params: [{ ...numericValueParam, label: "Minimum number" }, errorParam],
    applicableHtmlTypes: ["number"],
  },

  {
    type: "max",
    label: "Maximum value",
    description: "The numeric value must be at most N.",
    params: [{ ...numericValueParam, label: "Maximum number" }, errorParam],
    applicableHtmlTypes: ["number"],
  },

  // ---- Date ------------------------------------------------------------- //

  {
    type: "past",
    label: "Must be in the past",
    description: "The date must be strictly before today.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "pastOrToday",
    label: "Must be today or in the past",
    description: "The date must be today or earlier.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "future",
    label: "Must be in the future",
    description: "The date must be strictly after today.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "futureOrToday",
    label: "Must be today or in the future",
    description: "The date must be today or later.",
    params: [errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "after",
    label: "Must be after date",
    description: "The date must be strictly after the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "before",
    label: "Must be before date",
    description:
      "The date must be strictly before the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "onOrAfter",
    label: "Must be on or after date",
    description: "The date must be on or after the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
  },

  {
    type: "onOrBefore",
    label: "Must be on or before date",
    description: "The date must be on or before the given date (DD/MM/YYYY).",
    params: [dateValueParam, errorParam],
    applicableHtmlTypes: ["date"],
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
  },

  // ---- Collections (checkbox / radio / select) -------------------------- //

  {
    type: "radio",
    label: "Radio selection required",
    description: "Exactly one option must be selected in a radio group.",
    params: [errorParam],
    applicableHtmlTypes: ["radio"],
  },

  {
    type: "minItems",
    label: "Minimum items",
    description: "At least N values must be present in the field array.",
    params: [{ ...numericValueParam, label: "Minimum item count" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
  },

  {
    type: "maxItems",
    label: "Maximum items",
    description: "At most N values may be present in the field array.",
    params: [{ ...numericValueParam, label: "Maximum item count" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
  },

  {
    type: "minSelection",
    label: "Minimum selections",
    description: "At least N options must be selected.",
    params: [{ ...numericValueParam, label: "Minimum selections" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
  },

  {
    type: "maxSelection",
    label: "Maximum selections",
    description: "At most N options may be selected.",
    params: [{ ...numericValueParam, label: "Maximum selections" }, errorParam],
    applicableHtmlTypes: ["checkbox", "radio", "select"],
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
  },

  // ---- Cross-field ------------------------------------------------------ //

  {
    type: "equal",
    label: "Must equal another field",
    description:
      "This field's value must equal the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
  },

  {
    type: "notEqual",
    label: "Must not equal another field",
    description:
      "This field's value must differ from the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
  },

  {
    type: "gt",
    label: "Must be greater than another field",
    description:
      "This field's value must be strictly greater than the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
  },

  {
    type: "lt",
    label: "Must be less than another field",
    description:
      "This field's value must be strictly less than the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
  },

  {
    type: "strictEquality",
    label: "Strict equality with another field",
    description:
      "This field's value must exactly match (type and value) the value of another specified field.",
    params: [referenceFieldParam, referenceStepParam, errorParam],
    applicableHtmlTypes: "all",
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
