import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, className = "", id, rows = 4, ...props },
  ref
) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={fieldId} className="ui-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={`ui-textarea ${error ? "ui-textarea--error" : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
      {error && (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="ui-field-hint">{hint}</p>
      )}

      <style>{`
        .ui-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .ui-label { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }

        .ui-textarea {
          width: 100%;
          padding: 0.75rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9375rem;
          font-family: inherit;
          line-height: 1.6;
          outline: none;
          resize: vertical;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .ui-textarea::placeholder { color: var(--text-subtle); }

        .ui-textarea:focus {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 10%, transparent);
        }

        .ui-textarea--error { border-color: #e53e3e; }
        .ui-textarea--error:focus {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.12);
        }

        .ui-field-error { font-size: 0.8125rem; color: #e53e3e; }
        .ui-field-hint { font-size: 0.8125rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
});

export default TextArea;
