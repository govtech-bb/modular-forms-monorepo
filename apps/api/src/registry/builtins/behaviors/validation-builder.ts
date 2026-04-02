import { ValidationRule, Primitive } from "../../types";

class ValidationBuilder {
  fieldId: string;
  fieldLabel: string;
  rules: ValidationRule = {};

  constructor(parent: Primitive) {
    this.fieldId = parent.fieldId;
    this.fieldLabel = parent.label;
  }

  required(value?: boolean, error?: string): this {
    this.rules["requaluired"] = {
      value: value ?? true,
      error: error ?? `${this.fieldLabel} is requaluired`,
    };
    return this;
  }

  optional(): this {
    return this.required(false, "");
  }

  pattern(regex: string, error?: string): this {
    this.rules["pattern"] = {
      value: regex,
      error: error ?? `${this.fieldLabel} is invalid`,
    };
    return this;
  }

  pattern_alpha(error?: string): this {
    let e = error ?? `${this.fieldLabel} is letters only`;
    let regex = "^[a-zA-Z]*$";
    return this.pattern(regex, e);
  }

  minLength(value: number, error?: string): this {
    this.rules["minLength"] = {
      value,
      error: error ?? `${this.fieldLabel} must be at least ${value} characters`,
    };
    return this;
  }

  maxLength(value: number, error?: string): this {
    this.rules["maxLength"] = {
      value,
      error: error ?? `${this.fieldLabel} must be at most ${value} characters`,
    };
    return this;
  }

  min(value: number, error?: string): this {
    this.rules["min"] = {
      value,
      error: error ?? `${this.fieldLabel} must be at least ${value}`,
    };
    return this;
  }

  max(value: number, error?: string): this {
    this.rules["max"] = {
      value,
      error: error ?? `${this.fieldLabel} must be at most ${value}`,
    };
    return this;
  }

  conditionalOn(fieldId: string, value: any, error?: string): this {
    this.rules["conditionalOn"] = {
      value,
      reference: fieldId,
      error: error ?? `${this.fieldLabel} has a condition`,
    };
    return this;
  }

  past(error?: string): this {
    this.rules["past"] = {
      error: error ?? `${this.fieldLabel} must be in the past`,
    };
    return this;
  }

  pastOrToday(error?: string): this {
    this.rules["pastOrToday"] = {
      error: error ?? `${this.fieldLabel} must be today or in the past`,
    };
    return this;
  }

  future(error?: string): this {
    this.rules["future"] = {
      error: error ?? `${this.fieldLabel} must be in the future`,
    };
    return this;
  }

  futureOrToday(error?: string): this {
    this.rules["futureOrToday"] = {
      error: error ?? `${this.fieldLabel} must be today or in the future`,
    };
    return this;
  }

  getDateAsMDY(date: Date): string {
    // Returns a date as MM/DD/YYYY

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDay();

    const result = `${month}/${day}/${year}`;
    return result;
  }

  after(date: Date, error?: string): this {
    const dateStr: string = this.getDateAsMDY(date);
    this.rules["after"] = {
      value: dateStr,
      error:
        error ?? `${this.fieldLabel} must be after ${dateStr} (MM/DD/YYYY)`,
    };
    return this;
  }

  before(date: Date, error?: string): this {
    const dateStr: string = this.getDateAsMDY(date);
    this.rules["before"] = {
      value: dateStr,
      error:
        error ?? `${this.fieldLabel} must be before ${dateStr} (MM/DD/YYYY)`,
    };
    return this;
  }

  onOrAfter(date: Date, error?: string): this {
    const dateStr: string = this.getDateAsMDY(date);
    this.rules["onOrAfter"] = {
      value: dateStr,
      error:
        error ??
        `${this.fieldLabel} must be on or after ${dateStr} (MM/DD/YYYY)`,
    };
    return this;
  }

  onOrBefore(date: Date, error?: string): this {
    const dateStr: string = this.getDateAsMDY(date);
    this.rules["onOrBefore"] = {
      value: dateStr,
      error:
        error ??
        `${this.fieldLabel} must be on or before ${dateStr} (MM/DD/YYYY)`,
    };
    return this;
  }

