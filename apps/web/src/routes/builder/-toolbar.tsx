import React from "react";
import type { RecipeDraft, RecipeDraftAction } from "@govtech-bb/form-builder";
import css from "../../styles/builder.module.css";

interface ToolbarProps {
  draft: RecipeDraft;
  dispatch: React.Dispatch<RecipeDraftAction>;
  onPreview: () => void;
  onValidate: () => void;
  onSubmit: () => void;
  isPreviewing: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  lastSaveStatus: "idle" | "success" | "error" | "submitted";
}

export function BuilderToolbar({
  draft,
  dispatch,
  onPreview,
  onValidate,
  onSubmit,
  isPreviewing,
  isValidating,
  isSubmitting,
  canSubmit,
  lastSaveStatus,
}: ToolbarProps) {
  return (
    <header className={css.toolbar}>
      <span className={css.toolbarTitle}>Form Builder</span>

      <span className={css.toolbarSeparator} />

      <label htmlFor="builder-form-id" className="sr-only">
        Form ID
      </label>
      <input
        id="builder-form-id"
        className={`${css.toolbarInput} ${css.toolbarInputNarrow}`}
        type="text"
        placeholder="form-id"
        value={draft.formId}
        onChange={(e) => {
          dispatch({
            type: "LOAD_DRAFT",
            draft: { ...draft, formId: e.target.value },
          });
        }}
        aria-label="Form ID"
      />

      <label htmlFor="builder-title" className="sr-only">
        Form title
      </label>
      <input
        id="builder-title"
        className={`${css.toolbarInput} ${css.toolbarInputWide}`}
        type="text"
        placeholder="Form title"
        value={draft.title}
        onChange={(e) => {
          dispatch({
            type: "LOAD_DRAFT",
            draft: { ...draft, title: e.target.value },
          });
        }}
        aria-label="Form title"
      />

      {lastSaveStatus !== "idle" && (
        <span className={css.statusBar} aria-live="polite">
          <span
            className={`${css.statusDot} ${
              lastSaveStatus === "success" || lastSaveStatus === "submitted"
                ? css.statusDotSuccess
                : css.statusDotError
            }`}
          />
          {lastSaveStatus === "success"
            ? "Validated"
            : lastSaveStatus === "submitted"
              ? "Submitted"
              : "Validation failed"}
        </span>
      )}

      <div className={css.toolbarActions}>
        <button
          type="button"
          className={`${css.btn} ${css.btnSecondary}`}
          onClick={onValidate}
          disabled={isValidating}
          aria-busy={isValidating}
        >
          {isValidating ? "Validating..." : "Validate"}
        </button>

        <button
          type="button"
          className={`${css.btn} ${css.btnSecondary}`}
          onClick={onPreview}
          disabled={isPreviewing}
          aria-busy={isPreviewing}
        >
          {isPreviewing ? "Loading..." : "Preview"}
        </button>

        <button
          type="button"
          className={`${css.btn} ${css.btnPrimary}`}
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          aria-busy={isSubmitting}
          title={
            !canSubmit
              ? "Validate the recipe first before submitting"
              : undefined
          }
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </header>
  );
}
