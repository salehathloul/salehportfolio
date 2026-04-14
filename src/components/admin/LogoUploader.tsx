"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface LogoUploaderProps {
  value?: string | null; // current URL
  onChange: (url: string | null) => void;
  label: string;
  theme: "light" | "dark";
  disabled?: boolean;
}

type State =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "error"; message: string };

export default function LogoUploader({
  value,
  onChange,
  label,
  theme,
  disabled = false,
}: LogoUploaderProps) {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setState({ status: "error", message: "يُقبل: JPG, PNG, WebP, SVG" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setState({ status: "error", message: "الحجم يتجاوز 5MB" });
      return;
    }

    setState({ status: "uploading", progress: 0 });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "logos");
    formData.append("preserveFormat", "true");

    try {
      const url = await uploadWithProgress(formData, (p) =>
        setState({ status: "uploading", progress: p })
      );
      setState({ status: "idle" });
      onChange(url);
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "فشل الرفع",
      });
    }
  }

  const isDark = theme === "dark";

  return (
    <div className="logo-uploader">
      <div
        className={`logo-preview ${isDark ? "logo-preview--dark" : "logo-preview--light"}`}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            className="logo-img"
            sizes="180px"
            unoptimized
          />
        ) : (
          <span className="logo-placeholder">
            {state.status === "uploading" ? `${state.progress}%` : label}
          </span>
        )}

        {state.status === "uploading" && (
          <div className="logo-uploading-bar">
            <div
              className="logo-uploading-fill"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="logo-actions">
        <button
          type="button"
          className="logo-btn"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || state.status === "uploading"}
        >
          {value ? "استبدال" : "رفع شعار"}
        </button>
        {value && (
          <button
            type="button"
            className="logo-btn logo-btn--danger"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            حذف
          </button>
        )}
      </div>

      {state.status === "error" && (
        <span className="logo-error">{state.message}</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        disabled={disabled}
      />

      <style>{`
        .logo-uploader {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .logo-preview {
          position: relative;
          width: 180px;
          height: 72px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-preview:hover {
          border-color: var(--text-muted);
        }

        .logo-preview--light {
          background: #ffffff;
        }

        .logo-preview--dark {
          background: #0a0a0a;
        }

        .logo-img {
          object-fit: contain;
          padding: 8px;
        }

        .logo-placeholder {
          font-size: 0.75rem;
          color: var(--text-subtle);
          text-align: center;
          padding: 0.5rem;
        }

        .logo-uploading-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(128,128,128,0.3);
        }

        .logo-uploading-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.15s ease;
        }

        .logo-actions {
          display: flex;
          gap: 0.5rem;
        }

        .logo-btn {
          font-size: 0.8125rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .logo-btn:hover:not(:disabled) {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .logo-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .logo-btn--danger {
          color: #e53e3e;
          border-color: #fed7d7;
        }

        .logo-btn--danger:hover:not(:disabled) {
          background: #fff5f5;
        }

        .dark .logo-btn--danger:hover:not(:disabled) {
          background: #2d1b1b;
        }

        .logo-error {
          font-size: 0.8125rem;
          color: #e53e3e;
        }
      `}</style>
    </div>
  );
}

// XHR upload that returns the image URL
async function uploadWithProgress(
  formData: FormData,
  onProgress: (p: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) reject(new Error(data.error));
          else resolve(data.url as string);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else if (xhr.status === 401) {
        reject(new Error("انتهت الجلسة — أعد تسجيل الدخول"));
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
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}
