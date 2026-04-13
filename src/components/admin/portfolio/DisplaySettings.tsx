"use client";

import { useState } from "react";

type GridLayout = "grid" | "masonry" | "scattered";

const LAYOUT_LABELS: Record<GridLayout, { label: string; desc: string; icon: React.ReactNode }> = {
  grid: {
    label: "شبكة منتظمة",
    desc: "صور بنسبة ثابتة في شبكة متساوية",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="3" width="11" height="11" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="18" y="3" width="11" height="11" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="3" y="18" width="11" height="11" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="18" y="18" width="11" height="11" rx="2" fill="currentColor" opacity=".7"/>
      </svg>
    ),
  },
  masonry: {
    label: "متناسق",
    desc: "نسب الصور الأصلية في أعمدة متوازية",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="3" width="11" height="16" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="18" y="3" width="11" height="10" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="3" y="22" width="11" height="7" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="18" y="17" width="11" height="12" rx="2" fill="currentColor" opacity=".7"/>
      </svg>
    ),
  },
  scattered: {
    label: "عشوائي",
    desc: "أحجام ومواضع متنوعة وديناميكية",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="3" width="16" height="12" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="22" y="3" width="7" height="7" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="3" y="18" width="7" height="11" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="13" y="18" width="16" height="11" rx="2" fill="currentColor" opacity=".7"/>
        <rect x="22" y="13" width="7" height="3" rx="1" fill="currentColor" opacity=".4"/>
      </svg>
    ),
  },
};

interface DisplaySettingsProps {
  availableLayouts: GridLayout[];
  defaultLayout: GridLayout;
  onSave: (data: { availableLayouts: GridLayout[]; defaultLayout: GridLayout }) => Promise<void>;
}

export default function DisplaySettings({
  availableLayouts: initialAvailable,
  defaultLayout: initialDefault,
  onSave,
}: DisplaySettingsProps) {
  const [available, setAvailable] = useState<GridLayout[]>(initialAvailable);
  const [defaultLayout, setDefaultLayout] = useState<GridLayout>(initialDefault);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const allLayouts: GridLayout[] = ["grid", "masonry", "scattered"];

  function toggleLayout(layout: GridLayout) {
    if (available.includes(layout)) {
      if (available.length <= 1) return; // must keep at least 1
      const next = available.filter((l) => l !== layout);
      setAvailable(next);
      if (defaultLayout === layout) setDefaultLayout(next[0]);
    } else {
      setAvailable([...available, layout]);
    }
  }

  async function handleSave() {
    setStatus("saving");
    try {
      await onSave({ availableLayouts: available, defaultLayout });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="ds-root">
      <div className="ds-header">
        <h3 className="ds-title">إعدادات عرض المعرض</h3>
        <button
          type="button"
          className={`ds-save ${status === "saved" ? "ds-save--saved" : ""} ${status === "error" ? "ds-save--error" : ""}`}
          onClick={handleSave}
          disabled={status === "saving"}
        >
          {status === "saving" ? "حفظ..." : status === "saved" ? "✓ تم" : status === "error" ? "فشل" : "حفظ"}
        </button>
      </div>

      <p className="ds-desc">اختر الأنماط المتاحة للزوار وحدد النمط الافتراضي</p>

      <div className="ds-grid">
        {allLayouts.map((layout) => {
          const info = LAYOUT_LABELS[layout];
          const isAvailable = available.includes(layout);
          const isDefault = defaultLayout === layout;

          return (
            <div
              key={layout}
              className={`ds-card ${isAvailable ? "ds-card--on" : "ds-card--off"} ${isDefault ? "ds-card--default" : ""}`}
            >
              <div className="ds-card-icon">{info.icon}</div>
              <div className="ds-card-info">
                <span className="ds-card-label">{info.label}</span>
                <span className="ds-card-desc">{info.desc}</span>
              </div>
              <div className="ds-card-controls">
                <label className="ds-toggle" title={isAvailable ? "إخفاء" : "إظهار"}>
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={() => toggleLayout(layout)}
                    className="ds-toggle-input"
                  />
                  <span className="ds-toggle-track">
                    <span className="ds-toggle-thumb" />
                  </span>
                </label>
                {isAvailable && (
                  <button
                    type="button"
                    className={`ds-default-btn ${isDefault ? "ds-default-btn--active" : ""}`}
                    onClick={() => setDefaultLayout(layout)}
                    title="تعيين كافتراضي"
                  >
                    {isDefault ? "افتراضي ✓" : "افتراضي"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .ds-root { display: flex; flex-direction: column; gap: 0.875rem; }

        .ds-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ds-title {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .ds-desc {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .ds-save {
          font-size: 0.8125rem;
          padding: 0.3rem 0.875rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: opacity var(--transition-fast), background var(--transition-fast);
        }

        .ds-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .ds-save:hover:not(:disabled) { opacity: 0.85; }
        .ds-save--saved { background: #276749; }
        .ds-save--error { background: #c53030; }

        .ds-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ds-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--bg-primary);
          transition: opacity var(--transition-fast);
        }

        .ds-card--off {
          opacity: 0.45;
        }

        .ds-card--default {
          border-color: var(--text-primary);
        }

        .ds-card-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .ds-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .ds-card-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .ds-card-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .ds-card-controls {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-shrink: 0;
        }

        /* Toggle switch */
        .ds-toggle { display: flex; align-items: center; cursor: pointer; }
        .ds-toggle-input { display: none; }

        .ds-toggle-track {
          width: 36px;
          height: 20px;
          background: var(--border);
          border-radius: 10px;
          position: relative;
          transition: background var(--transition-fast);
        }

        .ds-toggle-input:checked + .ds-toggle-track {
          background: var(--text-primary);
        }

        .ds-toggle-thumb {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          transition: right var(--transition-fast);
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }

        .ds-toggle-input:checked + .ds-toggle-track .ds-toggle-thumb {
          right: calc(100% - 17px);
        }

        .ds-default-btn {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          white-space: nowrap;
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .ds-default-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .ds-default-btn--active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--text-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
