/**
 * Field edit panel — a modal that edits the `overrides` on a single
 * `RecipeFieldDraft`.
 *
 * For component / custom fields:
 *   `overrides: FieldOverrides`
 *
 * For block fields:
 *   `overrides: Record<childFieldId, FieldOverrides>`
 *
 * The panel reads the registry catalog to render placeholder/default values
 * (so the user knows what they are overriding) and dispatches
 * `UPDATE_FIELD_OVERRIDES` to commit changes.
 */

import React from "react";
import type {
  RecipeDraft,
  RecipeDraftAction,
  RecipeStepDraft,
  RecipeFieldDraft,
  RegistryCatalog,
  PrimitiveRegistryItem,
  CustomRegistryItem,
  BlockRegistryItem,
} from "@govtech-bb/form-builder";
import type {
  FieldOverrides,
  Behaviour,
  ValidationRule,
  Option,
  HtmlTypes,
} from "@govtech-bb/form-types";
import { ValidationRulesEditor } from "./-validation-rules-editor";
import { BehavioursEditor } from "./-behaviours-editor";
import { getFieldRefs, getStepRefs, findRegistryItem } from "./-recipe-refs";
import css from "../../styles/builder.module.css";

interface FieldEditPanelProps {
  draft: RecipeDraft;
  catalog: RegistryCatalog;
  step: RecipeStepDraft;
  field: RecipeFieldDraft;
  dispatch: React.Dispatch<RecipeDraftAction>;
  onClose: () => void;
}

