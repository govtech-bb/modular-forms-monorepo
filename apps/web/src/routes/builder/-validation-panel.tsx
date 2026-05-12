import type { RecipeValidateResponse } from "@govtech-bb/form-builder";
import css from "../../styles/builder.module.css";

interface ValidationPanelProps {
  result: RecipeValidateResponse;
  onDismiss: () => void;
}

export function ValidationPanel({ result, onDismiss }: ValidationPanelProps) {
  if (result.valid) {
    return (
      <div className={css.validationPanel}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p className={css.validationPanelHeading}>
            Recipe is valid — no issues found.
          </p>
          <button
            type="button"
            className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
            onClick={onDismiss}
            aria-label="Dismiss validation result"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${css.validationPanel} ${css.validationPanelError}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p className={css.validationPanelHeading}>
          {result.issues.length} validation{" "}
          {result.issues.length === 1 ? "issue" : "issues"} found
        </p>
        <button
          type="button"
          className={`${css.btn} ${css.btnGhost} ${css.btnSm}`}
          onClick={onDismiss}
          aria-label="Dismiss validation result"
        >
          Dismiss
        </button>
      </div>

      <ul className={css.validationIssueList} aria-label="Validation issues">
        {result.issues.map((issue, idx) => (
          <li key={idx} className={css.validationIssue}>
            {issue.path ? (
              <>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "var(--b-color-text-muted)",
                  }}
                >
                  {issue.path}
                </span>
                {" — "}
              </>
            ) : null}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
