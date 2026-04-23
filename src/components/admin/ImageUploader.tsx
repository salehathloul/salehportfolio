"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────

export interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  sizes: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
}

interface ImageUploaderProps {
  value?: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  folder?: string;
  label?: string;
  aspectHint?: string; // e.g. "16:9" — just a hint shown to user
  disabled?: boolean;
}

type UploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; dataUrl: string }
  | { status: "uploading"; file: File; dataUrl: string; progress: number }
  | { status: "done"; image: UploadedImage }
  | { status: "error"; message: string };

// ─── Component ────────────────────────────────────────────

export default function ImageUploader({
  value,
  onChange,
  folder = "portfolio",
  label = "رفع صورة",
  aspectHint,
  disabled = false,
}: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>(
    value ? { status: "done", image: value } : { status: "idle" }
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Client-side validation
      const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/tiff"];
      if (!ALLOWED.includes(file.type)) {
        setState({ status: "error", message: "يُقبل فقط: JPG, PNG, WebP, TIFF" });
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        setState({ status: "error", message: "حجم الصورة يتجاوز 30MB" });
        return;
      }

      // Show preview immediately
      const dataUrl = await readFileAsDataUrl(file);
      setState({ status: "preview", file, dataUrl });
    },
    [disabled]
  );

  // ── Upload ─────────────────────────────────────────────

  async function startUpload() {
    if (state.status !== "preview") return;
    const { file, dataUrl } = state;

    setState({ status: "uploading", file, dataUrl, progress: 0 });

    // Vercel serverless functions have a ~4.5 MB body limit.
    // Compress client-side if the file is too large before sending.
    let uploadFile = file;
    if (file.size > 3.5 * 1024 * 1024) {
      try {
        uploadFile = await compressImage(file, 3.2 * 1024 * 1024);
      } catch {
        // If compression fails for any reason, try sending as-is
        // (will likely 413, but the error will be shown clearly)
      }
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", folder);

    try {
      // Use XMLHttpRequest to track upload progress
      const result = await uploadWithProgress(formData, (p) => {
        setState((prev) =>
          prev.status === "uploading" ? { ...prev, progress: p } : prev
        );
      });

      setState({ status: "done", image: result });
      onChange(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل الرفع";
      setState({ status: "error", message: msg });
    }
  }

  // ── Drag & Drop ────────────────────────────────────────

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  // ── Remove ─────────────────────────────────────────────

  function remove() {
    setState({ status: "idle" });
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Render ─────────────────────────────────────────────

  const showPreview =
    state.status === "preview" ||
    state.status === "uploading" ||
    state.status === "done";

  const previewSrc =
    state.status === "done"
      ? state.image.sizes.medium
      : state.status === "preview" || state.status === "uploading"
        ? state.dataUrl
        : null;

  const isUploading = state.status === "uploading";
  const progress = state.status === "uploading" ? state.progress : 0;

  return (
    <div className="uploader" aria-label={label}>
      {/* Drop zone / preview */}
      <div
        className={[
          "uploader-zone",
          dragging ? "uploader-zone--drag" : "",
          showPreview ? "uploader-zone--has-image" : "",
          disabled ? "uploader-zone--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && !showPreview && inputRef.current?.click()}
        role={!showPreview ? "button" : undefined}
        tabIndex={!showPreview && !disabled ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !showPreview) inputRef.current?.click();
          }
        }}
      >
        {/* Empty state */}
        {!showPreview && (
          <div className="uploader-empty">
            <UploadIcon />
            <span className="uploader-empty-title">{label}</span>
            <span className="uploader-empty-hint">
              اسحب الصورة هنا أو انقر للاختيار
            </span>
            {aspectHint && (
              <span className="uploader-aspect-hint">نسبة مقترحة: {aspectHint}</span>
            )}
            <span className="uploader-formats">JPG · PNG · WebP · حتى 30MB (يتم الضغط تلقائياً)</span>
          </div>
        )}

        {/* Image preview */}
        {showPreview && previewSrc && (
          <div className="uploader-preview">
            <Image
              src={previewSrc}
              alt="معاينة"
              fill
              className="uploader-img"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized={state.status !== "done"} // dataUrls skip Next.js optimization
            />

            {/* Uploading overlay */}
            {isUploading && (
              <div className="uploader-overlay">
                <div className="uploader-progress-wrap">
                  <div
                    className="uploader-progress-bar"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="uploader-progress-text">{progress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions below zone */}
      <div className="uploader-actions">
        {/* Preview → upload button */}
        {state.status === "preview" && (
          <>
            <button type="button" className="btn btn--primary" onClick={startUpload}>
              رفع الصورة
            </button>
            <button type="button" className="btn btn--ghost" onClick={remove}>
              إلغاء
            </button>
          </>
        )}

        {/* Done → replace */}
        {state.status === "done" && !disabled && (
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => inputRef.current?.click()}
            >
              استبدال
            </button>
            <button type="button" className="btn btn--danger" onClick={remove}>
              حذف
            </button>
          </>
        )}

        {/* Error */}
        {state.status === "error" && (
          <>
            <span className="uploader-error">{state.message}</span>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setState({ status: "idle" })}
            >
              إعادة المحاولة
            </button>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff"
        className="uploader-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={disabled}
        aria-hidden
      />

      <style>{`
        .uploader {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .uploader-zone {
          position: relative;
          width: 100%;
          min-height: 200px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          overflow: hidden;
          transition:
            border-color var(--transition-fast),
            background var(--transition-fast);
        }

        .uploader-zone:not(.uploader-zone--has-image):not(.uploader-zone--disabled) {
          cursor: pointer;
        }

        .uploader-zone:not(.uploader-zone--has-image):not(.uploader-zone--disabled):hover,
        .uploader-zone--drag {
          border-color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .uploader-zone--has-image {
          min-height: 280px;
          border-style: solid;
          border-color: var(--border);
        }

        .uploader-zone--disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .uploader-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 2rem;
          text-align: center;
        }

        .uploader-empty svg {
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .uploader-empty-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .uploader-empty-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .uploader-aspect-hint {
          font-size: 0.75rem;
          color: var(--text-subtle);
          background: var(--bg-tertiary);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
        }

        .uploader-formats {
          font-size: 0.75rem;
          color: var(--text-subtle);
          margin-top: 0.25rem;
        }

        .uploader-preview {
          position: absolute;
          inset: 0;
        }

        .uploader-img {
          object-fit: contain;
        }

        .uploader-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem;
        }

        .uploader-progress-wrap {
          width: 100%;
          max-width: 280px;
          height: 4px;
          background: rgba(255,255,255,0.25);
          border-radius: 2px;
          overflow: hidden;
        }

        .uploader-progress-bar {
          height: 100%;
          background: #fff;
          border-radius: 2px;
          transition: width 0.15s ease;
        }

        .uploader-progress-text {
          font-size: 0.875rem;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }

        .uploader-actions {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
        }

        .uploader-error {
          font-size: 0.875rem;
          color: #e53e3e;
          flex: 1;
        }

        .uploader-input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        /* Shared button styles */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition:
            background var(--transition-fast),
            opacity var(--transition-fast);
        }

        .btn--primary {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .btn--primary:hover {
          opacity: 0.85;
        }

        .btn--ghost {
          background: transparent;
          color: var(--text-secondary);
          border-color: var(--border);
        }

        .btn--ghost:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .btn--danger {
          background: transparent;
          color: #e53e3e;
          border-color: #fed7d7;
        }

        .btn--danger:hover {
          background: #fff5f5;
        }

        .dark .btn--danger:hover {
          background: #2d1b1b;
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) reject(new Error(data.error));
          else resolve(data as UploadedImage);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error ?? `HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

/**
 * Compress an image file client-side using Canvas to stay under Vercel's
 * 4.5 MB serverless-function body limit.
 *
 * Strategy:
 *  1. Draw the image onto a canvas at full resolution.
 *  2. Try toBlob() at progressively lower JPEG quality (0.92 → 0.5).
 *  3. If still too large, halve the canvas dimensions and retry.
 *  4. Return a new File with the original name but .jpg extension.
 */
async function compressImage(file: File, maxBytes: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");

      // Use naturalWidth/naturalHeight — img.width/height are 0 outside the DOM
      const width  = img.naturalWidth  || img.width;
      const height = img.naturalHeight || img.height;
      const tryCompress = (quality: number, scale: number) => {
        canvas.width  = Math.round(width  * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Canvas toBlob failed")); return; }

            if (blob.size <= maxBytes) {
              // Success — wrap in a File
              const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
              resolve(new File([blob], name, { type: "image/jpeg" }));
            } else if (quality > 0.5) {
              // Try lower quality at the same scale
              tryCompress(Math.max(quality - 0.1, 0.5), scale);
            } else if (scale > 0.25) {
              // Still too large — shrink dimensions
              tryCompress(0.82, scale * 0.75);
            } else {
              // Give up compressing; send whatever we have
              const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
              resolve(new File([blob], name, { type: "image/jpeg" }));
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryCompress(0.92, 1);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}

function UploadIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
