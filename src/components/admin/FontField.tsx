"use client";

import { useEffect, useRef, useState } from "react";

interface FontFieldProps {
  label: string;
  fontName?: string | null;
  fontUrl?: string | null;
  onUpload: (name: string, url: string) => void;
  disabled?: boolean;
}

export default function FontField({
  label,
  fontName,
  fontUrl,
  onUpload,
  disabled = false,
}: FontFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Unique font-face name per instance to avoid collisions
  const fontFaceId = useRef(`preview-font-${Math.random().toString(36).slice(2)}`);

  // Inject @font-face when fontUrl changes
  useEffect(() => {
    if (!fontUrl) {
      setPreviewLoaded(false);
      return;
    }

    const id = fontFaceId.current;
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@font-face { font-family: "${id}"; src: url("${fontUrl}"); font-display: swap; }`;
    document.head.appendChild(style);

    // Wait for font to load
    document.fonts.load(`1em "${id}"`).then(() => setPreviewLoaded(true));

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [fontUrl]);

  async function handleFile(file: File) {
    const allowedExt = ["woff2", "otf", "ttf", "woff"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExt.includes(ext)) {
      setError(`يُقبل فقط: ${allowedExt.join(", ")}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("الحجم يتجاوز 5MB");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/font", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "فشل الرفع");
      onUpload(data.name ?? file.name, data.url);
      setPreviewLoaded(false); // will reload via effect
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  const previewFontFamily = fontUrl ? fontFaceId.current : undefined;

  return (
    <div className="font-field">
      <div className="font-field-header">
        <span className="font-field-label">{label}</span>
        {fontName && (
          <span className="font-field-name">{fontName}</span>
        )}
      </div>

      {/* Preview */}
      {fontUrl && (
        <div
          className="font-preview"
          style={
            previewLoaded && previewFontFamily
              ? { fontFamily: `"${previewFontFamily}", serif` }
              : {}
          }
        >
          {previewLoaded
            ? "الفوتوغرافيا لغة بصرية — Photography is a visual language"
            : "جاري تحميل الخط..."}
        </div>
      )}

      <div className="font-field-actions">
        <button
          type="button"
          className="font-btn"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? "جاري الرفع..." : fontUrl ? "استبدال الخط" : "رفع خط"}
        </button>
        {!fontUrl && (
          <span className="font-field-hint">woff2 · otf · ttf · حتى 5MB</span>
        )}
      </div>

      {error && <span className="font-error">{error}</span>}

      <input
        ref={inputRef}
        type="file"
        accept=".woff2,.otf,.ttf,.woff"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={disabled || uploading}
      />

      <style>{`
        .font-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .font-field-header {
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
        }

        .font-field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .font-field-name {
          font-size: 0.8125rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          font-family: monospace;
        }

        .font-preview {
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          font-size: 1.125rem;
          color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          line-height: 1.6;
        }

        .font-field-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .font-btn {
          font-size: 0.8125rem;
          padding: 0.3rem 0.875rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .font-btn:hover:not(:disabled) {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .font-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .font-field-hint {
          font-size: 0.75rem;
          color: var(--text-subtle);
        }

        .font-error {
          font-size: 0.8125rem;
          color: #e53e3e;
        }
      `}</style>
    </div>
  );
}
