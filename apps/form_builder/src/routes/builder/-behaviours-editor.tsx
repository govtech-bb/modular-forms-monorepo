/**
 * Editor for a list of `Behaviour` entries — used for both field-scoped
 * behaviours (inside the field-edit panel) and step-scoped behaviours
 * (inside the step editor card).
 *
 * Behaviours are a discriminated union keyed by `type`. The set of
 * configurable parameters for each type is driven by
 * `BEHAVIOUR_TYPE_DESCRIPTORS`, so the UI does not hardcode the parameter
 * list per behaviour.
 */

import React from "react";
import type {
  Behaviour,
  EqualityOperations,
  FieldConditionalOnBehaviour,
  StepConditionalOnBehaviour,
  RepeatableBehaviour,
  FieldArrayBehaviour,
  SharedFieldsBehaviour,
} from "@govtech-bb/form-types";
import {
  BEHAVIOUR_TYPE_DESCRIPTORS,
  EQUALITY_OPERATOR_OPTIONS,
  type BehaviourTypeDescriptor,
  type BehaviourParam,
} from "@govtech-bb/form-builder";
import { FieldRefPicker, StepRefPicker } from "./-field-ref-picker";
import type { RecipeFieldRef, RecipeStepRef } from "./-recipe-refs";
import css from "../../styles/builder.module.css";

type BehaviourScope = "field" | "step";

interface BehavioursEditorProps {
  /** Which scope this editor is for — only matching descriptors are offered. */
  scope: BehaviourScope;
  value: Behaviour[];
  onChange: (next: Behaviour[]) => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
}

