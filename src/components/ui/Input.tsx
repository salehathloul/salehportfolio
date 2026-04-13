import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = "", id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`ui-input ${error ? "ui-input--error" : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="ui-field-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="ui-field-hint">
          {hint}
        </p>
      )}

      <style>{`
        .ui-field { display: flex; flex-direction: column; gap: 0.375rem; }

        .ui-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .ui-input {
          width: 100%;
          height: 44px;
          padding: 0 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9375rem;
          font-family: inherit;
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .ui-input::placeholder { color: var(--text-subtle); }

        .ui-input:focus {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 10%, transparent);
        }

        .ui-input--error {
          border-color: #e53e3e;
        }
        .ui-input--error:focus {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.12);
        }

        .ui-field-error {
          font-size: 0.8125rem;
          color: #e53e3e;
        }

        .ui-field-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
});

export default Input;
