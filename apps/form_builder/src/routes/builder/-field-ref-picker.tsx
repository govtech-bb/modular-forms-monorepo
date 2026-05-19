/**
 * Pickers for selecting a step or field reference from the current recipe.
 *
 * Used by validation-rule and behaviour editors when the rule/behaviour
 * targets another field (e.g. `fieldConditionalOn.targetFieldId`,
 * `validations.equal.referenceFieldId`).
 *
 * Renders a native `<select>` populated from the live recipe draft, so the
 * user can only pick fields that actually exist.
 */

import type { RecipeFieldRef, RecipeStepRef } from "./-recipe-refs";
import css from "../../styles/builder.module.css";

interface StepRefPickerProps {
  id?: string;
  label: string;
  value: string;
  stepRefs: RecipeStepRef[];
  /** Allow the empty option ("— none —"). Defaults to true. */
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange: (stepId: string) => void;
  disabled?: boolean;
}

export function StepRefPicker({
  id,
  label,
  value,
  stepRefs,
  allowEmpty = true,
  emptyLabel = "— none —",
  onChange,
  disabled,
}: StepRefPickerProps) {
  return (
    <div className={css.fieldGroup}>
      {label && (
        <label className={css.fieldLabel} htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={css.fieldInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {stepRefs.map((s) => (
          <option key={s.stepId} value={s.stepId}>
            {s.title || "Untitled"} ({s.stepId})
          </option>
        ))}
      </select>
    </div>
  );
}

interface FieldRefPickerProps {
  id?: string;
  label: string;
  value: string;
  fieldRefs: RecipeFieldRef[];
  /** Optional step ID to filter by. */
  filterStepId?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange: (fieldId: string) => void;
  disabled?: boolean;
}

export function FieldRefPicker({
  id,
  label,
  value,
  fieldRefs,
  filterStepId,
  allowEmpty = true,
  emptyLabel = "— none —",
  onChange,
  disabled,
}: FieldRefPickerProps) {
  const filtered =
    filterStepId !== undefined && filterStepId !== ""
      ? fieldRefs.filter((f) => f.stepId === filterStepId)
      : fieldRefs;

  return (
    <div className={css.fieldGroup}>
      {label && (
        <label className={css.fieldLabel} htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={css.fieldInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {filtered.map((f) => (
          <option
            key={`${f.stepId}.${f.fieldDraftId}.${f.fieldId}`}
            value={f.fieldId}
          >
            {f.label || f.fieldId} — {f.stepId}.{f.fieldId} ({f.htmlType})
          </option>
        ))}
      </select>
    </div>
  );
}
