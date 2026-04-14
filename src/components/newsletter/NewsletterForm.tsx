"use client";

import { useState } from "react";

interface Props {
  locale: "ar" | "en";
  variant?: "footer" | "section"; // footer = inline compact, section = standalone card
}

const T = {
  ar: {
    heading: "اشترك في النشرة البريدية",
    sub: "أخبار ومشاريع جديدة، مرة في الشهر.",
    placeholder: "بريدك الإلكتروني",
    btn: "اشتراك",
    sending: "جاري...",
    success: "شكراً! وصلت رسالتك.",
    errorInvalid: "أدخل بريداً إلكترونياً صحيحاً.",
    errorServer: "حدث خطأ. حاول مرة أخرى.",
  },
  en: {
    heading: "Newsletter",
    sub: "New work and news, once a month.",
    placeholder: "Your email",
    btn: "Subscribe",
    sending: "...",
    success: "You're in. Thanks!",
    errorInvalid: "Please enter a valid email.",
    errorServer: "Something went wrong. Try again.",
  },
};

export default function NewsletterForm({ locale, variant = "section" }: Props) {
  const t = T[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg(t.errorInvalid);
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg(t.errorServer);
    }
  }

  const isFooter = variant === "footer";

  return (
    <div className={`nl-wrap nl-${variant}`} dir={dir}>
      {!isFooter && (
        <>
          <h3 className="nl-heading">{t.heading}</h3>
          <p className="nl-sub">{t.sub}</p>
        </>
      )}

      {status === "done" ? (
        <p className="nl-success">{t.success}</p>
      ) : (
        <form onSubmit={handleSubmit} className="nl-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="nl-input"
            disabled={status === "sending"}
            dir="ltr"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="nl-btn"
          >
            {status === "sending" ? t.sending : t.btn}
          </button>
        </form>
      )}

      {errorMsg && <p className="nl-error">{errorMsg}</p>}

      <style>{`
        .nl-wrap { width: 100%; }

        /* Section variant */
        .nl-section {
          padding: 3rem 2rem;
          border-top: 1px solid var(--border);
          text-align: center;
        }
        .nl-heading {
          font-family: var(--font-heading);
          font-size: clamp(1.1rem, 2.5vw, 1.4rem);
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 0.4rem;
        }
        .nl-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0 0 1.25rem;
        }

        /* Footer variant */
        .nl-footer { }

        /* Shared form */
        .nl-form {
          display: flex;
          gap: 0.5rem;
          max-width: 380px;
          margin-inline: auto;
          flex-wrap: nowrap;
        }

        .nl-section .nl-form { justify-content: center; }
        .nl-footer .nl-form { margin-inline: 0; }

        .nl-input {
          flex: 1;
          min-width: 0;
          height: 40px;
          padding: 0 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
          transition: border-color 150ms;
        }
        .nl-input:focus { border-color: var(--text-secondary); }
        .nl-input::placeholder { color: var(--text-subtle); }

        .nl-btn {
          flex-shrink: 0;
          height: 40px;
          padding: 0 1.25rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 150ms;
          white-space: nowrap;
        }
        .nl-btn:hover:not(:disabled) { opacity: 0.85; }
        .nl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .nl-success {
          font-size: 0.875rem;
          color: #10b981;
          margin: 0;
          max-width: 380px;
          margin-inline: auto;
        }
        .nl-footer .nl-success { margin-inline: 0; }

        .nl-error {
          font-size: 0.8125rem;
          color: #e53e3e;
          margin: 0.5rem 0 0;
        }
      `}</style>
    </div>
  );
}
