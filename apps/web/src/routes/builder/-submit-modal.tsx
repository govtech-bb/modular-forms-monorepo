import React from "react";
import css from "../../styles/builder.module.css";

interface SubmitModalProps {
  formId: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  onConfirm: (version: string) => void;
  onClose: () => void;
}

export function SubmitModal({
  formId,
  isSubmitting,
  error,
  success,
  onConfirm,
  onClose,
}: SubmitModalProps) {
  const [version, setVersion] = React.useState("1.0.0");

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
      onConfirm(version);
    }
  };

  return (
    <div
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Submit form recipe"
      onClick={handleOverlayClick}
    >
      <div className={css.modalBox} style={{ maxWidth: "480px" }}>
        <div className={css.modalHeader}>
          <span className={css.modalTitle}>Submit Recipe</span>
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
                Recipe submitted successfully.
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--b-color-text-muted)",
                }}
              >
                Form <code style={{ fontFamily: "monospace" }}>{formId}</code>{" "}
                version{" "}
                <code style={{ fontFamily: "monospace" }}>{version}</code> is
                now registered.
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
                <input
                  id="submit-version"
                  className={css.fieldInput}
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  maxLength={20}
                  placeholder="e.g. 1.0.0"
                  required
                  disabled={isSubmitting}
                  aria-describedby={error ? "submit-error" : undefined}
                />
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
                  disabled={isSubmitting || !version.trim()}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
