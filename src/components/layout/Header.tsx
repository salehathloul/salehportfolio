"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchOverlay from "./SearchOverlay";
import { useVisitor } from "@/components/auth/VisitorContext";
import LoginModal from "@/components/auth/LoginModal";

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
  customLinks?: string | null; // JSON: [{id,labelAr,labelEn,url,openNew}]
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
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { visitor, logout } = useVisitor();

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
    { href: `/${locale}/portfolio`, label: nav(settings?.navPortfolioAr, settings?.navPortfolioEn, "portfolio"), visible: isVisible("navPortfolioVisible"), external: false },
    { href: `/${locale}/blog`,      label: nav(settings?.navBlogAr,       settings?.navBlogEn,       "blog"),      visible: isVisible("navBlogVisible"),      external: false },
    { href: `/${locale}/acquire`,   label: nav(settings?.navAcquireAr,    settings?.navAcquireEn,    "acquire"),   visible: isVisible("navAcquireVisible"),   external: false },
    { href: `/${locale}/about`,     label: nav(settings?.navAboutAr,      settings?.navAboutEn,      "about"),     visible: isVisible("navAboutVisible"),     external: false },
    { href: `/${locale}/contact`,   label: nav(settings?.navContactAr,    settings?.navContactEn,    "contact"),   visible: isVisible("navContactVisible"),   external: false },
  ].filter((l) => l.visible);

  // Custom external links (added from admin settings)
  const customNavLinks: { href: string; label: string; openNew: boolean }[] = (() => {
    try {
      const parsed = JSON.parse(settings?.customLinks ?? "[]");
      return (parsed as { labelAr?: string; labelEn?: string; url?: string; openNew?: boolean }[])
        .filter((l) => l.url)
        .map((l) => ({
          href: l.url!,
          label: (locale === "ar" ? l.labelAr : l.labelEn) || l.labelAr || l.labelEn || l.url!,
          openNew: l.openNew ?? false,
        }));
    } catch { return []; }
  })();

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
            {customNavLinks.map(({ href, label, openNew }) => (
              <a
                key={href}
                href={href}
                className="nav-link"
                target={openNew ? "_blank" : undefined}
                rel={openNew ? "noopener noreferrer" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Controls */}
          <div className="header-controls">
            {/* Search icon */}
            <button
              className="header-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label={locale === "ar" ? "بحث" : "Search"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Visitor login / avatar */}
            {visitor ? (
              <div className="visitor-menu-wrap">
                <button
                  className="visitor-avatar"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={visitor.name}
                >
                  {visitor.name.charAt(0).toUpperCase()}
                </button>
                {showUserMenu && (
                  <>
                    <div className="visitor-dropdown">
                      <p className="visitor-dropdown-name">{visitor.name}</p>
                      <p className="visitor-dropdown-email">{visitor.email}</p>
                      <button
                        className="visitor-dropdown-logout"
                        onClick={async () => { await logout(); setShowUserMenu(false); }}
                      >
                        {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
                      </button>
                    </div>
                    <div className="visitor-dropdown-overlay" onClick={() => setShowUserMenu(false)} />
                  </>
                )}
              </div>
            ) : (
              <button
                className="visitor-login-btn"
                onClick={() => setShowLogin(true)}
                title={locale === "ar" ? "دخول" : "Sign in"}
                aria-label={locale === "ar" ? "دخول" : "Sign in"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>
            )}

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
              {customNavLinks.map(({ href, label, openNew }, i) => (
                <motion.div
                  key={`custom-${href}`}
                  initial={{ opacity: 0, x: locale === "ar" ? 16 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + i) * 0.05, duration: 0.2 }}
                >
                  <a
                    href={href}
                    className="mobile-nav-link"
                    target={openNew ? "_blank" : undefined}
                    rel={openNew ? "noopener noreferrer" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
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

      {/* Search overlay */}
      <SearchOverlay
        locale={locale}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Login modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          locale={locale}
          source="nav"
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
          gap: 0;
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

        /* ── Generic header icon button (search, etc.) ── */
        .header-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          flex-shrink: 0;
        }
        .header-icon-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        /* ── Visitor login button ── */
        .visitor-login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          flex-shrink: 0;
        }
        .visitor-login-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        /* ── Visitor avatar + dropdown ── */
        .visitor-menu-wrap { position: relative; }

        .visitor-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none; cursor: pointer;
          font-size: 0.875rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          transition: opacity var(--transition-fast);
        }
        .visitor-avatar:hover { opacity: 0.85; }

        .visitor-dropdown-overlay {
          position: fixed; inset: 0; z-index: 49;
        }

        .visitor-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          inset-inline-end: 0;
          z-index: 50;
          min-width: 180px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .visitor-dropdown-name {
          font-size: 0.875rem; font-weight: 500;
          color: var(--text-primary); margin: 0 0 0.125rem;
        }

        .visitor-dropdown-email {
          font-size: 0.75rem; color: var(--text-muted);
          direction: ltr; margin: 0 0 0.75rem;
          word-break: break-all;
        }

        .visitor-dropdown-logout {
          width: 100%; height: 32px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .visitor-dropdown-logout:hover {
          border-color: #e53e3e; color: #e53e3e;
        }
      `}</style>
    </>
  );
}
