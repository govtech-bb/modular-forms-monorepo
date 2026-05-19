import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type {
  RegistryCatalog,
  RecipeValidateResponse,
} from "@govtech-bb/form-builder";
import {
  serializeRecipeDraft,
  deserializeRecipe,
} from "@govtech-bb/form-builder";
import type { ServiceContract } from "@govtech-bb/form-types";
import {
  fetchCatalog,
  fetchRecipeApi,
  fetchNextVersionApi,
  validateRecipeApi,
  previewRecipeApi,
  submitRecipeApi,
  updateRecipeApi,
} from "../../lib/api/registry";
import { FormFetchError, fetchFormDefinitions } from "../../lib/api/forms";
import { bumpMinor } from "../../lib/version";
import type { FormDefinitionSummary } from "@builder/types";
import { recipeDraftReducer, emptyDraft } from "./-recipe-reducer";
import { BuilderToolbar } from "./-toolbar";
import { StepList } from "./-step-list";
import { StepEditor } from "./-step-editor";
import { ValidationPanel } from "./-validation-panel";
import { PreviewModal } from "./-preview-modal";
import { SubmitModal } from "./-submit-modal";
import css from "../../styles/builder.module.css";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export interface BuilderLoaderData {
  catalog: RegistryCatalog;
  forms: FormDefinitionSummary[];
}

export const Route = createFileRoute("/builder/")({
  component: BuilderPage,
  loader: async (): Promise<BuilderLoaderData> => {
    const [catalog, forms] = await Promise.all([
      fetchCatalog(),
      fetchFormDefinitions(),
    ]);
    return { catalog, forms };
  },
  errorComponent: BuilderError,
});

// ---------------------------------------------------------------------------
// Builder Page
// ---------------------------------------------------------------------------

