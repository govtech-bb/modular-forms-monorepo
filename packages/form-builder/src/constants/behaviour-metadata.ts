import type { EqualityOperations } from "@govtech-bb/form-types";
import type { BehaviourTypeDescriptor } from "../types/metadata.types";

/**
 * Static descriptors for all 5 behaviour types.
 *
 * These drive the behaviour configuration panel in the form builder UI
 * without hardcoding domain knowledge in the frontend.
 */
export const BEHAVIOUR_TYPE_DESCRIPTORS: BehaviourTypeDescriptor[] = [
  {
    type: "fieldConditionalOn",
    label: "Show/hide field conditionally",
    description: "Hides this field unless a condition on another field is met.",
    scope: "field",
    params: [
      {
        key: "targetFieldId",
        label: "Target field",
        inputType: "fieldRef",
        optional: false,
      },
      {
        key: "targetStepId",
        label: "Target step (optional — defaults to current step)",
        inputType: "stepRef",
        optional: true,
      },
      {
        key: "operator",
        label: "Operator",
        inputType: "operator",
        optional: false,
      },
      {
        key: "value",
        label: "Value to match",
        inputType: "string",
        optional: false,
      },
    ],
  },

  {
    type: "stepConditionalOn",
    label: "Show/hide step conditionally",
    description:
      "Skips this entire step unless a condition on another field is met.",
    scope: "step",
    params: [
      {
        key: "targetFieldId",
        label: "Target field",
        inputType: "fieldRef",
        optional: false,
      },
      {
        key: "targetStepId",
        label: "Target step",
        inputType: "stepRef",
        optional: false,
      },
      {
        key: "operator",
        label: "Operator",
        inputType: "operator",
        optional: false,
      },
      {
        key: "value",
        label: "Value to match",
        inputType: "string",
        optional: false,
      },
    ],
  },

  {
    type: "repeatable",
    label: "Repeatable step",
    description: "Allows this step to be repeated N times by the user.",
    scope: "step",
    params: [
      {
        key: "min",
        label: "Minimum instances",
        inputType: "number",
        optional: true,
      },
      {
        key: "max",
        label: "Maximum instances",
        inputType: "number",
        optional: true,
      },
    ],
  },

  {
    type: "fieldArray",
    label: "Field array",
    description: "Allows this field to collect multiple values.",
    scope: "field",
    params: [
      {
        key: "min",
        label: "Minimum items",
        inputType: "number",
        optional: true,
      },
      {
        key: "max",
        label: "Maximum items",
        inputType: "number",
        optional: true,
      },
    ],
  },

  {
    type: "sharedFields",
    label: "Shared fields",
    description:
      "Groups fields to share behaviour across repeatable step instances.",
    scope: "both",
    params: [
      {
        key: "fieldIds",
        label: "Field IDs",
        inputType: "string[]",
        optional: false,
      },
    ],
  },
];

/**
 * Look up the `BehaviourTypeDescriptor` for a given behaviour type string.
 *
 * @returns The descriptor, or `undefined` if the type is unknown.
 */
export function getBehaviourDescriptor(
  type: string,
): BehaviourTypeDescriptor | undefined {
  return BEHAVIOUR_TYPE_DESCRIPTORS.find((d) => d.type === type);
}

/**
 * Human-readable options for all supported equality operators.
 * Used by the UI to render an operator selector in behaviour config panels.
 */
export const EQUALITY_OPERATOR_OPTIONS: ReadonlyArray<{
  value: EqualityOperations;
  label: string;
}> = [
  { value: "equal", label: "Equals" },
  { value: "notEqual", label: "Does not equal" },
  { value: "in", label: "Is one of" },
  { value: "exists", label: "Exists (any value)" },
] as const;
