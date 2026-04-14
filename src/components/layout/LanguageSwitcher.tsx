"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const next = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="lang-switcher"
      aria-label={`Switch to ${locale === "ar" ? "English" : "Arabic"}`}
      title={locale === "ar" ? "English" : "العربية"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={locale}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          className="lang-icon"
        >
          {locale === "ar" ? (
            /* Globe → switch to EN */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8M3.6 15h16.8" />
              <path d="M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
            </svg>
          ) : (
            /* Globe → switch to AR */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8M3.6 15h16.8" />
              <path d="M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>

      <style>{`
        .lang-switcher {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          flex-shrink: 0;
        }
        .lang-switcher:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .lang-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </button>
  );
}
