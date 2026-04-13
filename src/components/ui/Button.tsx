import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    children,
    className = "",
    ...props
  },
  ref
) {
  const cls = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth ? "ui-btn--full" : "",
    loading ? "ui-btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {children}

      <style>{`
        .ui-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition:
            background var(--transition-fast),
            color var(--transition-fast),
            border-color var(--transition-fast),
            opacity var(--transition-fast);
          white-space: nowrap;
          text-decoration: none;
          font-family: inherit;
        }

        .ui-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .ui-btn--full { width: 100%; }

        /* Sizes */
        .ui-btn--sm { height: 32px; padding: 0 0.875rem; font-size: 0.8125rem; }
        .ui-btn--md { height: 42px; padding: 0 1.25rem; font-size: 0.9375rem; }
        .ui-btn--lg { height: 52px; padding: 0 1.75rem; font-size: 1rem; }

        /* Variants */
        .ui-btn--primary {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
        .ui-btn--primary:hover:not(:disabled) {
          opacity: 0.85;
        }

        .ui-btn--secondary {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .ui-btn--secondary:hover:not(:disabled) {
          background: var(--bg-secondary);
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .ui-btn--ghost {
          background: transparent;
          color: var(--text-muted);
          border: none;
        }
        .ui-btn--ghost:hover:not(:disabled) {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .ui-btn--danger {
          background: transparent;
          color: #e53e3e;
          border: 1px solid #fed7d7;
        }
        .ui-btn--danger:hover:not(:disabled) {
          background: #fff5f5;
        }
        .dark .ui-btn--danger {
          border-color: #742a2a;
        }
        .dark .ui-btn--danger:hover:not(:disabled) {
          background: #2d1b1b;
        }

        /* Loading spinner */
        .btn-spinner {
          display: flex;
          align-items: center;
          animation: btn-spin 0.75s linear infinite;
        }

        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }

        .ui-btn--loading .btn-spinner { opacity: 1; }
      `}</style>
    </motion.button>
  );
});

export default Button;
