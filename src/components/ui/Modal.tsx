"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  /** Prevent closing when clicking the overlay */
  persistent?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  persistent = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !persistent) onClose();
    };
    document.addEventListener("keydown", onKey);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, persistent]);

  if (typeof document === "undefined") return null;

  const sizeMap = {
    sm: "460px",
    md: "560px",
    lg: "720px",
    full: "calc(100vw - 2rem)",
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (!persistent && e.target === overlayRef.current) onClose();
          }}
        >
          <motion.div
            className="modal-box"
            style={{ maxWidth: sizeMap[size] }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {title && (
              <div className="modal-header">
                <h2 id="modal-title" className="modal-title">
                  {title}
                </h2>
                <button onClick={onClose} className="modal-close" aria-label="إغلاق">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="modal-body">{children}</div>
          </motion.div>

          <style>{`
            .modal-overlay {
              position: fixed;
              inset: 0;
              background: var(--overlay);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100;
              padding: 1rem;
            }

            .modal-box {
              width: 100%;
              max-height: calc(100dvh - 2rem);
              background: var(--bg-primary);
              border-radius: var(--radius-lg);
              border: 1px solid var(--border);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
            }

            .modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 1.25rem 1.5rem;
              border-bottom: 1px solid var(--border);
              flex-shrink: 0;
            }

            .modal-title {
              font-size: 1rem;
              font-weight: 500;
              color: var(--text-primary);
            }

            .modal-close {
              width: 32px;
              height: 32px;
              border: none;
              background: transparent;
              color: var(--text-muted);
              border-radius: var(--radius-md);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background var(--transition-fast), color var(--transition-fast);
              flex-shrink: 0;
            }

            .modal-close:hover {
              background: var(--bg-secondary);
              color: var(--text-primary);
            }

            .modal-body {
              overflow-y: auto;
              flex: 1;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
