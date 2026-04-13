"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

interface SiteSettings {
  logoLight?: string | null;
  logoDark?: string | null;
  logoLightAr?: string | null;
  logoDarkAr?: string | null;
  logoLightEn?: string | null;
  logoDarkEn?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  navPortfolioAr?: string | null;
  navPortfolioEn?: string | null;
  navBlogAr?: string | null;
  navBlogEn?: string | null;
  navAcquireAr?: string | null;
  navAcquireEn?: string | null;
  navAboutAr?: string | null;
  navAboutEn?: string | null;
  navContactAr?: string | null;
  navContactEn?: string | null;
  navPortfolioVisible?: boolean | null;
  navBlogVisible?: boolean | null;
  navAcquireVisible?: boolean | null;
  navAboutVisible?: boolean | null;
  navContactVisible?: boolean | null;
}

interface HeaderProps {
  settings: SiteSettings | null;
}

export default function Header({ settings }: HeaderProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Track dark mode for logo switch
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const nav = (arLabel: string | null | undefined, enLabel: string | null | undefined, tKey: string) =>
    (locale === "ar" ? arLabel : enLabel) || t(tKey as Parameters<typeof t>[0]);

  const siteName =
    locale === "ar"
      ? (settings?.titleAr ?? "صالح الهذلول")
      : (settings?.titleEn ?? "Saleh Alhuthloul");

  // Pick logo: language-specific first, then generic fallback
  const logoSrc = isDark
    ? (locale === "ar" ? settings?.logoDarkAr : settings?.logoDarkEn) ?? settings?.logoDark
    : (locale === "ar" ? settings?.logoLightAr : settings?.logoLightEn) ?? settings?.logoLight;

  const isVisible = (key: "navPortfolioVisible" | "navBlogVisible" | "navAcquireVisible" | "navAboutVisible" | "navContactVisible") =>
    settings?.[key] !== false;

  const navLinks = [
    { href: `/${locale}/portfolio`, label: nav(settings?.navPortfolioAr, settings?.navPortfolioEn, "portfolio"), visible: isVisible("navPortfolioVisible") },
    { href: `/${locale}/blog`,      label: nav(settings?.navBlogAr,       settings?.navBlogEn,       "blog"),      visible: isVisible("navBlogVisible") },
    { href: `/${locale}/acquire`,   label: nav(settings?.navAcquireAr,    settings?.navAcquireEn,    "acquire"),   visible: isVisible("navAcquireVisible") },
    { href: `/${locale}/about`,     label: nav(settings?.navAboutAr,      settings?.navAboutEn,      "about"),     visible: isVisible("navAboutVisible") },
    { href: `/${locale}/contact`,   label: nav(settings?.navContactAr,    settings?.navContactEn,    "contact"),   visible: isVisible("navContactVisible") },
  ].filter((l) => l.visible);

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner container">
          {/* Logo / Site name */}
          <Link href={`/${locale}`} className="header-logo">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={siteName}
                width={120}
                height={40}
                className="logo-img"
                priority
              />
            ) : (
              <span className="logo-text">{siteName}</span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="header-controls">
            <LanguageSwitcher />
            <ThemeToggle />
            {/* Mobile hamburger */}
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
            >
              <span className={`ham-bar ${menuOpen ? "open" : ""}`} />
              <span className={`ham-bar ${menuOpen ? "open" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <nav className="mobile-nav">
              {navLinks.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: locale === "ar" ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={href}
                    className={`mobile-nav-link ${isActive(href) ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close menu */}
      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--bg-primary);
          border-bottom: 1px solid transparent;
          transition:
            border-color var(--transition-base),
            backdrop-filter var(--transition-base),
            box-shadow var(--transition-base);
        }

        .site-header.scrolled {
          border-bottom-color: var(--border-subtle);
          box-shadow: 0 1px 20px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(8px);
          background: color-mix(in srgb, var(--bg-primary) 92%, transparent);
        }

        .header-inner {
          display: flex;
          align-items: center;
          height: 60px;
          gap: 0.75rem;
        }

        /* Logo — takes all leftover space so nav+controls cluster at the start */
        .header-logo {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          text-decoration: none;
          margin-inline-end: auto;
        }

        .logo-img {
          height: 19px;
          width: auto;
          object-fit: contain;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: clamp(0.7rem, 1.25vw, 1rem);
          font-weight: 400;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          white-space: nowrap;
          line-height: 1;
        }

        /* Desktop nav — grouped with controls on the left (RTL start) */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .nav-link {
          padding: 0.3rem 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast), background var(--transition-fast);
          white-space: nowrap;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .nav-link.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Controls */
        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-shrink: 0;
        }

        /* Hamburger */
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0 9px;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .hamburger:hover {
          background: var(--bg-secondary);
        }

        .ham-bar {
          display: block;
          height: 1.5px;
          width: 100%;
          background: var(--text-secondary);
          border-radius: 2px;
          transition: transform var(--transition-base), opacity var(--transition-fast);
          transform-origin: center;
        }

        .ham-bar.open:first-child {
          transform: translateY(3.25px) rotate(45deg);
        }

        .ham-bar.open:last-child {
          transform: translateY(-3.25px) rotate(-45deg);
        }

        /* Mobile menu */
        .mobile-menu {
          position: fixed;
          top: 64px;
          inset-inline: 0;
          z-index: 39;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          padding: 1rem 0 1.5rem;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding: 0 1rem;
        }

        .mobile-nav-link {
          display: block;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .mobile-nav-link:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .mobile-nav-link.active {
          color: var(--text-primary);
          font-weight: 500;
        }

        .mobile-overlay {
          position: fixed;
          inset: 64px 0 0 0;
          z-index: 38;
          background: var(--overlay);
        }

        @media (max-width: 768px) {
          .header-nav {
            display: none;
          }

          .hamburger {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
