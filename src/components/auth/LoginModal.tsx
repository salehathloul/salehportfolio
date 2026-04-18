"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    // After Google auth, the user lands back on the current page
    await signIn("google", { callbackUrl: window.location.href });
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

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="lm-google-btn"
            >
              {googleLoading ? (
                <span>{locale === "ar" ? "جاري التوجيه..." : "Redirecting..."}</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{locale === "ar" ? "الدخول عبر Google" : "Sign in with Google"}</span>
                </>
              )}
            </button>

            <div className="lm-divider">
              <span>{locale === "ar" ? "أو عبر الإيميل" : "or via email"}</span>
            </div>

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

        /* Google button */
        .lm-google-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; width: 100%; height: 44px;
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.9375rem; font-weight: 500; cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast);
          margin-bottom: 0;
        }
        .lm-google-btn:hover:not(:disabled) {
          background: var(--bg-secondary); border-color: var(--text-muted);
        }
        .lm-google-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Divider */
        .lm-divider {
          display: flex; align-items: center; gap: 0.625rem;
          margin: 1rem 0 0.25rem; color: var(--text-subtle); font-size: 0.8rem;
        }
        .lm-divider::before, .lm-divider::after {
          content: ""; flex: 1; height: 1px; background: var(--border);
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
