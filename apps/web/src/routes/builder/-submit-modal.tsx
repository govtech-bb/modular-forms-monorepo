import React from "react";
import css from "../../styles/builder.module.css";
import { validateVersion } from "../../lib/version";

interface SubmitModalProps {
  formId: string;
  version: string;
  currentVersion: string | null;
  onVersionChange: (v: string) => void;
  isUpdate: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function SubmitModal({
  formId,
  version,
  currentVersion,
  onVersionChange,
  isUpdate,
  isSubmitting,
  error,
  success,
  onConfirm,
  onClose,
}: SubmitModalProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, isSubmitting]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting && !success) {
      onConfirm();
    }
  };

  const versionError = validateVersion(version, currentVersion);

  return (
    <div
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={isUpdate ? "Update form recipe" : "Submit form recipe"}
      onClick={handleOverlayClick}
    >
      <div className={css.modalBox} style={{ maxWidth: "480px" }}>
        <div className={css.modalHeader}>
          <span className={css.modalTitle}>
            {isUpdate ? "Save Changes" : "Submit Recipe"}
          </span>
          <button
            type="button"
            className={`${css.btn} ${css.btnSecondary} ${css.btnSm}`}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close submit dialog"
          >
            Close
          </button>
        </div>

        <div className={css.modalBody}>
          {success ? (
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.375rem",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "var(--b-color-text)",
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                {isUpdate
                  ? "Changes saved successfully."
                  : "Recipe submitted successfully."}
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--b-color-text-muted)",
                }}
              >
                Form <code style={{ fontFamily: "monospace" }}>{formId}</code>{" "}
                version{" "}
                <code style={{ fontFamily: "monospace" }}>{version}</code>{" "}
                {isUpdate ? "has been updated." : "is now registered."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div className={css.fieldGroup}>
                <label htmlFor="submit-form-id" className={css.fieldLabel}>
                  Form ID
                </label>
                <input
                  id="submit-form-id"
                  className={css.fieldInput}
                  type="text"
                  value={formId}
                  readOnly
                  aria-readonly="true"
                  style={{
                    background: "var(--b-color-surface-hover)",
                    color: "var(--b-color-text-muted)",
                  }}
                />
              </div>

              <div className={css.fieldGroup}>
                <label htmlFor="submit-version" className={css.fieldLabel}>
                  Version
                </label>
                <p
                  style={{
                    margin: "0",
                    color: "var(--b-color-text-muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  {isUpdate
                    ? "You may edit this. The new version must be higher than the current registered version."
                    : "Auto-filled from the registry. You may edit this before submitting."}
                </p>
                <input
                  id="submit-version"
                  className={css.fieldInput}
                  type="text"
                  value={version}
                  onChange={(e) => onVersionChange(e.target.value)}
                  disabled={isSubmitting || success}
                  aria-describedby={versionError ? "version-error" : undefined}
                  aria-invalid={versionError ? "true" : undefined}
                />
                {versionError && (
                  <p
                    id="version-error"
                    role="alert"
                    style={{
                      color: "var(--b-color-danger, #dc2626)",
                      fontSize: "0.8rem",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    {versionError}
                  </p>
                )}
              </div>

              {error && (
                <div
                  id="submit-error"
                  role="alert"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.375rem",
                    background: "var(--b-color-error-bg)",
                    border: "1px solid var(--b-color-error-border)",
                    color: "var(--b-color-text)",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className={`${css.btn} ${css.btnSecondary}`}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${css.btn} ${css.btnPrimary}`}
                  disabled={isSubmitting || !!versionError}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting
                    ? isUpdate
                      ? "Updating..."
                      : "Submitting..."
                    : isUpdate
                      ? "Update form"
                      : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
