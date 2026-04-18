"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  email: string;
  phone: string;
  projectTypeAr: string;
  projectTypeEn: string;
  descriptionAr: string;
  budgetRange: string;
  timelineWeeks: string;
  referenceUrls: string;
}

// ── Options ────────────────────────────────────────────────────────────────────

const PROJECT_TYPES = [
  { ar: "تصوير تجاري", en: "Commercial" },
  { ar: "مشروع معماري", en: "Architecture" },
  { ar: "مجموعة خاصة", en: "Private Collection" },
  { ar: "فندق أو مساحة فندقية", en: "Hospitality" },
  { ar: "أخرى", en: "Other" },
];

const BUDGET_RANGES = [
  { value: "< 5000", ar: "أقل من 5,000 ريال", en: "Under 5,000 SAR" },
  { value: "5000-15000", ar: "5,000 – 15,000 ريال", en: "5,000–15,000 SAR" },
  { value: "15000+", ar: "أكثر من 15,000 ريال", en: "15,000+ SAR" },
  { value: "undecided", ar: "لم أحدد بعد", en: "Not decided yet" },
];

const TIMELINES = [
  { value: "2", ar: "1–2 أسبوع", en: "1–2 weeks" },
  { value: "4", ar: "3–4 أسابيع", en: "3–4 weeks" },
  { value: "8", ar: "1–2 شهر", en: "1–2 months" },
  { value: "12", ar: "+شهرين", en: "2+ months" },
];

// ── Success Screen ─────────────────────────────────────────────────────────────

