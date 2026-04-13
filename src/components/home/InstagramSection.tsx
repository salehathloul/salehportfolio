"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";

interface Props {
  username: string | null;
  profileUrl: string | null;
}

// Instagram logo SVG
function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function InstagramSection({ username, profileUrl }: Props) {
  const locale = useLocale();
  const isAr = locale === "ar";

  // Resolve profile URL
  const href =
    profileUrl ??
    (username ? `https://www.instagram.com/${username.replace(/^@/, "")}/` : "https://www.instagram.com/");

  const displayHandle = username
    ? (username.startsWith("@") ? username : `@${username}`)
    : "@instagram";

  return (
    <section className="ig-section container">
      <motion.div
        className="ig-inner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Icon */}
        <div className="ig-icon">
          <InstagramIcon />
        </div>

        {/* Text */}
        <div className="ig-text">
          <p className="ig-label">
            {isAr ? "تابعني على إنستغرام" : "Follow me on Instagram"}
          </p>
          <p className="ig-handle">{displayHandle}</p>
        </div>

        {/* CTA */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ig-cta"
        >
          {isAr ? "فتح الحساب" : "Open Profile"}
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 11L11 2M11 2H5M11 2v6" />
          </svg>
        </a>
      </motion.div>

      {/* Subtle grid of placeholder tiles hinting at a feed */}
      <motion.div
        className="ig-grid"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="ig-tile"
            aria-label={isAr ? "منشور على إنستغرام" : "Instagram post"}
          >
            <div className="ig-tile-overlay">
              <InstagramIcon />
            </div>
          </a>
        ))}
      </motion.div>

      <style>{`
        .ig-section {
          padding-block: 5rem 6rem;
          border-top: 1px solid var(--border-subtle);
        }

        /* ── Header row ── */
        .ig-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .ig-icon {
          width: 48px;
          height: 48px;
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .ig-text {
          flex: 1;
          min-width: 0;
        }

        .ig-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.2rem;
        }

        .ig-handle {
          font-family: var(--font-heading);
          font-size: clamp(1.1rem, 2vw, 1.45rem);
          font-weight: 400;
          color: var(--text-primary);
        }

        .ig-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.2rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--text-secondary);
          white-space: nowrap;
          transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
        }

        .ig-cta:hover {
          color: var(--text-primary);
          border-color: var(--text-primary);
          background: var(--bg-secondary);
        }

        /* ── Feed placeholder grid ── */
        .ig-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.625rem;
        }

        @media (max-width: 900px) {
          .ig-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 480px) {
          .ig-grid { grid-template-columns: repeat(3, 1fr); gap: 0.375rem; }
          .ig-section { padding-block: 3.5rem 4.5rem; }
        }

        .ig-tile {
          position: relative;
          padding-bottom: 100%;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: block;
          transition: transform var(--transition-base);
        }

        .ig-tile:hover {
          transform: scale(1.03);
        }

        .ig-tile-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--border);
          opacity: 0;
          transition: opacity var(--transition-base);
        }

        .ig-tile:hover .ig-tile-overlay {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
