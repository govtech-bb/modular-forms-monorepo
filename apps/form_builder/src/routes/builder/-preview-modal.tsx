import React from "react";
import type { ServiceContract, Primitive } from "@govtech-bb/form-types";
import css from "../../styles/builder.module.css";

interface PreviewModalProps {
  contract: ServiceContract | null;
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export function PreviewModal({
  contract,
  error,
  isLoading,
  onClose,
}: PreviewModalProps) {
  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent scroll on body while open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Form preview"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={css.modalBox}>
        <div className={css.modalHeader}>
          <span className={css.modalTitle}>
            {contract ? `Preview: ${contract.title}` : "Form Preview"}
          </span>
          <button
            type="button"
            className={`${css.btn} ${css.btnSecondary} ${css.btnSm}`}
            onClick={onClose}
            aria-label="Close preview"
          >
            Close
          </button>
        </div>

        <div className={css.modalBody}>
          {isLoading && (
            <div className={css.emptyState}>
              <p className={css.emptyStateBody}>Generating preview...</p>
            </div>
          )}

          {!isLoading && error && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.375rem",
                background: "var(--b-color-error-bg)",
                border: "1px solid var(--b-color-error-border)",
                color: "var(--b-color-text)",
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                Preview failed
              </p>
              <p style={{ fontSize: "0.875rem" }}>{error}</p>
            </div>
          )}

          {!isLoading && !error && contract && (
            <ContractPreview contract={contract} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContractPreview — read-only structural view of a resolved ServiceContract
// ---------------------------------------------------------------------------

interface ContractPreviewProps {
  contract: ServiceContract;
}

function ContractPreview({ contract }: ContractPreviewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Contract header */}
      <div>
        <h2
          style={{
            margin: "0 0 0.25rem",
            fontSize: "1.25rem",
            fontWeight: 700,
          }}
        >
          {contract.title}
        </h2>
        {contract.description && (
          <p
            style={{
              margin: 0,
              fontSize: "0.9375rem",
              color: "var(--b-color-text-muted)",
            }}
          >
            {contract.description}
          </p>
        )}
        <dl
          style={{
            display: "flex",
            gap: "1.5rem",
            marginTop: "0.75rem",
            flexWrap: "wrap",
            fontSize: "0.8125rem",
            color: "var(--b-color-text-muted)",
          }}
        >
          <div>
            <dt style={{ fontWeight: 700, display: "inline" }}>Form ID: </dt>
            <dd style={{ display: "inline", fontFamily: "monospace" }}>
              {contract.formId}
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700, display: "inline" }}>Version: </dt>
            <dd style={{ display: "inline", fontFamily: "monospace" }}>
              {contract.version}
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 700, display: "inline" }}>Steps: </dt>
            <dd style={{ display: "inline" }}>{contract.steps.length}</dd>
          </div>
        </dl>
      </div>

      {/* Steps */}
      {contract.steps.map((step, stepIdx) => (
        <div
          key={step.stepId}
          style={{
            border: "1px solid var(--b-color-border)",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--b-color-surface-hover)",
              borderBottom: "1px solid var(--b-color-border)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "9999px",
                background: "var(--b-color-primary)",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {stepIdx + 1}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem" }}>
                {step.title}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "var(--b-color-text-muted)",
                }}
              >
                {step.stepId}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {step.description && (
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--b-color-text-muted)",
                }}
              >
                {step.description}
              </p>
            )}

            {step.elements.length === 0 && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--b-color-text-muted)",
                  fontStyle: "italic",
                }}
              >
                No fields in this step.
              </p>
            )}

            {(step.elements as Primitive[]).map((field, fIdx) => (
              <div
                key={fIdx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--b-color-border)",
                  borderRadius: "0.25rem",
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {field.fieldId}
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    flex: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {field.label}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--b-color-text-muted)",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  {field.htmlType}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
