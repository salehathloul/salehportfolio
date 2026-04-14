"use client";

import { useState } from "react";
import { useVisitor } from "./VisitorContext";

interface Props {
  onClose: () => void;
  locale: string;
  source?: string;
}

type Step = "form" | "sent";

export default function LoginModal({ onClose, locale, source = "nav" }: Props) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const { refresh } = useVisitor();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "حدث خطأ"); setLoading(false); return; }
      setIsAdmin(data.isAdmin);
      setStep("sent");
      refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  const T = {
    ar: {
      title: "دخول",
      namePh: "اسمك *",
      emailPh: "إيميلك *",
      phonePh: "جوالك (اختياري)",
      submit: "إرسال رابط الدخول",
      sending: "جاري الإرسال...",
      sentTitle: isAdmin ? "رابط لوحة التحكم أُرسل" : "رابط الدخول أُرسل",
      sentDesc: `تحقق من بريدك الإلكتروني على ${email} واضغط الرابط للدخول.`,
      sentNote: "الرابط صالح لمدة ١٥ دقيقة.",
      close: "إغلاق",
      privacy: "إيميلك لن يُشارك مع أحد.",
    },
    en: {
      title: "Sign In",
      namePh: "Your name *",
      emailPh: "Your email *",
      phonePh: "Your phone (optional)",
      submit: "Send Login Link",
      sending: "Sending...",
      sentTitle: isAdmin ? "Admin link sent" : "Login link sent",
      sentDesc: `Check your inbox at ${email} and click the link to sign in.`,
      sentNote: "The link expires in 15 minutes.",
      close: "Close",
      privacy: "Your email will never be shared.",
    },
  };

  const t = T[locale as "ar" | "en"] ?? T.ar;

  return (
    <>
      {/* Backdrop */}
      <div className="lm-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="lm-panel" dir={dir} role="dialog" aria-modal="true">
        <button className="lm-close" onClick={onClose} aria-label="إغلاق">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M13 3L3 13M3 3l10 10"/>
          </svg>
        </button>

        {step === "form" ? (
          <>
            <h2 className="lm-title">{t.title}</h2>
            <form onSubmit={handleSubmit} className="lm-form">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                className="lm-input"
                dir={dir}
                autoFocus
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPh}
                required
                className="lm-input"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePh}
                className="lm-input"
              />
              {error && <p className="lm-error">{error}</p>}
              <button type="submit" disabled={loading} className="lm-submit">
                {loading ? t.sending : t.submit}
              </button>
              <p className="lm-privacy">{t.privacy}</p>
            </form>
          </>
        ) : (
          <div className="lm-sent">
            <div className="lm-sent-icon">✉</div>
            <h2 className="lm-title">{t.sentTitle}</h2>
            <p className="lm-sent-desc">{t.sentDesc}</p>
            <p className="lm-sent-note">{t.sentNote}</p>
            <button onClick={onClose} className="lm-submit" style={{ marginTop: "1.5rem" }}>
              {t.close}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .lm-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
        }

        .lm-panel {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 201;
          width: min(420px, calc(100vw - 2rem));
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: start;
        }

        .lm-close {
          position: absolute;
          top: 1rem; inset-inline-end: 1rem;
          width: 32px; height: 32px;
          border: none; background: transparent;
          color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .lm-close:hover { color: var(--text-primary); background: var(--bg-secondary); }

        .lm-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 1.5rem;
        }

        .lm-form { display: flex; flex-direction: column; gap: 0.75rem; }

        .lm-input {
          width: 100%; height: 44px; padding: 0 0.875rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.9375rem; font-family: inherit; outline: none;
          transition: border-color var(--transition-fast);
          box-sizing: border-box;
          text-align: right;
          direction: rtl;
        }
        .lm-input:focus { border-color: var(--text-primary); }
        .lm-input::placeholder { color: var(--text-subtle); }

        .lm-error { font-size: 0.85rem; color: #e53e3e; margin: 0; }

        .lm-submit {
          width: 100%; height: 44px;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-sm);
          font-size: 0.9375rem; font-weight: 500; cursor: pointer;
          transition: opacity var(--transition-fast);
          margin-top: 0.25rem;
        }
        .lm-submit:hover:not(:disabled) { opacity: 0.85; }
        .lm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .lm-privacy {
          font-size: 0.75rem; color: var(--text-subtle);
          text-align: start; margin: 0;
        }

        /* Sent state */
        .lm-sent { text-align: start; }
        .lm-sent-icon {
          font-size: 2.5rem; margin-bottom: 1rem;
          display: block;
        }
        .lm-sent-desc {
          color: var(--text-secondary); font-size: 0.9375rem;
          line-height: 1.6; margin: 0.5rem 0 0.25rem;
        }
        .lm-sent-note {
          font-size: 0.8rem; color: var(--text-muted); margin: 0;
        }
      `}</style>
    </>
  );
}
