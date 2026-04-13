import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className = "", id, ...props },
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
      <div className="ui-select-wrap">
        <select
          ref={ref}
          id={fieldId}
          className={`ui-select ${error ? "ui-select--error" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(({ value, label: optLabel }) => (
            <option key={value} value={value}>
              {optLabel}
            </option>
          ))}
        </select>
        <span className="ui-select-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      )}

      <style>{`
        .ui-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .ui-label { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }

        .ui-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ui-select {
          width: 100%;
          height: 44px;
          padding: 0 2.5rem 0 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9375rem;
          font-family: inherit;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          cursor: pointer;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        [dir="rtl"] .ui-select {
          padding: 0 0.875rem 0 2.5rem;
        }

        .ui-select:focus {
          border-color: var(--text-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 10%, transparent);
        }

        .ui-select--error { border-color: #e53e3e; }

        .ui-select-arrow {
          position: absolute;
          inset-inline-end: 0.75rem;
          pointer-events: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .ui-field-error { font-size: 0.8125rem; color: #e53e3e; }
      `}</style>
    </div>
  );
});

export default Select;
