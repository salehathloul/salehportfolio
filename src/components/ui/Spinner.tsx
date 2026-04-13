interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="جاري التحميل"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      </svg>

      <style>{`
        .ui-spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          animation: spin 0.75s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

// ── Full-page loading overlay ─────────────────────────────────────────────────

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <Spinner size={32} />
      <style>{`
        .page-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40vh;
        }
      `}</style>
    </div>
  );
}