function SuccessScreen({ isAr }: { isAr: boolean }) {
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
      <p className="cf-success-msg">
        {isAr
          ? "شكراً لاهتمامك! سأتواصل معك قريباً بخصوص مشروعك."
          : "Thank you! I will be in touch soon regarding your project."}
      </p>

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

// ── Main Form ──────────────────────────────────────────────────────────────────

const INITIAL: FormValues = {
  name: "",
  email: "",
  phone: "",
  projectTypeAr: "",
  projectTypeEn: "",
  descriptionAr: "",
  budgetRange: "",
  timelineWeeks: "",
  referenceUrls: "",
};

export default function CommissionForm() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [form, setForm] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!form.name.trim())
      newErrors.name = isAr ? "الاسم مطلوب" : "Name is required";
    if (!form.email.trim())
      newErrors.email = isAr ? "البريد الإلكتروني مطلوب" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = isAr ? "بريد إلكتروني غير صحيح" : "Invalid email address";
    if (!form.projectTypeAr)
      newErrors.projectTypeAr = isAr ? "اختر نوع المشروع" : "Select a project type";
    if (!form.descriptionAr.trim())
      newErrors.descriptionAr = isAr ? "الوصف مطلوب" : "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/commissioned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          projectTypeAr: form.projectTypeAr,
          projectTypeEn: form.projectTypeEn || undefined,
          descriptionAr: form.descriptionAr,
          budgetRange: form.budgetRange || undefined,
          timelineWeeks: form.timelineWeeks ? parseInt(form.timelineWeeks, 10) : undefined,
          referenceUrls: form.referenceUrls || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "failed");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error && err.message !== "failed"
          ? err.message
          : isAr
          ? "حدث خطأ، يرجى المحاولة مرة أخرى"
          : "An error occurred, please try again"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <SuccessScreen key="success" isAr={isAr} />
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          className="cf-form"
          dir={isAr ? "rtl" : "ltr"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          noValidate
        >
          {/* Name + Email */}
          <div className="cf-row">
            <div className="cf-field">
              <label className="cf-label" htmlFor="com-name">
                {isAr ? "الاسم *" : "Name *"}
              </label>
              <input
                id="com-name"
                className={`cf-input ${errors.name ? "invalid" : ""}`}
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && <span className="cf-error">{errors.name}</span>}
            </div>

            <div className="cf-field">
              <label className="cf-label" htmlFor="com-email">
                {isAr ? "البريد الإلكتروني *" : "Email *"}
              </label>
              <input
                id="com-email"
                className={`cf-input ${errors.email ? "invalid" : ""}`}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              {errors.email && <span className="cf-error">{errors.email}</span>}
            </div>
          </div>

          {/* Phone */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="com-phone">
              {isAr ? "الجوال (اختياري)" : "Phone (optional)"}
            </label>
            <input
              id="com-phone"
              className="cf-input"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Project type */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="com-project-type">
              {isAr ? "نوع المشروع *" : "Project Type *"}
            </label>
            <select
              id="com-project-type"
              className={`cf-input cf-select ${errors.projectTypeAr ? "invalid" : ""}`}
              value={form.projectTypeAr}
              onChange={(e) => {
                const found = PROJECT_TYPES.find((p) => p.ar === e.target.value);
                set("projectTypeAr", e.target.value);
                if (found) set("projectTypeEn", found.en);
              }}
            >
              <option value="">{isAr ? "— اختر —" : "— Select —"}</option>
              {PROJECT_TYPES.map((p) => (
                <option key={p.ar} value={p.ar}>
                  {isAr ? p.ar : `${p.ar} / ${p.en}`}
                </option>
              ))}
            </select>
            {errors.projectTypeAr && (
              <span className="cf-error">{errors.projectTypeAr}</span>
            )}
          </div>

          {/* Description */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="com-desc">
              {isAr ? "وصف المشروع *" : "Project Description *"}
            </label>
            <textarea
              id="com-desc"
              className={`cf-input cf-textarea ${errors.descriptionAr ? "invalid" : ""}`}
              rows={5}
              placeholder={
                isAr
                  ? "صف مشروعك، أهدافه، والمكان الذي ستُعرض فيه الأعمال..."
                  : "Describe your project, goals, and where the work will be displayed..."
              }
              value={form.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)}
            />
            {errors.descriptionAr && (
              <span className="cf-error">{errors.descriptionAr}</span>
            )}
          </div>

          {/* Budget + Timeline row */}
          <div className="cf-row">
            <div className="cf-field">
              <label className="cf-label" htmlFor="com-budget">
                {isAr ? "الميزانية التقريبية" : "Approximate Budget"}
              </label>
              <select
                id="com-budget"
                className="cf-input cf-select"
                value={form.budgetRange}
                onChange={(e) => set("budgetRange", e.target.value)}
              >
                <option value="">{isAr ? "— اختر —" : "— Select —"}</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {isAr ? b.ar : `${b.ar} / ${b.en}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="cf-field">
              <label className="cf-label" htmlFor="com-timeline">
                {isAr ? "الجدول الزمني المتوقع" : "Expected Timeline"}
              </label>
              <select
                id="com-timeline"
                className="cf-input cf-select"
                value={form.timelineWeeks}
                onChange={(e) => set("timelineWeeks", e.target.value)}
              >
                <option value="">{isAr ? "— اختر —" : "— Select —"}</option>
                {TIMELINES.map((tl) => (
                  <option key={tl.value} value={tl.value}>
                    {isAr ? tl.ar : `${tl.ar} / ${tl.en}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference URLs */}
          <div className="cf-field">
            <label className="cf-label" htmlFor="com-refs">
              {isAr
                ? "روابط مرجعية (اختياري)"
                : "Reference URLs (optional)"}
            </label>
            <textarea
              id="com-refs"
              className="cf-input cf-textarea"
              rows={3}
              placeholder={
                isAr
                  ? "https://example.com\nhttps://instagram.com/..."
                  : "https://example.com\nhttps://instagram.com/..."
              }
              value={form.referenceUrls}
              onChange={(e) => set("referenceUrls", e.target.value)}
            />
          </div>

          {/* Server error */}
          {serverError && <p className="cf-server-error">{serverError}</p>}

          <button type="submit" className="cf-submit" disabled={loading}>
            {loading ? <span className="cf-spinner" /> : isAr ? "إرسال الطلب" : "Submit Request"}
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

        .cf-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 0.75rem center;
          padding-left: 2.25rem;
        }

        [dir="ltr"] .cf-select {
          background-position: right 0.75rem center;
          padding-left: 1rem;
          padding-right: 2.25rem;
        }

        .cf-textarea {
          resize: vertical;
          min-height: 110px;
          line-height: 1.65;
        }

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

        .cf-submit {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
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
