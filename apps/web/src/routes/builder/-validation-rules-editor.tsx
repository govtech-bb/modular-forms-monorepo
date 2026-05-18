/**
 * Editor for a field's `validations` rule map (`ValidationRule`).
 *
 * Renders one row per active rule, plus a dropdown to add new rules. Each
 * rule's parameters are driven by `VALIDATION_RULE_DESCRIPTORS` — the UI
 * does not hardcode the parameter list per rule type. The user can supply
 * a custom error message per rule, and (for cross-field rules) pick a
 * referenced field/step from the current recipe.
 */

import React from "react";
import type {
  HtmlTypes,
  ValidationRule,
  ValidationType,
  ValidationConfig,
} from "@govtech-bb/form-types";
import {
  VALIDATION_RULE_DESCRIPTORS,
  type ValidationRuleDescriptor,
  type ValidationRuleParam,
} from "@govtech-bb/form-builder";
import { FieldRefPicker, StepRefPicker } from "./-field-ref-picker";
import type { RecipeFieldRef, RecipeStepRef } from "./-recipe-refs";
import css from "../../styles/builder.module.css";

interface ValidationRulesEditorProps {
  htmlType: HtmlTypes;
  value: ValidationRule;
  onChange: (next: ValidationRule) => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
  /**
   * Effective label / name of the field these rules apply to. Used to
   * pre-fill the default error message when a rule is added or when the
   * user updates a rule's value while the error message is still blank.
   * Mirrors the wording produced by the server-side `ValidationBuilder`.
   */
  fieldName: string;
}