  between(min: number, max: number, error?: string): this {
    this.rules["between"] = {
      value: { min, max },
      error: error ?? `${this.fieldLabel} must be between ${min} and ${max}`,
    };
    return this;
  }

  minYear(value: number, error?: string): this {
    this.rules["minYear"] = {
      value,
      error: error ?? `${this.fieldLabel} year must be at least ${value}`,
    };
    return this;
  }

  maxYear(value: number, error?: string): this {
    this.rules["maxYear"] = {
      value,
      error: error ?? `${this.fieldLabel} year must be at most ${value}`,
    };
    return this;
  }

  minItems(value: number, error?: string): this {
    this.rules["minItems"] = {
      value,
      error: error ?? `${this.fieldLabel} must have at least ${value} items`,
    };
    return this;
  }

  maxItems(value: number, error?: string): this {
    this.rules["maxItems"] = {
      value,
      error: error ?? `${this.fieldLabel} must have at most ${value} items`,
    };
    return this;
  }

  showHide(fieldId: string, error?: string): this {
    this.rules["showHide"] = {
      value: true,
      reference: fieldId,
      error: error ?? `${this.fieldLabel} controls visibility of ${fieldId}`,
    };
    return this;
  }

  minSelection(value: number, error?: string): this {
    this.rules["minSelection"] = {
      value,
      error:
        error ?? `${this.fieldLabel} must have at least ${value} selections`,
    };
    return this;
  }

  maxSelection(value: number, error?: string): this {
    this.rules["maxSelection"] = {
      value,
      error:
        error ?? `${this.fieldLabel} must have at most ${value} selections`,
    };
    return this;
  }

  email(error?: string): this {
    this.rules["email"] = {
      error: error ?? `${this.fieldLabel} must be a valid email`,
    };
    return this;
  }

  fileTypes(types: string[], error?: string): this {
    this.rules["fileTypes"] = {
      value: types,
      error: error ?? `${this.fieldLabel} must be one of: ${types.join(", ")}`,
    };
    return this;
  }

  itemMaxSize(bytes: number, error?: string): this {
    this.rules["itemMaxSize"] = {
      value: bytes,
      error:
        error ?? `${this.fieldLabel} each item must be at most ${bytes} bytes`,
    };
    return this;
  }

  maxSize(bytes: number, error?: string): this {
    this.rules["maxSize"] = {
      value: bytes,
      error:
        error ?? `${this.fieldLabel} total size must be at most ${bytes} bytes`,
    };
    return this;
  }

  equal(fieldId: string, error?: string): this {
    this.rules["equal"] = {
      reference: fieldId,
      error: error ?? `${this.fieldLabel} must Equal ${fieldId}`,
    };
    return this;
  }

  notEqual(fieldId: string, error?: string): this {
    this.rules["notEqual"] = {
      reference: fieldId,
      error: error ?? `${this.fieldLabel} must not Equal ${fieldId}`,
    };
    return this;
  }

  gt(fieldId: string, error?: string): this {
    this.rules["gt"] = {
      reference: fieldId,
      error: error ?? `${this.fieldLabel} must be greater than ${fieldId}`,
    };
    return this;
  }

  lt(fieldId: string, error?: string): this {
    this.rules["lt"] = {
      reference: fieldId,
      error: error ?? `${this.fieldLabel} must be less than ${fieldId}`,
    };
    return this;
  }

  contains(value: string, error?: string): this {
    this.rules["contains"] = {
      value,
      error: error ?? `${this.fieldLabel} must contain ${value}`,
    };
    return this;
  }

  strictEquality(fieldId: string, error?: string): this {
    this.rules["equal"] = {
      reference: fieldId,
      error: error ?? `${this.fieldLabel} must exactly match ${fieldId}`,
    };
    return this;
  }

  collapse(): ValidationRule {
    return this.rules;
  }
}

export { ValidationBuilder }