export function BehavioursEditor({
  scope,
  value,
  onChange,
  fieldRefs,
  stepRefs,
}: BehavioursEditorProps) {
  const applicable = React.useMemo(
    () =>
      BEHAVIOUR_TYPE_DESCRIPTORS.filter(
        (d) => d.scope === scope || d.scope === "both",
      ),
    [scope],
  );

  const [addType, setAddType] = React.useState<string>("");

  const handleAdd = () => {
    if (addType === "") return;
    const descriptor = applicable.find((d) => d.type === addType);
    if (descriptor === undefined) return;
    const next: Behaviour[] = [...value, defaultBehaviourFor(descriptor.type)];
    onChange(next);
    setAddType("");
  };

  const handleRemove = (index: number) => {
    const next: Behaviour[] = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleUpdate = (index: number, patch: Partial<Behaviour>) => {
    const next: Behaviour[] = value.map((b, i) =>
      i === index ? ({ ...b, ...patch } as Behaviour) : b,
    );
    onChange(next);
  };

  return (
    <div className={css.editorSubsection}>
      {value.length === 0 && (
        <p className={css.editorSubsectionEmpty}>No behaviours configured.</p>
      )}

      {value.map((behaviour, idx) => {
        const descriptor = applicable.find((d) => d.type === behaviour.type);
        if (descriptor === undefined) {
          // The behaviour exists but doesn't belong in this scope (e.g. a
          // step-scoped behaviour shown inside a field editor). Render a
          // read-only badge with a remove button so the user can clean up.
          return (
            <div key={idx} className={css.ruleRow}>
              <div className={css.ruleRowHeader}>
                <div>
                  <span className={css.ruleRowTitle}>
                    {behaviour.type} (wrong scope)
                  </span>
                </div>
                <button
                  type="button"
                  className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
                  onClick={() => handleRemove(idx)}
                  aria-label={`Remove ${behaviour.type} behaviour`}
                  title="Remove behaviour"
                >
                  x
                </button>
              </div>
            </div>
          );
        }
        return (
          <BehaviourRow
            key={`${behaviour.type}-${idx}`}
            descriptor={descriptor}
            behaviour={behaviour}
            onUpdate={(patch) => handleUpdate(idx, patch)}
            onRemove={() => handleRemove(idx)}
            fieldRefs={fieldRefs}
            stepRefs={stepRefs}
            rowKey={`${behaviour.type}-${idx}`}
          />
        );
      })}

      {applicable.length > 0 && (
        <div className={css.addRuleRow}>
          <select
            className={css.fieldInput}
            value={addType}
            onChange={(e) => setAddType(e.target.value)}
            aria-label="Behaviour to add"
          >
            <option value="">— add a behaviour —</option>
            {applicable.map((d) => (
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
            Add behaviour
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single behaviour row
// ---------------------------------------------------------------------------

interface BehaviourRowProps {
  descriptor: BehaviourTypeDescriptor;
  behaviour: Behaviour;
  onUpdate: (patch: Partial<Behaviour>) => void;
  onRemove: () => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
  rowKey: string;
}

function BehaviourRow({
  descriptor,
  behaviour,
  onUpdate,
  onRemove,
  fieldRefs,
  stepRefs,
  rowKey,
}: BehaviourRowProps) {
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
          aria-label={`Remove ${descriptor.label} behaviour`}
          title="Remove behaviour"
        >
          x
        </button>
      </div>
      <p className={css.ruleRowDescription}>{descriptor.description}</p>

      <div className={css.ruleRowParams}>
        {descriptor.params.map((param) => (
          <BehaviourParamInput
            key={param.key}
            param={param}
            behaviour={behaviour}
            onUpdate={onUpdate}
            fieldRefs={fieldRefs}
            stepRefs={stepRefs}
            rowKey={rowKey}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single parameter input
// ---------------------------------------------------------------------------

interface BehaviourParamInputProps {
  param: BehaviourParam;
  behaviour: Behaviour;
  onUpdate: (patch: Partial<Behaviour>) => void;
  fieldRefs: RecipeFieldRef[];
  stepRefs: RecipeStepRef[];
  rowKey: string;
}

function BehaviourParamInput({
  param,
  behaviour,
  onUpdate,
  fieldRefs,
  stepRefs,
  rowKey,
}: BehaviourParamInputProps) {
  const inputId = `bparam-${rowKey}-${param.key}`;
  const optionalSuffix = param.optional ? " (optional)" : "";

  // Safely read the current value for this param from the discriminated
  // union via an indexed access on a Record cast.
  const raw = (behaviour as unknown as Record<string, unknown>)[param.key];

  switch (param.inputType) {
    case "string":
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
            value={readString(raw)}
            onChange={(e) =>
              onUpdate({
                [param.key]: e.target.value,
              } as Partial<Behaviour>)
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
            value={readString(raw)}
            onChange={(e) => {
              const v = e.target.value;
              const n = v === "" ? undefined : Number(v);
              onUpdate({
                [param.key]: n,
              } as Partial<Behaviour>);
            }}
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
            value={Array.isArray(raw) ? raw.join(", ") : readString(raw)}
            onChange={(e) => {
              const items = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              onUpdate({
                [param.key]: items,
              } as Partial<Behaviour>);
            }}
          />
        </div>
      );

    case "operator": {
      const current = readString(raw);
      return (
        <div className={css.fieldGroup}>
          <label className={css.fieldLabel} htmlFor={inputId}>
            {param.label}
            {optionalSuffix}
          </label>
          <select
            id={inputId}
            className={css.fieldInput}
            value={current}
            onChange={(e) =>
              onUpdate({
                [param.key]: e.target.value as EqualityOperations,
              } as Partial<Behaviour>)
            }
          >
            <option value="">— select —</option>
            {EQUALITY_OPERATOR_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case "fieldRef": {
      const targetStepId = (behaviour as unknown as { targetStepId?: string })
        .targetStepId;
      return (
        <FieldRefPicker
          id={inputId}
          label={`${param.label}${optionalSuffix}`}
          value={readString(raw)}
          fieldRefs={fieldRefs}
          filterStepId={targetStepId}
          onChange={(v) =>
            onUpdate({
              [param.key]: v,
            } as Partial<Behaviour>)
          }
        />
      );
    }

    case "stepRef":
      return (
        <StepRefPicker
          id={inputId}
          label={`${param.label}${optionalSuffix}`}
          value={readString(raw)}
          stepRefs={stepRefs}
          onChange={(v) =>
            onUpdate({
              [param.key]: v || undefined,
            } as Partial<Behaviour>)
          }
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "";
}

function defaultBehaviourFor(type: string): Behaviour {
  switch (type) {
    case "fieldConditionalOn":
      return {
        type: "fieldConditionalOn",
        targetFieldId: "",
        operator: "equal",
        value: "",
      } satisfies FieldConditionalOnBehaviour;
    case "stepConditionalOn":
      return {
        type: "stepConditionalOn",
        targetFieldId: "",
        targetStepId: "",
        operator: "equal",
        value: "",
      } satisfies StepConditionalOnBehaviour;
    case "repeatable":
      return {
        type: "repeatable",
        min: 1,
        max: 1,
      } satisfies RepeatableBehaviour;
    case "fieldArray":
      return {
        type: "fieldArray",
        min: 1,
        max: 1,
      } satisfies FieldArrayBehaviour;
    case "sharedFields":
      return {
        type: "sharedFields",
        fieldIds: [],
      } satisfies SharedFieldsBehaviour;
    default:
      // Defensive — should never happen because the dropdown only offers
      // known types. Fall back to an empty `repeatable` so the type system
      // stays happy.
      return {
        type: "repeatable",
        min: 1,
        max: 1,
      } satisfies RepeatableBehaviour;
  }
}
