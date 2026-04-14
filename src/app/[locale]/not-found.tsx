import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale().catch(() => "ar");
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div className="nf-wrap" dir={dir}>
      <div className="nf-inner">
        <span className="nf-code">404</span>
        <h1 className="nf-title">
          {isAr ? "الصفحة غير موجودة" : "Page not found"}
        </h1>
        <p className="nf-desc">
          {isAr
            ? "الرابط الذي تبحث عنه غير موجود أو تم نقله."
            : "The page you're looking for doesn't exist or has been moved."}
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
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
        }

        .nf-inner {
          text-align: center;
          max-width: 480px;
        }

        .nf-code {
          display: block;
          font-size: clamp(5rem, 20vw, 9rem);
          font-family: var(--font-heading);
          font-weight: 200;
          color: var(--border);
          line-height: 1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.04em;
        }

        .nf-title {
          font-family: var(--font-heading);
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 0.75rem;
        }

        .nf-desc {
          font-size: 0.9375rem;
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
