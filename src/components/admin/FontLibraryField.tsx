"use client";

import { useEffect, useRef, useState } from "react";

interface FontAsset {
  id: string;
  name: string;
  url: string;
  format: string;
}

interface Props {
  label: string;
  fontName?: string | null;
  fontUrl?: string | null;
  onSelect: (name: string, url: string) => void;
  onClear?: () => void;
}

// Load and preview a font by injecting a @font-face rule
function usePreviewFont(fontUrl?: string | null) {
  const [loaded, setLoaded] = useState(false);
  const idRef = useRef(`fl-prev-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const id = idRef.current;
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    setLoaded(false);
    if (!fontUrl) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@font-face { font-family: "${id}"; src: url("${fontUrl}"); font-display: swap; }`;
    document.head.appendChild(style);
    document.fonts.load(`1em "${id}"`).then(() => setLoaded(true));
    return () => { document.getElementById(id)?.remove(); };
  }, [fontUrl]);

  return { loaded, fontId: idRef.current };
}

export default function FontLibraryField({ label, fontName, fontUrl, onSelect, onClear }: Props) {
  const [library, setLibrary] = useState<FontAsset[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { loaded, fontId } = usePreviewFont(fontUrl);

  // Load library when picker opens
  useEffect(() => {
    if (!showPicker) return;
    fetch("/api/admin/fonts")
      .then((r) => r.json())
      .then((data: FontAsset[]) => setLibrary(data))
      .catch(() => {});
  }, [showPicker]);

  async function handleUpload(file: File) {
    const allowed = ["woff2", "otf", "ttf", "woff"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.includes(ext)) { setError(`يُقبل فقط: ${allowed.join(", ")}`); return; }
    if (file.size > 5 * 1024 * 1024) { setError("الحجم يتجاوز 5MB"); return; }

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/font", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "فشل الرفع");

      // Save to library
      const name = data.name ?? file.name.replace(/\.[^.]+$/, "");
      const saveRes = await fetch("/api/admin/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: data.url, format: ext }),
      });
      const saved: FontAsset = await saveRes.json();
      setLibrary((prev) => [saved, ...prev]);
      onSelect(saved.name, saved.url);
      setShowPicker(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  async function deleteFont(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("حذف هذا الخط من المكتبة؟")) return;
    await fetch(`/api/admin/fonts/${id}`, { method: "DELETE" });
    setLibrary((prev) => prev.filter((f) => f.id !== id));
    // If this was the selected font, clear it
    const font = library.find((f) => f.id === id);
    if (font && font.url === fontUrl && onClear) onClear();
  }

  const filtered = library.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flf-root">
      <div className="flf-header">
        <span className="flf-label">{label}</span>
        {fontName && <span className="flf-current-name">{fontName}</span>}
      </div>

      {/* Preview */}
      {fontUrl && (
        <div
          className="flf-preview"
          style={loaded && fontId ? { fontFamily: `"${fontId}", serif` } : {}}
        >
          {loaded ? "الفوتوغرافيا لغة بصرية — Photography is a visual language" : "جاري تحميل الخط..."}
        </div>
      )}

      {/* Actions */}
      <div className="flf-actions">
        <button type="button" className="flf-btn" onClick={() => setShowPicker(true)}>
          {fontUrl ? "تغيير الخط" : "اختر خطاً"}
        </button>
        {fontUrl && onClear && (
          <button type="button" className="flf-btn flf-btn--ghost" onClick={onClear}>
            إزالة
          </button>
        )}
      </div>

      {error && <span className="flf-error">{error}</span>}

      {/* Picker modal */}
      {showPicker && (
        <div className="flf-overlay" onClick={() => setShowPicker(false)}>
          <div className="flf-picker" onClick={(e) => e.stopPropagation()}>
            <div className="flf-picker-head">
              <span>مكتبة الخطوط</span>
              <button type="button" className="flf-close" onClick={() => setShowPicker(false)}>×</button>
            </div>

            {/* Upload new */}
            <div className="flf-upload-row">
              <button
                type="button"
                className="flf-upload-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "جاري الرفع..." : "+ رفع خط جديد"}
              </button>
              <span className="flf-upload-hint">woff2 · otf · ttf · حتى 5MB</span>
              <input
                ref={fileRef}
                type="file"
                accept=".woff2,.otf,.ttf,.woff"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
              />
            </div>

            {/* Search */}
            {library.length > 4 && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن خط..."
                className="flf-search"
              />
            )}

            {/* Font list */}
            <div className="flf-list">
              {filtered.length === 0 ? (
                <p className="flf-empty">لا توجد خطوط في المكتبة — ارفع خطاً جديداً</p>
              ) : (
                filtered.map((font) => (
                  <FontLibraryItem
                    key={font.id}
                    font={font}
                    selected={font.url === fontUrl}
                    onPick={() => { onSelect(font.name, font.url); setShowPicker(false); }}
                    onDelete={(e) => deleteFont(font.id, e)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .flf-root { display: flex; flex-direction: column; gap: 0.5rem; }

        .flf-header { display: flex; align-items: baseline; gap: 0.625rem; }

        .flf-label { font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }

        .flf-current-name {
          font-size: 0.8125rem; color: var(--text-muted);
          background: var(--bg-tertiary); padding: 0.1rem 0.5rem;
          border-radius: 999px; font-family: monospace;
        }

        .flf-preview {
          padding: 0.75rem 1rem; background: var(--bg-secondary);
          border-radius: var(--radius-md); font-size: 1.05rem;
          color: var(--text-primary); border: 1px solid var(--border-subtle);
          line-height: 1.6;
        }

        .flf-actions { display: flex; gap: 0.5rem; align-items: center; }

        .flf-btn {
          font-size: 0.8125rem; padding: 0.3rem 0.875rem;
          border-radius: var(--radius-md); border: 1px solid var(--border);
          background: transparent; color: var(--text-secondary);
          cursor: pointer; transition: background var(--transition-fast);
        }
        .flf-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .flf-btn--ghost { color: var(--text-subtle); }
        .flf-btn--ghost:hover { color: #ef4444; border-color: #ef4444; background: transparent; }

        .flf-error { font-size: 0.8125rem; color: #e53e3e; }

        /* Picker overlay */
        .flf-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.5); display: flex;
          align-items: center; justify-content: center; padding: 1rem;
        }

        .flf-picker {
          background: var(--bg-primary); border-radius: var(--radius-lg);
          width: min(560px, 100%); max-height: 80vh;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.25);
        }

        .flf-picker-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
          font-size: 0.95rem; font-weight: 500; color: var(--text-primary);
          flex-shrink: 0;
        }

        .flf-close {
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; font-size: 1.25rem;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .flf-close:hover { background: var(--bg-secondary); }

        .flf-upload-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .flf-upload-btn {
          font-size: 0.8rem; padding: 0.3rem 0.875rem;
          border: 1px dashed var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer; color: var(--text-muted);
          transition: all var(--transition-fast); white-space: nowrap;
        }
        .flf-upload-btn:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); }
        .flf-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .flf-upload-hint { font-size: 0.72rem; color: var(--text-subtle); }

        .flf-search {
          margin: 0.75rem 1.25rem 0;
          padding: 0.4rem 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; outline: none; flex-shrink: 0;
        }
        .flf-search:focus { border-color: var(--text-secondary); }

        .flf-list {
          flex: 1; overflow-y: auto; padding: 0.75rem 1.25rem;
          display: flex; flex-direction: column; gap: 0.35rem;
        }

        .flf-empty { font-size: 0.875rem; color: var(--text-subtle); text-align: center; padding: 2rem; }
      `}</style>
    </div>
  );
}

// ── Font library item ──────────────────────────────────────────────────────────

function FontLibraryItem({
  font,
  selected,
  onPick,
  onDelete,
}: {
  font: FontAsset;
  selected: boolean;
  onPick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const idRef = useRef(`fl-item-${font.id}`);

  useEffect(() => {
    const id = idRef.current;
    if (document.getElementById(id)) { setLoaded(true); return; }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@font-face { font-family: "${id}"; src: url("${font.url}"); font-display: swap; }`;
    document.head.appendChild(style);
    document.fonts.load(`1em "${id}"`).then(() => setLoaded(true));
  }, [font.url]);

  return (
    <button
      type="button"
      className={`flf-item ${selected ? "flf-item--sel" : ""}`}
      onClick={onPick}
    >
      <div className="flf-item-left">
        <span className="flf-item-name">{font.name}</span>
        <span
          className="flf-item-sample"
          style={loaded ? { fontFamily: `"${idRef.current}", serif` } : {}}
        >
          أبجد — Abcd
        </span>
      </div>
      <div className="flf-item-right">
        {selected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2.5 7l3 3 6-6" />
          </svg>
        )}
        <button
          type="button"
          className="flf-item-del"
          onClick={onDelete}
          title="حذف من المكتبة"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 3L3 10M3 3l7 7" />
          </svg>
        </button>
      </div>

      <style>{`
        .flf-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer; text-align: start;
          transition: all var(--transition-fast); width: 100%;
        }
        .flf-item:hover { border-color: var(--text-muted); background: var(--bg-secondary); }
        .flf-item--sel { border-color: var(--text-primary); background: var(--bg-secondary); }

        .flf-item-left { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
        .flf-item-name { font-size: 0.8125rem; color: var(--text-primary); font-weight: 500; }
        .flf-item-sample { font-size: 1rem; color: var(--text-secondary); }

        .flf-item-right {
          display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
          color: var(--text-primary);
        }

        .flf-item-del {
          width: 26px; height: 26px; border: none; background: transparent;
          color: var(--text-subtle); cursor: pointer; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
        }
        .flf-item-del:hover { background: #fee2e2; color: #e53e3e; }
      `}</style>
    </button>
  );
}
