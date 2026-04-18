import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale().catch(() => "ar");
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const quote = isAr
    ? "بعض الصور لا تُلتقط — تُكتشف"
    : "Some frames aren't captured — they're discovered";

  return (
    <div className="nf-wrap" dir={dir}>
      <div className="nf-bg-quote" aria-hidden="true">{quote}</div>
      <div className="nf-inner">
        <span className="nf-code">404</span>
        <h1 className="nf-title">
          {isAr ? "هذه الصفحة غير موجودة" : "This page doesn't exist"}
        </h1>
        <p className="nf-desc">
          {isAr
            ? "ربما تم نقل الرابط أو حذفه. جرّب الانتقال لمكان آخر."
            : "This link may have moved or been removed. Try heading somewhere else."}
        </p>
        <div className="nf-links">
          <Link href={`/${locale}`} className="nf-btn nf-btn--primary">
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <Link href={`/${locale}/portfolio`} className="nf-btn">
            {isAr ? "المعرض" : "Portfolio"}
          </Link>
          <Link href={`/${locale}/contact`} className="nf-btn">
            {isAr ? "تواصل" : "Contact"}
          </Link>
        </div>
      </div>

      <style>{`
        .nf-wrap {
          position: relative;
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          overflow: hidden;
        }

        .nf-bg-quote {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: clamp(1.5rem, 5vw, 3.5rem);
          font-weight: 200;
          color: var(--border);
          text-align: center;
          padding: 2rem 4rem;
          line-height: 1.3;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.02em;
        }

        .nf-inner {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 480px;
        }

        .nf-code {
          display: block;
          font-size: clamp(4rem, 15vw, 7rem);
          font-family: var(--font-heading);
          font-weight: 200;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 1rem;
          letter-spacing: -0.04em;
        }

        .nf-title {
          font-family: var(--font-heading);
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          font-weight: 300;
          color: var(--text-primary);
          margin: 0 0 0.75rem;
        }

        .nf-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0 0 2.5rem;
        }

        .nf-links {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          height: 40px;
          padding: 0 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          text-decoration: none;
          transition: border-color 150ms, color 150ms, background 150ms;
        }
        .nf-btn:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .nf-btn--primary {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }
        .nf-btn--primary:hover {
          opacity: 0.85;
          background: var(--text-primary);
          color: var(--bg-primary);
        }
      `}</style>
    </div>
  );
}
