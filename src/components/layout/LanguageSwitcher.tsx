"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const next = locale === "ar" ? "en" : "ar";
    // Replace /{currentLocale}/... with /{nextLocale}/...
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="lang-switcher"
      aria-label={`Switch to ${locale === "ar" ? "English" : "Arabic"}`}
    >
      <motion.span
        key={locale}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        className="lang-label"
      >
        {locale === "ar" ? "EN" : "ع"}
      </motion.span>

      <style>{`
        .lang-switcher {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem 0.55rem;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
          flex-shrink: 0;
          line-height: 1.4;
        }
        .lang-switcher:hover {
          background: var(--bg-secondary);
          border-color: var(--text-muted);
          color: var(--text-primary);
        }
        .lang-label {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </button>
  );
}
