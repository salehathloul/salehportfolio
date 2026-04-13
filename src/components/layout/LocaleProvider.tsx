"use client";

import { useEffect } from "react";

interface SiteSettings {
  fontHeadingUrl?: string | null;
  fontBodyUrl?: string | null;
  fontHeadingName?: string | null;
  fontBodyName?: string | null;
}

interface LocaleProviderProps {
  locale: string;
  settings: SiteSettings | null;
  children: React.ReactNode;
}

export default function LocaleProvider({ locale, settings, children }: LocaleProviderProps) {
  const isRTL = locale === "ar";

  // ── Set html lang/dir ─────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [locale, isRTL]);

  // ── Apply saved theme on mount (prevents FOUC) ────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // ── Apply custom fonts from settings ──────────────────────────────────────
  useEffect(() => {
    if (!settings) return;

    const existing = document.getElementById("site-custom-fonts");
    if (existing) existing.remove();

    const parts: string[] = [];

    if (settings.fontHeadingUrl && settings.fontHeadingName) {
      parts.push(`
        @font-face {
          font-family: '${settings.fontHeadingName}';
          src: url('${settings.fontHeadingUrl}') format('woff2');
          font-display: swap;
        }
      `);
      document.documentElement.style.setProperty(
        "--font-heading-custom",
        `'${settings.fontHeadingName}'`
      );
    }

    if (settings.fontBodyUrl && settings.fontBodyName) {
      parts.push(`
        @font-face {
          font-family: '${settings.fontBodyName}';
          src: url('${settings.fontBodyUrl}') format('woff2');
          font-display: swap;
        }
      `);
      document.documentElement.style.setProperty(
        "--font-body-custom",
        `'${settings.fontBodyName}'`
      );
    }

    if (parts.length) {
      const style = document.createElement("style");
      style.id = "site-custom-fonts";
      style.textContent = parts.join("\n");
      document.head.appendChild(style);
    }
  }, [settings]);

  return <>{children}</>;
}
