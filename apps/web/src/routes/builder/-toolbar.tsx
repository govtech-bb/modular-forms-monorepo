import React, { useState } from "react";
import type { RecipeDraft, RecipeDraftAction } from "@govtech-bb/form-builder";
import type { FormDefinitionSummary } from "@web/types";
import { FormPicker } from "./-form-picker";
import css from "../../styles/builder.module.css";

const FORM_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const FORM_ID_ERROR_MESSAGE =
  "Use lowercase letters, numbers, and hyphens only (e.g. birth-registration)";

function validateFormId(value: string): string {
  if (value.length > 0 && !FORM_ID_PATTERN.test(value)) {
    return FORM_ID_ERROR_MESSAGE;
  }
  return "";
}

interface ToolbarProps {
  draft: RecipeDraft;
  dispatch: React.Dispatch<RecipeDraftAction>;
  version: string;
  onVersionChange: (version: string) => void;
  onPreview: () => void;
  onValidate: () => void;
  onSubmit: () => void;
  isPreviewing: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  lastSaveStatus: "idle" | "success" | "error" | "submitted";
  forms: FormDefinitionSummary[];
  onFormSelect: (formId: string) => void;
  isPickerOpen: boolean;
  onNewForm: () => void;
  onPickerOpen: () => void;
  onPickerClose: () => void;
}

export function BuilderToolbar({
  draft,
  dispatch,
  version,
  onVersionChange,
  onPreview,
  onValidate,
  onSubmit,
  isPreviewing,
  isValidating,
  isSubmitting,
  canSubmit,
  lastSaveStatus,
  forms,
  onFormSelect,
  isPickerOpen,
  onNewForm,
  onPickerOpen,
  onPickerClose,
}: ToolbarProps) {
  const [formIdError, setFormIdError] = useState<string>("");

  return (
    <header className={css.toolbar}>
      <span className={css.toolbarTitle}>Form Builder</span>

      <span className={css.toolbarSeparator} />

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}
      >
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
            const raw = e.target.value;
            const value = raw
              .toLowerCase()
              .replace(/[\s_]+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .replace(/-{2,}/g, "-");
            setFormIdError(validateFormId(value));
            dispatch({
              type: "LOAD_DRAFT",
              draft: { ...draft, formId: value },
            });
          }}
          onBlur={(e) => {
            setFormIdError(validateFormId(e.target.value));
          }}
          aria-label="Form ID"
          aria-describedby={formIdError ? "builder-form-id-error" : undefined}
        />
        {formIdError && (
          <span
            id="builder-form-id-error"
            role="alert"
            style={{
              fontSize: "0.6875rem",
              color: "var(--b-color-danger)",
              lineHeight: 1.3,
              maxWidth: "10rem",
            }}
          >
            {formIdError}
          </span>
        )}
      </div>

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

      <label htmlFor="builder-version" className="sr-only">
        Version
      </label>
      <input
        id="builder-version"
        className={`${css.toolbarInput} ${css.toolbarInputNarrow}`}
        type="text"
        placeholder="e.g. 1.0.0"
        value={version}
        onChange={(e) => onVersionChange(e.target.value)}
        aria-label="Version"
        maxLength={20}
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
          onClick={onNewForm}
        >
          New Form
        </button>

        <button
          type="button"
          className={`${css.btn} ${css.btnSecondary}`}
          onClick={onPickerOpen}
          aria-haspopup="dialog"
        >
          Open existing form
        </button>

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

      <FormPicker
        forms={forms}
        onSelect={onFormSelect}
        onClose={onPickerClose}
        isOpen={isPickerOpen}
      />
    </header>
  );
}