export function FieldEditPanel({
  draft,
  catalog,
  step,
  field,
  dispatch,
  onClose,
}: FieldEditPanelProps) {
  const item = findRegistryItem(catalog, field.ref);

  const fieldRefs = React.useMemo(
    () => getFieldRefs(draft, catalog),
    [draft, catalog],
  );
  const stepRefs = React.useMemo(() => getStepRefs(draft), [draft]);

  const handleUpdateOverrides = (next: RecipeFieldDraft["overrides"]) => {
    dispatch({
      type: "UPDATE_FIELD_OVERRIDES",
      stepId: step.stepId,
      fieldDraftId: field._id,
      overrides: next,
    });
  };

  return (
    <div
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit field ${field.ref}`}
      onClick={onClose}
    >
      <div
        className={css.modalBox}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "720px" }}
      >
        <div className={css.modalHeader}>
          <div>
            <span className={css.modalTitle}>Edit field</span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--b-color-text-muted)",
                fontFamily: "monospace",
                marginLeft: "0.75rem",
              }}
            >
              {field.ref}
            </span>
          </div>
          <button
            type="button"
            className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
            onClick={onClose}
            aria-label="Close edit panel"
          >
            Close
          </button>
        </div>

        <div className={css.modalBody}>
          {item === undefined && (
            <p className={css.editorSubsectionEmpty}>
              The registry item for this ref could not be found. Overrides
              cannot be edited until the registry is reloaded.
            </p>
          )}

          {item !== undefined && item.kind === "block" && (
            <BlockOverridesEditor
              item={item}
              field={field}
              fieldRefs={fieldRefs}
              stepRefs={stepRefs}
              onChange={handleUpdateOverrides}
            />
          )}

          {item !== undefined && item.kind !== "block" && (
            <ComponentOverridesEditor
              item={item}
              field={field}
              fieldRefs={fieldRefs}
              stepRefs={stepRefs}
              onChange={handleUpdateOverrides}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component / custom override editor
// ---------------------------------------------------------------------------

interface ComponentOverridesEditorProps {
  item: PrimitiveRegistryItem | CustomRegistryItem;
  field: RecipeFieldDraft;
  fieldRefs: ReturnType<typeof getFieldRefs>;
  stepRefs: ReturnType<typeof getStepRefs>;
  onChange: (next: FieldOverrides) => void;
}

function ComponentOverridesEditor({
  item,
  field,
  fieldRefs,
  stepRefs,
  onChange,
}: ComponentOverridesEditorProps) {
  const overrides = (field.overrides as FieldOverrides | undefined) ?? {};
  const base = item.defaultDefinition;

  const patch = (next: Partial<FieldOverrides>) => {
    const merged: FieldOverrides = { ...overrides, ...next };
    // Strip undefined entries to keep the saved overrides tidy.
    const tidy: FieldOverrides = {};
    (Object.keys(merged) as (keyof FieldOverrides)[]).forEach((k) => {
      const value = merged[k];
      if (value !== undefined && value !== "") {
        // Cast through unknown: each key on `merged` is `FieldOverrides[k]`,
        // so writing it back to `tidy` at the same key is type-correct.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tidy as any)[k] = value;
      }
    });
    onChange(tidy);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Section title="Display">
        <PropOverrideInput
          label="Field ID"
          placeholder={item.fieldId}
          value={overrides.fieldId ?? ""}
          onChange={(v) => patch({ fieldId: v || undefined })}
        />
        <PropOverrideInput
          label="Label"
          placeholder={base.label}
          value={overrides.label ?? ""}
          onChange={(v) => patch({ label: v || undefined })}
        />
        <PropOverrideInput
          label="Placeholder"
          placeholder={base.placeholder ?? "(no default)"}
          value={overrides.placeholder ?? ""}
          onChange={(v) => patch({ placeholder: v || undefined })}
        />
        <PropOverrideInput
          label="Hint"
          placeholder={base.hint ?? "(no default)"}
          value={overrides.hint ?? ""}
          onChange={(v) => patch({ hint: v || undefined })}
        />
      </Section>

      <Section title="Flags">
        <FlagToggle
          label="Disabled"
          value={overrides.isDisabled}
          baseValue={base.isDisabled ?? false}
          onChange={(v) => patch({ isDisabled: v })}
        />
        <FlagToggle
          label="Hidden"
          value={overrides.isHidden}
          baseValue={base.isHidden ?? false}
          onChange={(v) => patch({ isHidden: v })}
        />
      </Section>

      {item.hasOptions && (
        <Section title="Options">
          <OptionsEditor
            options={overrides.options ?? base.options ?? []}
            isOverridden={overrides.options !== undefined}
            onChange={(opts) =>
              patch({ options: opts.length > 0 ? opts : undefined })
            }
          />
        </Section>
      )}

      <Section title="Validation rules">
        <ValidationRulesEditor
          htmlType={item.htmlType as HtmlTypes}
          value={overrides.validations ?? ({} as ValidationRule)}
          onChange={(next) => {
            const hasAny = Object.keys(next).length > 0;
            patch({ validations: hasAny ? next : undefined });
          }}
          fieldRefs={fieldRefs}
          stepRefs={stepRefs}
          fieldName={overrides.label ?? base.label}
        />
      </Section>

      <Section title="Behaviours">
        <BehavioursEditor
          scope="field"
          value={overrides.behaviours ?? []}
          onChange={(next) =>
            patch({ behaviours: next.length > 0 ? next : undefined })
          }
          fieldRefs={fieldRefs}
          stepRefs={stepRefs}
        />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block override editor
// ---------------------------------------------------------------------------

interface BlockOverridesEditorProps {
  item: BlockRegistryItem;
  field: RecipeFieldDraft;
  fieldRefs: ReturnType<typeof getFieldRefs>;
  stepRefs: ReturnType<typeof getStepRefs>;
  onChange: (next: Record<string, FieldOverrides>) => void;
}

function BlockOverridesEditor({
  item,
  field,
  fieldRefs,
  stepRefs,
  onChange,
}: BlockOverridesEditorProps) {
  const blockOverrides =
    (field.overrides as Record<string, FieldOverrides> | undefined) ?? {};

  const patchChild = (
    childFieldId: string,
    childPatch: Partial<FieldOverrides>,
  ) => {
    const current = blockOverrides[childFieldId] ?? {};
    const merged: FieldOverrides = { ...current, ...childPatch };
    // Strip empty values within the child override.
    const tidy: FieldOverrides = {};
    (Object.keys(merged) as (keyof FieldOverrides)[]).forEach((k) => {
      const value = merged[k];
      if (value !== undefined && value !== "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tidy as any)[k] = value;
      }
    });

    const next: Record<string, FieldOverrides> = { ...blockOverrides };
    if (Object.keys(tidy).length === 0) {
      delete next[childFieldId];
    } else {
      next[childFieldId] = tidy;
    }
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--b-color-text-muted)",
        }}
      >
        This is a block — overrides are scoped per child field below.
      </p>

      {item.elements.map((child) => {
        const childOverrides = blockOverrides[child.fieldId] ?? {};
        return (
          <Section
            key={child.fieldId}
            title={`${child.label} — ${child.fieldId}`}
          >
            <PropOverrideInput
              label="Label"
              placeholder={child.defaultDefinition.label}
              value={childOverrides.label ?? ""}
              onChange={(v) =>
                patchChild(child.fieldId, { label: v || undefined })
              }
            />
            <PropOverrideInput
              label="Placeholder"
              placeholder={
                child.defaultDefinition.placeholder ?? "(no default)"
              }
              value={childOverrides.placeholder ?? ""}
              onChange={(v) =>
                patchChild(child.fieldId, { placeholder: v || undefined })
              }
            />
            <PropOverrideInput
              label="Hint"
              placeholder={child.defaultDefinition.hint ?? "(no default)"}
              value={childOverrides.hint ?? ""}
              onChange={(v) =>
                patchChild(child.fieldId, { hint: v || undefined })
              }
            />
            <div className={css.editorSubsectionSubheading}>
              Validation rules
            </div>
            <ValidationRulesEditor
              htmlType={child.htmlType as HtmlTypes}
              value={childOverrides.validations ?? ({} as ValidationRule)}
              onChange={(next) => {
                const hasAny = Object.keys(next).length > 0;
                patchChild(child.fieldId, {
                  validations: hasAny ? next : undefined,
                });
              }}
              fieldRefs={fieldRefs}
              stepRefs={stepRefs}
              fieldName={childOverrides.label ?? child.defaultDefinition.label}
            />
            <div className={css.editorSubsectionSubheading}>Behaviours</div>
            <BehavioursEditor
              scope="field"
              value={childOverrides.behaviours ?? []}
              onChange={(next: Behaviour[]) =>
                patchChild(child.fieldId, {
                  behaviours: next.length > 0 ? next : undefined,
                })
              }
              fieldRefs={fieldRefs}
              stepRefs={stepRefs}
            />
          </Section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={css.editorSubsection}>
      <h3 className={css.editorSubsectionHeading}>{title}</h3>
      {children}
    </section>
  );
}

interface PropOverrideInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}

function PropOverrideInput({
  label,
  placeholder,
  value,
  onChange,
}: PropOverrideInputProps) {
  const inputId = `override-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={css.fieldGroup}>
      <label className={css.fieldLabel} htmlFor={inputId}>
        {label}{" "}
        {value && (
          <span className={css.overrideBadge} aria-label="overridden">
            overridden
          </span>
        )}
      </label>
      <input
        id={inputId}
        className={css.fieldInput}
        type="text"
        placeholder={`Default: ${placeholder}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface FlagToggleProps {
  label: string;
  value: boolean | undefined;
  baseValue: boolean;
  onChange: (next: boolean | undefined) => void;
}

function FlagToggle({ label, value, baseValue, onChange }: FlagToggleProps) {
  const effective = value ?? baseValue;
  return (
    <div className={css.fieldGroup}>
      <label className={css.fieldLabel}>
        <input
          type="checkbox"
          checked={effective}
          onChange={(e) => {
            const checked = e.target.checked;
            // If the chosen value matches the base, clear the override.
            if (checked === baseValue) {
              onChange(undefined);
            } else {
              onChange(checked);
            }
          }}
          style={{ marginRight: "0.5rem" }}
        />
        {label}
        {value !== undefined && (
          <span className={css.overrideBadge} style={{ marginLeft: "0.5rem" }}>
            overridden
          </span>
        )}
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Options editor
// ---------------------------------------------------------------------------

interface OptionsEditorProps {
  options: Option[];
  isOverridden: boolean;
  onChange: (next: Option[]) => void;
}

function OptionsEditor({
  options,
  isOverridden,
  onChange,
}: OptionsEditorProps) {
  const handleEdit = (idx: number, patch: Partial<Option>) => {
    const next = options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    onChange(next);
  };

  const handleRemove = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleAdd = () => {
    const next: Option[] = [...options, { label: "", value: "" }];
    onChange(next);
  };

  return (
    <div className={css.editorSubsection}>
      {isOverridden && (
        <span className={css.overrideBadge} style={{ alignSelf: "flex-start" }}>
          overridden
        </span>
      )}
      {options.length === 0 && (
        <p className={css.editorSubsectionEmpty}>No options.</p>
      )}
      {options.map((option, idx) => (
        <div key={idx} className={css.optionRow}>
          <input
            className={css.fieldInput}
            type="text"
            placeholder="Label"
            value={option.label}
            onChange={(e) => handleEdit(idx, { label: e.target.value })}
            aria-label={`Option ${idx + 1} label`}
          />
          <input
            className={css.fieldInput}
            type="text"
            placeholder="Value"
            value={option.value}
            onChange={(e) => handleEdit(idx, { value: e.target.value })}
            aria-label={`Option ${idx + 1} value`}
          />
          <button
            type="button"
            className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
            onClick={() => handleRemove(idx)}
            aria-label={`Remove option ${idx + 1}`}
          >
            x
          </button>
        </div>
      ))}
      <button
        type="button"
        className={`${css.btn} ${css.btnSecondary} ${css.btnSm}`}
        onClick={handleAdd}
        style={{ alignSelf: "flex-start" }}
      >
        + Add option
      </button>
    </div>
  );
}
