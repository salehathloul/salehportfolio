type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`}>
      {children}

      <style>{`
        .ui-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.625rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .ui-badge--default {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .ui-badge--success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .dark .ui-badge--success {
          background: #064e3b;
          color: #6ee7b7;
          border-color: #065f46;
        }

        .ui-badge--warning {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .dark .ui-badge--warning {
          background: #78350f;
          color: #fcd34d;
          border-color: #92400e;
        }

        .ui-badge--error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .dark .ui-badge--error {
          background: #7f1d1d;
          color: #fca5a5;
          border-color: #991b1b;
        }

        .ui-badge--info {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
        .dark .ui-badge--info {
          background: #1e3a8a;
          color: #93c5fd;
          border-color: #1e40af;
        }
      `}</style>
    </span>
  );
}