export function ValidationRulesEditor({
  htmlType,
  value,
  onChange,
  fieldRefs,
  stepRefs,
  fieldName,
}: ValidationRulesEditorProps) {
  const applicable = React.useMemo(
    () =>
      VALIDATION_RULE_DESCRIPTORS.filter((d) =>
        d.applicableHtmlTypes === "all"
          ? true
          : d.applicableHtmlTypes.includes(htmlType),
      ),
    [htmlType],
  );

  const activeTypes = React.useMemo(
    () => Object.keys(value) as ValidationType[],
    [value],
  );

  const availableToAdd = React.useMemo(
    () => applicable.filter((d) => !activeTypes.includes(d.type)),
    [applicable, activeTypes],
  );

  const [addType, setAddType] = React.useState<ValidationType | "">("");

  const handleAdd = () => {
    if (addType === "") return;
    const descriptor = VALIDATION_RULE_DESCRIPTORS.find(
      (d) => d.type === addType,
    );
    if (descriptor === undefined) return;
    const config = defaultConfigFor(descriptor);
    // Pre-fill a sensible default error so the input isn't empty on first
    // add. The user can still edit or clear it; clearing will cause us to
    // re-fill from the descriptor on the next param change (see
    // handleConfigChange below).
    const seededConfig: ValidationConfig = {
      ...config,
      error: descriptor.getDefaultError(fieldName, config.value),
    };
    const next: ValidationRule = {
      ...value,
      [addType]: seededConfig,
    };
    onChange(next);
    setAddType("");
  };

  const handleRemove = (type: ValidationType) => {
    const next: ValidationRule = { ...value };
    delete next[type];
    onChange(next);
  };

  const handleConfigChange = (
    type: ValidationType,
    patch: Partial<ValidationConfig>,
  ) => {
    const current = value[type] ?? {};
    const merged: ValidationConfig = { ...current, ...patch };

    // Auto-refresh the default error when the user hasn't supplied a custom
    // one. We treat the error as "auto" while it is blank/undefined OR
    // while it still matches the previously-generated default for the
    // prior value — that way, typing a value and then later editing it
    // keeps the message coherent. Once the user types their own message,
    // we leave it alone.
    const descriptor = VALIDATION_RULE_DESCRIPTORS.find((d) => d.type === type);
    if (descriptor !== undefined) {
      const errorEdited = Object.prototype.hasOwnProperty.call(patch, "error");
      if (!errorEdited) {
        const prevError = current.error;
        const prevDefault = descriptor.getDefaultError(
          fieldName,
          current.value,
        );
        const errorIsAuto =
          prevError === undefined ||
          prevError === "" ||
          prevError === prevDefault;
        if (errorIsAuto) {
          merged.error = descriptor.getDefaultError(fieldName, merged.value);
        }
      }
    }

    const next: ValidationRule = {
      ...value,
      [type]: merged,
    };
    onChange(next);
  };

  return (
    <div className={css.editorSubsection}>
      {activeTypes.length === 0 && (
        <p className={css.editorSubsectionEmpty}>
          No validation rules configured.
        </p>
      )}

      {activeTypes.map((type) => {
        const descriptor = VALIDATION_RULE_DESCRIPTORS.find(
          (d) => d.type === type,
        );
        if (descriptor === undefined) return null;
        const config = value[type] ?? {};
        return (
          <ValidationRuleRow
            key={type}
            descriptor={descriptor}
            config={config}
            onConfigChange={(patch) => handleConfigChange(type, patch)}
            onRemove={() => handleRemove(type)}
            fieldRefs={fieldRefs}
            stepRefs={stepRefs}
          />
        );
      })}

      {availableToAdd.length > 0 && (
        <div className={css.addRuleRow}>
          <select
            className={css.fieldInput}
            value={addType}
            onChange={(e) => setAddType(e.target.value as ValidationType | "")}
            aria-label="Validation rule to add"
          >
            <option value="">— add a rule —</option>
            {availableToAdd.map((d) => (
              <option key={d.type} value={d.type}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${css.btn} ${css.btnSecondary} ${css.btnSm}`}
            onClick={handleAdd}
            disabled={addType === ""}
          >
            Add rule
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single rule row
// ---------------------------------------------------------------------------

interface ValidationRuleRowProps {
  descriptor: ValidationRuleDescriptor;
  config: ValidationConfig;
  onConfigChange: (patch: Partial<ValidationConfig>) => void;
  onRemove: () => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
}

function ValidationRuleRow({
  descriptor,
  config,
  onConfigChange,
  onRemove,
  fieldRefs,
  stepRefs,
}: ValidationRuleRowProps) {
  return (
    <div className={css.ruleRow}>
      <div className={css.ruleRowHeader}>
        <div>
          <span className={css.ruleRowTitle}>{descriptor.label}</span>
          <span className={css.ruleRowType}>{descriptor.type}</span>
        </div>
        <button
          type="button"
          className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
          onClick={onRemove}
          aria-label={`Remove ${descriptor.label} rule`}
          title="Remove rule"
        >
          x
        </button>
      </div>
      <p className={css.ruleRowDescription}>{descriptor.description}</p>

      <div className={css.ruleRowParams}>
        {descriptor.params.map((param) => (
          <ParamInput
            key={param.key}
            param={param}
            config={config}
            onChange={onConfigChange}
            fieldRefs={fieldRefs}
            stepRefs={stepRefs}
            ruleType={descriptor.type}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single parameter input
// ---------------------------------------------------------------------------

interface ParamInputProps {
  param: ValidationRuleParam;
  config: ValidationConfig;
  onChange: (patch: Partial<ValidationConfig>) => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
  ruleType: ValidationType;
}

function ParamInput({
  param,
  config,
  onChange,
  fieldRefs,
  stepRefs,
  ruleType,
}: ParamInputProps) {
  const inputId = `vparam-${ruleType}-${param.key}`;
  const optionalSuffix = param.optional ? " (optional)" : "";

  switch (param.inputType) {
    case "text":
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel} htmlFor={inputId}>
            {param.label}
            {optionalSuffix}
          </label>
          <input
            id={inputId}
            className={css.fieldInput}
            type="text"
            value={getParamStringValue(config, param.key)}
            onChange={(e) =>
              onChange({ [param.key]: e.target.value || undefined })
            }
          />
        </div>
      );

    case "number":
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel} htmlFor={inputId}>
            {param.label}
            {optionalSuffix}
          </label>
          <input
            id={inputId}
            className={css.fieldInput}
            type="number"
            value={getParamStringValue(config, param.key)}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onChange({ [param.key]: undefined });
              } else {
                const n = Number(raw);
                onChange({ [param.key]: Number.isFinite(n) ? n : undefined });
              }
            }}
          />
        </div>
      );

    case "boolean":
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel}>
            <input
              id={inputId}
              type="checkbox"
              checked={
                config[param.key as keyof ValidationConfig] === undefined
                  ? true
                  : Boolean(config[param.key as keyof ValidationConfig])
              }
              onChange={(e) => onChange({ [param.key]: e.target.checked })}
              style={{ marginRight: "0.5rem" }}
            />
            {param.label}
            {optionalSuffix}
          </label>
        </div>
      );

    case "date":
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel} htmlFor={inputId}>
            {param.label}
            {optionalSuffix}
          </label>
          <input
            id={inputId}
            className={css.fieldInput}
            type="text"
            placeholder="DD/MM/YYYY"
            value={getParamStringValue(config, param.key)}
            onChange={(e) =>
              onChange({ [param.key]: e.target.value || undefined })
            }
          />
        </div>
      );

    case "string[]":
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel} htmlFor={inputId}>
            {param.label}
            {optionalSuffix}
          </label>
          <input
            id={inputId}
            className={css.fieldInput}
            type="text"
            placeholder="comma-separated values"
            value={getParamStringListValue(config, param.key)}
            onChange={(e) => {
              const raw = e.target.value;
              const items = raw
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              onChange({ [param.key]: items.length > 0 ? items : undefined });
            }}
          />
        </div>
      );

    case "fieldRef":
      return (
        <FieldRefPicker
          id={inputId}
          label={`${param.label}${optionalSuffix}`}
          value={getParamStringValue(config, param.key)}
          fieldRefs={fieldRefs}
          filterStepId={config.referenceStepId ?? config.targetStepId}
          onChange={(v) => onChange({ [param.key]: v || undefined })}
        />
      );

    case "stepRef":
      return (
        <StepRefPicker
          id={inputId}
          label={`${param.label}${optionalSuffix}`}
          value={getParamStringValue(config, param.key)}
          stepRefs={stepRefs}
          onChange={(v) => onChange({ [param.key]: v || undefined })}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultConfigFor(
  descriptor: ValidationRuleDescriptor,
): ValidationConfig {
  // For most rules, the value param is sensible to leave empty until the
  // user fills it in. `required` defaults to `true` so it has an immediate
  // effect even if the user hasn't touched the boolean.
  if (descriptor.type === "required") {
    return { value: true };
  }
  return {};
}

function getParamStringValue(config: ValidationConfig, key: string): string {
  const raw = config[key as keyof ValidationConfig];
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "";
}

function getParamStringListValue(
  config: ValidationConfig,
  key: string,
): string {
  const raw = config[key as keyof ValidationConfig];
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string") return raw;
  return "";
}
