import type { Behaviour } from "./behavior.type";
import type { ValidationRule } from "./validation.type";

export interface PrimitiveMetadata {
  pii: boolean;
  sensitive: boolean;
}

export interface BasePrimitive {
  fieldId: string;
  label: string;
  htmlType: "text" | "number" | "date";
  placeholder?: string;
  hint?: string;
  defaultValue?: any;
  value?: any;
  isDisabled?: boolean;
  isVisible?: boolean;
  behaviours?: Behaviour[];
  validations?: Partial<ValidationRule>[];
  metadata?: Partial<PrimitiveMetadata>;
  [key: string]: unknown;
}

export interface Option {
  key: string;
  value: string;
}

export interface OptionPrimitive extends Omit<BasePrimitive, "htmlType"> {
  options: Array<Option>;
  htmlType: "select" | "radio";
}

export interface FilePrimitive extends Omit<BasePrimitive, "htmlType"> {
  multiple: boolean;
  htmlType: "file";
}
