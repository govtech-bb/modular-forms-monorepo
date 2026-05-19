import React from "react";
import type {
  RecipeDraft,
  RecipeDraftAction,
  RecipeStepDraft,
} from "@govtech-bb/form-builder";
import css from "../../styles/builder.module.css";

interface StepListProps {
  draft: RecipeDraft;
  dispatch: React.Dispatch<RecipeDraftAction>;
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

let _stepCounter = 0;

function generateStepId(): string {
  return `step-${Date.now()}-${++_stepCounter}`;
}

function makeNewStep(): RecipeStepDraft {
  return {
    stepId: generateStepId(),
    title: "New Step",
    description: undefined,
    fields: [],
    behaviours: [],
  };
}

export function StepList({
  draft,
  dispatch,
  selectedStepId,
  onSelectStep,
}: StepListProps) {
  const steps = draft.steps;

  const handleAddStep = () => {
    const newStep = makeNewStep();
    dispatch({ type: "ADD_STEP", payload: newStep });
    onSelectStep(newStep.stepId);
  };

  const handleRemoveStep = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    dispatch({ type: "REMOVE_STEP", stepId });
    if (selectedStepId === stepId) {
      // Try to select a neighbouring step
      const idx = steps.findIndex((s) => s.stepId === stepId);
      const next = steps[idx + 1] ?? steps[idx - 1];
      onSelectStep(next?.stepId ?? "");
    }
  };

  const handleMoveUp = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const idx = steps.findIndex((s) => s.stepId === stepId);
    if (idx <= 0) return;
    const orderedIds = steps.map((s) => s.stepId);
    [orderedIds[idx - 1], orderedIds[idx]] = [
      orderedIds[idx],
      orderedIds[idx - 1],
    ];
    dispatch({ type: "REORDER_STEPS", orderedIds });
  };

  const handleMoveDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const idx = steps.findIndex((s) => s.stepId === stepId);
    if (idx >= steps.length - 1) return;
    const orderedIds = steps.map((s) => s.stepId);
    [orderedIds[idx], orderedIds[idx + 1]] = [
      orderedIds[idx + 1],
      orderedIds[idx],
    ];
    dispatch({ type: "REORDER_STEPS", orderedIds });
  };

  return (
    <aside className={css.sidebar}>
      <div className={css.sidebarSection}>
        <div className={css.sidebarHeader}>
          <span className={css.sidebarHeading}>Steps</span>
          <button
            type="button"
            className={`${css.btn} ${css.btnPrimary} ${css.btnSm}`}
            onClick={handleAddStep}
            aria-label="Add step"
          >
            + Add
          </button>
        </div>

        <div className={css.sidebarList} role="listbox" aria-label="Form steps">
          {steps.length === 0 && (
            <div className={css.emptyState}>
              <p className={css.emptyStateBody}>
                No steps yet. Add one to start.
              </p>
            </div>
          )}

          {steps.map((step, idx) => (
            <div
              key={step.stepId}
              role="option"
              aria-selected={step.stepId === selectedStepId}
              className={`${css.stepItem} ${
                step.stepId === selectedStepId ? css.stepItemActive : ""
              }`}
              onClick={() => onSelectStep(step.stepId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStep(step.stepId);
                }
              }}
              tabIndex={0}
            >
              <div className={css.reorderBtns}>
                <button
                  type="button"
                  className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
                  onClick={(e) => handleMoveUp(e, step.stepId)}
                  disabled={idx === 0}
                  aria-label={`Move step "${step.title}" up`}
                  title="Move up"
                >
                  ^
                </button>
                <button
                  type="button"
                  className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
                  onClick={(e) => handleMoveDown(e, step.stepId)}
                  disabled={idx === steps.length - 1}
                  aria-label={`Move step "${step.title}" down`}
                  title="Move down"
                >
                  v
                </button>
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <div className={css.stepItemLabel}>
                  {step.title || (
                    <span className={css.stepItemMuted}>Untitled step</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--b-color-text-muted)",
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.stepId}
                </div>
              </div>

              <button
                type="button"
                className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
                onClick={(e) => handleRemoveStep(e, step.stepId)}
                aria-label={`Remove step "${step.title}"`}
                title="Remove step"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
