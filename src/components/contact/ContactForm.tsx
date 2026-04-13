"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

// ── Schema ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "collaboration",
  "inquiry",
  "acquisition",
  "media",
  "other",
] as const;

function buildSchema(isAr: boolean) {
  return z.object({
    category: z.enum(CATEGORIES, {
      error: isAr ? "اختر موضوعاً" : "Select a category",
    }),
    name: z.string().min(2, isAr ? "الاسم مطلوب" : "Name is required"),
    email: z
      .string()
      .min(1, isAr ? "البريد الإلكتروني مطلوب" : "Email is required")
      .email(isAr ? "بريد إلكتروني غير صحيح" : "Invalid email address"),
    phone: z.string().optional(),
    message: z
      .string()
      .min(10, isAr ? "الرسالة قصيرة جداً (١٠ أحرف كحد أدنى)" : "Message too short (min 10 chars)"),
  });
}

type FormValues = {
  category: (typeof CATEGORIES)[number];
  name: string;
  email: string;
  phone?: string;
  message: string;
};

// ── Success screen ─────────────────────────────────────────────────────────────

function SuccessScreen({ message }: { message: string }) {
  return (
    <motion.div
      className="cf-success"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      <div className="cf-success-icon">
        <svg
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.circle
            cx="28"
            cy="28"
            r="22"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <motion.path
            d="M18 28l7 7 13-13"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </div>
      <p className="cf-success-msg">{message}</p>

      <style>{`
        .cf-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
          padding: 4.5rem 1rem 5rem;
          text-align: center;
        }

        .cf-success-icon {
          width: 56px;
          height: 56px;
          color: var(--text-primary);
        }

        .cf-success-msg {
          color: var(--text-secondary);
          font-size: 1rem;
          line-height: 1.7;
          max-width: 340px;
        }
      `}</style>
    </motion.div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export default function ContactForm() {
  const locale = useLocale();
  const t = useTranslations("contact.form");
  const isAr = locale === "ar";
  const schema = buildSchema(isAr);

  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      setServerError(t("error"));
    }
  };

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <SuccessScreen key="success" message={t("success")} />
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          className="cf-form"
          dir={isAr ? "rtl" : "ltr"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          noValidate
        >
          {/* Category pills */}
          <div className="cf-field">
            <label className="cf-label">{t("category")}</label>
            <div className="cf-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cf-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() =>
                    setValue("category", cat, { shouldValidate: true })
                  }
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
            {errors.category && (
              <span className="cf-error">{errors.category.message}</span>
            )}
          </div>

          {/* Name + Email row */}
          <div className="cf-row">
            <div className="cf-field">
              <label className="cf-label" htmlFor="cf-name">
                {t("name")}
              </label>
              <input
                id="cf-name"
                className={`cf-input ${errors.name ? "invalid" : ""}`}
                type="text"
                autoComplete="name"
                {...register("name")}
              />
              {errors.name && (
                <span className="cf-error">{errors.name.message}</span>
              )}
            </div>

            <div className="cf-field">
              <label className="cf-label" htmlFor="cf-email">
                {t("email")}
              </label>
              <input
                id="cf-email"
                className={`cf-input ${errors.email ? "invalid" : ""}`}
                type="email"
                autoComplete="email"
                inputMode="email"
                {...register("email")}
              />
              {errors.email && (
                <span className="cf-error">{errors.email.message}</span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="cf-phone">
              {t("phone")}
            </label>
            <input
              id="cf-phone"
              className="cf-input"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              {...register("phone")}
            />
          </div>

          {/* Message */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="cf-message">
              {t("message")}
            </label>
            <textarea
              id="cf-message"
              className={`cf-input cf-textarea ${errors.message ? "invalid" : ""}`}
              rows={6}
              {...register("message")}
            />
            {errors.message && (
              <span className="cf-error">{errors.message.message}</span>
            )}
          </div>

          {/* Server error */}
          {serverError && <p className="cf-server-error">{serverError}</p>}

          <button
            type="submit"
            className="cf-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="cf-spinner" />
            ) : (
              t("submit")
            )}
          </button>
        </motion.form>
      )}

      <style>{`
        .cf-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        @media (max-width: 560px) {
          .cf-row { grid-template-columns: 1fr; }
        }

        .cf-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .cf-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          letter-spacing: 0.01em;
        }

        /* Input */
        .cf-input {
          padding: 0.8rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-family: inherit;
          width: 100%;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .cf-input:focus {
          outline: none;
          border-color: var(--text-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 8%, transparent);
        }

        .cf-input.invalid {
          border-color: #dc2626;
        }

        .cf-textarea {
          resize: vertical;
          min-height: 130px;
          line-height: 1.65;
        }

        /* Error text */
        .cf-error {
          font-size: 0.75rem;
          color: #dc2626;
        }

        .cf-server-error {
          font-size: 0.8rem;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-md);
          background: color-mix(in srgb, #dc2626 6%, transparent);
        }

        /* Category pills */
        .cf-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cf-pill {
          padding: 0.4rem 1.1rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.8rem;
          color: var(--text-muted);
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
        }

        .cf-pill:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .cf-pill.active {
          border-color: var(--text-primary);
          background: var(--text-primary);
          color: var(--bg-primary);
        }

        /* Submit */
        .cf-submit {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 130px;
          padding: 0.875rem 2.5rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .cf-submit:hover:not(:disabled) { opacity: 0.8; }
        .cf-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Spinner */
        .cf-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid color-mix(in srgb, var(--bg-primary) 35%, transparent);
          border-top-color: var(--bg-primary);
          border-radius: 50%;
          animation: cf-spin 0.7s linear infinite;
          display: inline-block;
        }

        @keyframes cf-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}
