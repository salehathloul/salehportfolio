"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface FloatingContactProps {
  whatsappUrl?: string | null;
  emailUrl?: string | null;
  contactHref: string;
}

export default function FloatingContact({ whatsappUrl, emailUrl, contactHref }: FloatingContactProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className={`fc-wrap ${open ? "fc-wrap--open" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      {/* Options */}
      {open && (
        <div className="fc-options">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="fc-option" title="WhatsApp">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>{isAr ? "واتساب" : "WhatsApp"}</span>
            </a>
          )}
          {emailUrl && (
            <a href={emailUrl} className="fc-option" title="Email">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="2,4 12,14 22,4"/>
              </svg>
              <span>{isAr ? "إيميل" : "Email"}</span>
            </a>
          )}
          <Link href={contactHref} className="fc-option" onClick={() => setOpen(false)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>{isAr ? "تواصل" : "Contact"}</span>
          </Link>
        </div>
      )}

      {/* Toggle button */}
      <button
        className="fc-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={isAr ? "تواصل" : "Contact"}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>

      <style>{`
        .fc-wrap {
          position: fixed;
          bottom: 1.5rem;
          inset-inline-start: 1.5rem;
          z-index: 40;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .fc-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: transform 200ms ease, opacity 200ms ease;
        }

        .fc-btn:hover {
          transform: scale(1.08);
          opacity: 0.9;
        }

        .fc-options {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .fc-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.875rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 999px;
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          white-space: nowrap;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          transition: border-color 150ms, color 150ms, background 150ms;
        }

        .fc-option:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        @media (max-width: 640px) {
          .fc-wrap {
            bottom: 1rem;
            inset-inline-start: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
