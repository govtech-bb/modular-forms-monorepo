import React from "react";
import type {
  RecipeDraft,
  RecipeDraftAction,
  RecipeStepDraft,
  RecipeFieldDraft,
  RegistryCatalog,
} from "@govtech-bb/form-builder";
import type { Behaviour } from "@govtech-bb/form-types";
import { FieldPicker } from "./-field-picker";
import { FieldEditPanel } from "./-field-edit-panel";
import { BehavioursEditor } from "./-behaviours-editor";
import {
  countActiveOverrides,
  getFieldDisplayName,
  getFieldRefs,
  getStepRefs,
} from "./-recipe-refs";
import css from "../../styles/builder.module.css";

// Kebab-case: starts with a lowercase letter, followed by lowercase letters,
// digits, or hyphen-separated groups of the same. No leading/trailing/consecutive hyphens.
const STEP_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const STEP_ID_ERROR_MESSAGE =
  "Use lowercase letters, digits, and hyphens only. Must start with a letter (e.g. my-step, step-1).";

interface StepEditorProps {
  step: RecipeStepDraft;
  draft: RecipeDraft;
  dispatch: React.Dispatch<RecipeDraftAction>;
  catalog: RegistryCatalog;
  onStepIdChange: (oldId: string, newId: string) => void;
}

