/**
 * FormPicker — modal that lists existing form definitions so the user can
 * open one for editing in the builder.
 *
 * The leading dash in the filename (`-form-picker.tsx`) follows the
 * TanStack Router convention: files prefixed with `-` are NOT treated as
 * route segments.
 */

import React from "react";
import type { FormDefinitionSummary } from "@builder/types";
import css from "../../styles/builder.module.css";

interface FormPickerProps {
  forms: FormDefinitionSummary[];
  onSelect: (formId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function FormPicker({
  forms,
  onSelect,
  onClose,
  isOpen,
}: FormPickerProps) {
  if (!isOpen) return null;

  const handleSelect = (formId: string) => {
    onSelect(formId);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className={css.modalOverlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-picker-title"
    >
      <div className={css.modalBox} style={{ maxWidth: "480px" }}>
        <div className={css.modalHeader}>
          <h2 id="form-picker-title" className={css.modalTitle}>
            Open existing form
          </h2>
          <button
            type="button"
            className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
            onClick={onClose}
            aria-label="Close form picker"
          >
            Close
          </button>
        </div>

        <div className={css.modalBody}>
          {forms.length === 0 ? (
            <p className={css.paletteEmpty}>No saved forms found.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {forms.map(({ formId, title }) => (
                <li key={formId}>
                  <button
                    type="button"
                    className={css.paletteItem}
                    style={{ width: "100%" }}
                    onClick={() => handleSelect(formId)}
                  >
                    <span className={css.paletteItemLabel}>
                      {title || formId}
                    </span>
                    <span className={css.paletteItemMeta}>{formId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
