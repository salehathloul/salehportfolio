"use client";

import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { setMounted(true); }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="toast-container" aria-live="polite" aria-atomic="false">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  className={`toast toast--${t.type}`}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.22 }}
                  layout
                >
                  <span className="toast-icon" aria-hidden="true">
                    {t.type === "success" && "✓"}
                    {t.type === "error" && "✕"}
                    {t.type === "info" && "ℹ"}
                  </span>
                  <span className="toast-message">{t.message}</span>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="toast-dismiss"
                    aria-label="إغلاق"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <style>{`
              .toast-container {
                position: fixed;
                bottom: 1.5rem;
                inset-inline-end: 1.5rem;
                z-index: 200;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 360px;
              }

              .toast {
                display: flex;
                align-items: flex-start;
                gap: 0.625rem;
                padding: 0.875rem 1rem;
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                font-size: 0.9rem;
                color: var(--text-primary);
              }

              .toast--success { border-inline-start: 3px solid #10b981; }
              .toast--error   { border-inline-start: 3px solid #ef4444; }
              .toast--info    { border-inline-start: 3px solid var(--text-muted); }

              .toast-icon {
                font-size: 0.875rem;
                font-weight: 600;
                flex-shrink: 0;
                margin-top: 0.05rem;
              }

              .toast--success .toast-icon { color: #10b981; }
              .toast--error .toast-icon   { color: #ef4444; }
              .toast--info .toast-icon    { color: var(--text-muted); }

              .toast-message { flex: 1; line-height: 1.5; }

              .toast-dismiss {
                border: none;
                background: transparent;
                color: var(--text-subtle);
                cursor: pointer;
                font-size: 1.25rem;
                line-height: 1;
                padding: 0;
                flex-shrink: 0;
                margin-top: -0.125rem;
              }

              .toast-dismiss:hover { color: var(--text-muted); }
            `}</style>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