export function StepEditor({
  step,
  draft,
  dispatch,
  catalog,
  onStepIdChange,
}: StepEditorProps) {
  // Local state for the step ID input so we can show the typed value even when
  // it is invalid and the dispatch has been gated (i.e. store still holds the
  // last valid ID).
  const [localStepId, setLocalStepId] = React.useState(step.stepId);
  const [stepIdError, setStepIdError] = React.useState<string>("");

  // Which field, if any, is currently being edited in the overrides panel.
  const [editingFieldDraftId, setEditingFieldDraftId] = React.useState<
    string | null
  >(null);

  // Keep localStepId in sync when the selected step changes from the sidebar.
  React.useEffect(() => {
    setLocalStepId(step.stepId);
    setStepIdError("");
  }, [step.stepId]);

  // Close any open edit panel when the selected step changes.
  React.useEffect(() => {
    setEditingFieldDraftId(null);
  }, [step.stepId]);

  // Ref tables for the validation / behaviour editors. Computed from the
  // live draft + catalog so picker dropdowns always reflect current state.
  const fieldRefs = React.useMemo(
    () => getFieldRefs(draft, catalog),
    [draft, catalog],
  );
  const stepRefs = React.useMemo(() => getStepRefs(draft), [draft]);

  const editingField =
    editingFieldDraftId !== null
      ? (step.fields.find((f) => f._id === editingFieldDraftId) ?? null)
      : null;

  const handleMetaChange = (
    patch: Partial<Pick<RecipeStepDraft, "title" | "description">>,
  ) => {
    dispatch({ type: "UPDATE_STEP_META", stepId: step.stepId, patch });
  };

  const handleStepIdChange = (newStepId: string) => {
    // Always reflect what the user typed in the controlled input.
    setLocalStepId(newStepId);

    if (!STEP_ID_PATTERN.test(newStepId)) {
      // Invalid — show error and do NOT commit to the store.
      setStepIdError(STEP_ID_ERROR_MESSAGE);
      return;
    }

    // Valid — clear error and commit to the store.
    setStepIdError("");

    // Changing a stepId requires updating the step in-place via LOAD_DRAFT
    // since UPDATE_STEP_META does not support stepId mutation.
    const updatedSteps = draft.steps.map((s) =>
      s.stepId === step.stepId ? { ...s, stepId: newStepId } : s,
    );
    dispatch({ type: "LOAD_DRAFT", draft: { ...draft, steps: updatedSteps } });
    onStepIdChange(step.stepId, newStepId);
  };

  const handleAddField = (field: RecipeFieldDraft) => {
    dispatch({ type: "ADD_FIELD", stepId: step.stepId, field });
  };

  const handleRemoveField = (fieldDraftId: string) => {
    dispatch({ type: "REMOVE_FIELD", stepId: step.stepId, fieldDraftId });
  };

  const handleMoveFieldUp = (fieldId: string) => {
    const idx = step.fields.findIndex((f) => f._id === fieldId);
    if (idx <= 0) return;
    const orderedIds = step.fields.map((f) => f._id);
    [orderedIds[idx - 1], orderedIds[idx]] = [
      orderedIds[idx],
      orderedIds[idx - 1],
    ];
    dispatch({
      type: "REORDER_FIELDS",
      stepId: step.stepId,
      orderedIds,
    });
  };

  const handleMoveFieldDown = (fieldId: string) => {
    const idx = step.fields.findIndex((f) => f._id === fieldId);
    if (idx >= step.fields.length - 1) return;
    const orderedIds = step.fields.map((f) => f._id);
    [orderedIds[idx], orderedIds[idx + 1]] = [
      orderedIds[idx + 1],
      orderedIds[idx],
    ];
    dispatch({
      type: "REORDER_FIELDS",
      stepId: step.stepId,
      orderedIds,
    });
  };

  const handleStepBehavioursChange = (next: Behaviour[]) => {
    dispatch({
      type: "SET_STEP_BEHAVIOURS",
      stepId: step.stepId,
      behaviours: next,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Step metadata */}
      <div className={css.editorCard}>
        <div className={css.editorCardHeader}>
          <span className={css.editorCardHeading}>Step Metadata</span>
        </div>
        <div className={css.editorCardBody}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div
              className={css.fieldGroup}
              style={{ flex: "1", minWidth: "12rem" }}
            >
              <label
                className={css.fieldLabel}
                htmlFor={`step-id-${step.stepId}`}
              >
                Step ID
              </label>
              <input
                id={`step-id-${step.stepId}`}
                className={css.fieldInput}
                type="text"
                value={localStepId}
                onChange={(e) => handleStepIdChange(e.target.value)}
                placeholder="step-id"
                aria-describedby={
                  stepIdError ? `step-id-error-${step.stepId}` : undefined
                }
                aria-invalid={stepIdError ? true : undefined}
              />
              {stepIdError && (
                <span
                  id={`step-id-error-${step.stepId}`}
                  role="alert"
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--b-color-danger)",
                    lineHeight: 1.3,
                  }}
                >
                  {stepIdError}
                </span>
              )}
            </div>

            <div
              className={css.fieldGroup}
              style={{ flex: "2", minWidth: "16rem" }}
            >
              <label
                className={css.fieldLabel}
                htmlFor={`step-title-${step.stepId}`}
              >
                Title
              </label>
              <input
                id={`step-title-${step.stepId}`}
                className={css.fieldInput}
                type="text"
                value={step.title}
                onChange={(e) => handleMetaChange({ title: e.target.value })}
                placeholder="Step title"
              />
            </div>
          </div>

          <div className={css.fieldGroup}>
            <label
              className={css.fieldLabel}
              htmlFor={`step-desc-${step.stepId}`}
            >
              Description (optional)
            </label>
            <input
              id={`step-desc-${step.stepId}`}
              className={css.fieldInput}
              type="text"
              value={step.description ?? ""}
              onChange={(e) =>
                handleMetaChange({
                  description: e.target.value || undefined,
                })
              }
              placeholder="Short description shown above the step"
            />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className={css.editorCard}>
        <div className={css.editorCardHeader}>
          <span className={css.editorCardHeading}>
            Fields ({step.fields.length})
          </span>
        </div>
        <div className={css.editorCardBody}>
          {step.fields.length === 0 && (
            <div className={css.emptyState}>
              <p className={css.emptyStateHeading}>No fields yet</p>
              <p className={css.emptyStateBody}>
                Pick a component or block from the palette below to add it to
                this step.
              </p>
            </div>
          )}

          {step.fields.map((field, idx) => (
            <FieldRow
              key={field._id}
              field={field}
              displayName={getFieldDisplayName(field, catalog)}
              isFirst={idx === 0}
              isLast={idx === step.fields.length - 1}
              overrideCount={countActiveOverrides(field)}
              onRemove={() => handleRemoveField(field._id)}
              onMoveUp={() => handleMoveFieldUp(field._id)}
              onMoveDown={() => handleMoveFieldDown(field._id)}
              onEdit={() => setEditingFieldDraftId(field._id)}
            />
          ))}

          <div
            style={{
              borderTop:
                step.fields.length > 0
                  ? "1px solid var(--b-color-border)"
                  : undefined,
              paddingTop: step.fields.length > 0 ? "1rem" : undefined,
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--b-color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Add from palette
            </p>
            <FieldPicker catalog={catalog} onAddField={handleAddField} />
          </div>
        </div>
      </div>

      {/* Step-scoped behaviours */}
      <div className={css.editorCard}>
        <div className={css.editorCardHeader}>
          <span className={css.editorCardHeading}>
            Step behaviours ({step.behaviours.length})
          </span>
        </div>
        <div className={css.editorCardBody}>
          <BehavioursEditor
            scope="step"
            value={step.behaviours}
            onChange={handleStepBehavioursChange}
            fieldRefs={fieldRefs}
            stepRefs={stepRefs}
          />
        </div>
      </div>

      {/* Field-edit overrides panel */}
      {editingField !== null && (
        <FieldEditPanel
          draft={draft}
          catalog={catalog}
          step={step}
          field={editingField}
          dispatch={dispatch}
          onClose={() => setEditingFieldDraftId(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow — a single field entry in the step editor
// ---------------------------------------------------------------------------

interface FieldRowProps {
  field: RecipeFieldDraft;
  /**
   * Effective display name after applying overrides. For component / custom
   * fields this is the override label (or registry default); for blocks it
   * is the block's registry label. Computed by the parent so `FieldRow`
   * does not need a `catalog` dependency.
   */
  displayName: string;
  isFirst: boolean;
  isLast: boolean;
  overrideCount: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
}

function FieldRow({
  field,
  displayName,
  isFirst,
  isLast,
  overrideCount,
  onRemove,
  onMoveUp,
  onMoveDown,
  onEdit,
}: FieldRowProps) {
  return (
    <div className={css.fieldRow}>
      <div className={css.reorderBtns}>
        <button
          type="button"
          className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Move field up"
          title="Move up"
        >
          ^
        </button>
        <button
          type="button"
          className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Move field down"
          title="Move down"
        >
          v
        </button>
      </div>

      <div className={css.fieldRowInfo}>
        <span className={css.fieldRowLabel}>
          {displayName}
          {overrideCount > 0 && (
            <span
              className={css.overrideBadge}
              style={{ marginLeft: "0.5rem" }}
              title={`${overrideCount} override${
                overrideCount === 1 ? "" : "s"
              } active`}
            >
              {overrideCount} override{overrideCount === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className={css.fieldRowRef}>{field.ref}</span>
      </div>

      <span
        className={`${css.fieldRowKind} ${
          field.kind === "block"
            ? css.fieldRowKindBlock
            : css.fieldRowKindComponent
        }`}
      >
        {field.kind}
      </span>

      <button
        type="button"
        className={`${css.btn} ${css.btnSecondary} ${css.btnSm}`}
        onClick={onEdit}
        aria-label={`Edit field ${field.ref}`}
        title="Edit field overrides"
      >
        Edit
      </button>

      <button
        type="button"
        className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
        onClick={onRemove}
        aria-label={`Remove field ${field.ref}`}
        title="Remove field"
      >
        x
      </button>
    </div>
  );
}
