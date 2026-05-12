import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import type {
  RegistryCatalog,
  RecipeValidateResponse,
} from "@govtech-bb/form-builder";
import { serializeRecipeDraft } from "@govtech-bb/form-builder";
import type { ServiceContract } from "@govtech-bb/form-types";
import {
  fetchCatalog,
  validateRecipeApi,
  previewRecipeApi,
} from "../../lib/api/registry";
import { recipeDraftReducer, emptyDraft } from "./-recipe-reducer";
import { BuilderToolbar } from "./-toolbar";
import { StepList } from "./-step-list";
import { StepEditor } from "./-step-editor";
import { ValidationPanel } from "./-validation-panel";
import { PreviewModal } from "./-preview-modal";
import css from "../../styles/builder.module.css";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

interface BuilderLoaderData {
  catalog: RegistryCatalog;
}

export const Route = createFileRoute("/builder/")({
  component: BuilderPage,
  loader: async (): Promise<BuilderLoaderData> => {
    const catalog = await fetchCatalog();
    return { catalog };
  },
  errorComponent: BuilderError,
});

// ---------------------------------------------------------------------------
// Builder Page
// ---------------------------------------------------------------------------

function BuilderPage() {
  const { catalog } = Route.useLoaderData();

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
    "idle" | "success" | "error"
  >("idle");

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const selectedStep =
    draft.steps.find((s) => s.stepId === selectedStepId) ?? null;

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={css.builderRoot}>
      <BuilderToolbar
        draft={draft}
        dispatch={dispatch}
        onPreview={() => void handlePreview()}
        onValidate={() => void handleValidate()}
        isPreviewing={isPreviewing}
        isValidating={isValidating}
        lastSaveStatus={lastSaveStatus}
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