function BuilderPage() {
  const { catalog, forms } = Route.useLoaderData();

  const [draft, dispatch] = React.useReducer(recipeDraftReducer, emptyDraft());

  const [selectedStepId, setSelectedStepId] = React.useState<string>("");

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [previewContract, setPreviewContract] =
    React.useState<ServiceContract | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  // Validate state
  const [isValidating, setIsValidating] = React.useState(false);
  const [validateResult, setValidateResult] =
    React.useState<RecipeValidateResponse | null>(null);
  const [lastSaveStatus, setLastSaveStatus] = React.useState<
    "idle" | "success" | "error" | "submitted"
  >("idle");

  // Submit state
  const [version, setVersion] = React.useState("1.0.0");
  const [currentVersion, setCurrentVersion] = React.useState<string | null>(
    null,
  );
  const [isSubmitOpen, setIsSubmitOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // Form picker state
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  // Loaded-form identity (null = new form, string = editing existing).
  const [loadedFromId, setLoadedFromId] = React.useState<string | null>(null);
  // loadedVersion is retained for future use (e.g. conflict detection).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadedVersion, setLoadedVersion] = React.useState<string | null>(null);

  // Form load async state
  const [isLoadingForm, setIsLoadingForm] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const selectedStep =
    draft.steps.find((s) => s.stepId === selectedStepId) ?? null;

  const canSubmit = validateResult?.valid === true;

  // ---------------------------------------------------------------------------
  // Auto-versioning: debounced fetch when formId changes on a new form
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (loadedFromId !== null) return; // editing a loaded form; version already set
    if (!draft.formId) {
      setVersion("1.0.0");
      return;
    }
    const timer = setTimeout(() => {
      void fetchNextVersionApi(draft.formId)
        .then(({ nextVersion, currentVersion: cv }) => {
          setVersion(nextVersion);
          setCurrentVersion(cv);
        })
        .catch(() => {}); // fail silently; current version display stays
    }, 300);
    return () => clearTimeout(timer);
  }, [draft.formId, loadedFromId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId);
  };

  /**
   * When a step ID is changed by the editor, update selectedStepId to follow.
   */
  const handleStepIdChange = (_oldId: string, newId: string) => {
    setSelectedStepId(newId);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewContract(null);
    setIsPreviewOpen(true);
    try {
      const recipe = serializeRecipeDraft(draft);
      const contract = await previewRecipeApi(recipe);
      setPreviewContract(contract);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidateResult(null);
    try {
      const recipe = serializeRecipeDraft(draft);
      const result = await validateRecipeApi(recipe);
      setValidateResult(result);
      setLastSaveStatus(result.valid ? "success" : "error");
    } catch (err) {
      setLastSaveStatus("error");
      setValidateResult({
        valid: false,
        issues: [
          {
            path: "",
            message:
              err instanceof Error ? err.message : "Validation request failed.",
          },
        ],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleDismissValidation = () => {
    setValidateResult(null);
    setLastSaveStatus("idle");
  };

  const handleOpenSubmit = () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitOpen(true);
  };

  const handleCloseSubmit = () => {
    setIsSubmitOpen(false);
  };

  /**
   * Called when the user selects a form in the picker.
   * Fetches the recipe from the API, deserializes it, and loads it into the
   * reducer. The picker is already closed by FormPicker before this fires.
   */
  const handleFormSelect = async (formId: string) => {
    // Guard: confirm before discarding an in-progress draft
    if (
      (draft.steps.length > 0 || draft.formId !== "") &&
      !window.confirm(
        "Opening a new form will discard your current draft. Continue?",
      )
    ) {
      return;
    }

    setIsLoadingForm(true);
    setLoadError(null);
    // Ensure the picker is closed (FormPicker already does this, but be safe)
    setIsPickerOpen(false);

    try {
      const recipe = await fetchRecipeApi(formId);
      const recipeDraft = deserializeRecipe(recipe);

      dispatch({ type: "LOAD_DRAFT", draft: recipeDraft });

      // Reset transient UI state
      setSelectedStepId("");
      setValidateResult(null);
      setLastSaveStatus("idle");
      setSubmitError(null);
      setSubmitSuccess(false);

      // Compute the next version automatically from the API
      try {
        const { nextVersion, currentVersion: cv } =
          await fetchNextVersionApi(formId);
        setVersion(nextVersion);
        setCurrentVersion(cv);
      } catch {
        setVersion(bumpMinor(recipe.version));
        setCurrentVersion(recipe.version);
        setLoadError(
          "Could not compute next version automatically. Using a best-guess increment.",
        );
      }

      // Record the loaded form's identity for W4 (update vs submit)
      setLoadedFromId(formId);
      setLoadedVersion(recipe.version);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load the selected form. Please try again.",
      );
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleNewForm = () => {
    if (
      (draft.steps.length > 0 || draft.formId !== "") &&
      !window.confirm(
        "Starting a new form will discard your current draft. Continue?",
      )
    ) {
      return;
    }

    dispatch({ type: "RESET" });
    setSelectedStepId("");
    setLoadedFromId(null);
    setLoadedVersion(null);
    setVersion("1.0.0");
    setCurrentVersion(null);
    setValidateResult(null);
    setLastSaveStatus("idle");
    setSubmitError(null);
    setSubmitSuccess(false);
    setLoadError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const recipe = serializeRecipeDraft(draft, { version });

      if (loadedFromId !== null && loadedFromId === draft.formId) {
        // UPDATE path — overwrite the existing form definition
        await updateRecipeApi(loadedFromId, recipe);
      } else {
        // CREATE path — existing behaviour, unchanged
        await submitRecipeApi(recipe);
      }

      setSubmitSuccess(true);
      setValidateResult(null);
      setLastSaveStatus("submitted");

      // Fire-and-forget: update the displayed version to the next one
      fetchNextVersionApi(draft.formId)
        .then(({ nextVersion, currentVersion: cv }) => {
          setVersion(nextVersion);
          setCurrentVersion(cv);
        })
        .catch(() => setVersion(bumpMinor(version)));
    } catch (err) {
      if (err instanceof FormFetchError && err.status === 409) {
        setSubmitError("This form has been published and cannot be edited.");
      } else {
        setSubmitError(
          err instanceof Error ? err.message : "An unknown error occurred.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={css.builderRoot}>
      <BuilderToolbar
        draft={draft}
        dispatch={dispatch}
        version={version}
        onPreview={() => void handlePreview()}
        onValidate={() => void handleValidate()}
        onSubmit={handleOpenSubmit}
        isPreviewing={isPreviewing}
        isValidating={isValidating}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        lastSaveStatus={lastSaveStatus}
        forms={forms}
        onFormSelect={(formId) => void handleFormSelect(formId)}
        isPickerOpen={isPickerOpen}
        onNewForm={handleNewForm}
        onPickerOpen={() => setIsPickerOpen(true)}
        onPickerClose={() => setIsPickerOpen(false)}
      />

      <div className={css.builderBody}>
        {/* Left sidebar: step list */}
        <StepList
          draft={draft}
          dispatch={dispatch}
          selectedStepId={selectedStepId}
          onSelectStep={handleSelectStep}
        />

        {/* Main editor area */}
        <main className={css.editorArea} aria-label="Form editor">
          {/* Form load error banner */}
          {loadError !== null && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                background: "var(--b-color-danger-subtle, #fef2f2)",
                borderLeft: "4px solid var(--b-color-danger, #dc2626)",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                color: "var(--b-color-danger, #dc2626)",
              }}
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => setLoadError(null)}
                aria-label="Dismiss error"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                  fontSize: "1rem",
                  lineHeight: 1,
                  padding: "0.125rem",
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Loading indicator while fetching a form */}
          {isLoadingForm && (
            <div
              aria-live="polite"
              style={{
                padding: "0.75rem 1rem",
                background: "var(--b-color-info-subtle, #eff6ff)",
                borderLeft: "4px solid var(--b-color-info, #3b82f6)",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                color: "var(--b-color-info, #1d4ed8)",
              }}
            >
              Loading form...
            </div>
          )}

          {/* Validation results banner */}
          {validateResult !== null && (
            <ValidationPanel
              result={validateResult}
              onDismiss={handleDismissValidation}
            />
          )}

          {/* Step editor or empty prompt */}
          {selectedStep !== null ? (
            <StepEditor
              step={selectedStep}
              draft={draft}
              dispatch={dispatch}
              catalog={catalog}
              onStepIdChange={handleStepIdChange}
            />
          ) : (
            <div className={css.noStepSelected}>
              {draft.steps.length === 0
                ? 'Add a step using the "+ Add" button in the sidebar to start building.'
                : "Select a step from the sidebar to edit it."}
            </div>
          )}
        </main>
      </div>

      {/* Preview modal */}
      {isPreviewOpen && (
        <PreviewModal
          contract={previewContract}
          error={previewError}
          isLoading={isPreviewing}
          onClose={handleClosePreview}
        />
      )}

      {/* Submit modal */}
      {isSubmitOpen && (
        <SubmitModal
          formId={draft.formId}
          version={version}
          currentVersion={currentVersion}
          onVersionChange={(v) => setVersion(v)}
          isUpdate={loadedFromId !== null}
          isSubmitting={isSubmitting}
          error={submitError}
          success={submitSuccess}
          onConfirm={() => void handleSubmit()}
          onClose={handleCloseSubmit}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error boundary component
// ---------------------------------------------------------------------------

interface BuilderErrorProps {
  error: Error;
  reset: () => void;
}

function BuilderError({ error, reset }: BuilderErrorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        Failed to load the Form Builder
      </h1>
      <p style={{ color: "#64748b" }}>{error.message}</p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          background: "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </div>
  );
}
