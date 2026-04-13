"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

// Quote font sizes mapped to CSS values
const QUOTE_SIZES: Record<string, string> = {
  xs: "clamp(1.1rem, 1.8vw, 1.6rem)",
  sm: "clamp(1.3rem, 2.2vw, 2rem)",
  md: "clamp(1.6rem, 3.5vw, 3rem)",
  lg: "clamp(2rem, 4.5vw, 4rem)",
  xl: "clamp(2.5rem, 6vw, 5.5rem)",
};

const QUOTE_WEIGHTS: Record<string, number> = {
  normal: 300,
  medium: 500,
  semibold: 600,
  bold: 700,
};

interface Props {
  imageUrl: string | null;
  quote: string | null;
  heroQuoteSize?: string | null;
  heroQuoteLineHeight?: string | null;
  heroQuoteWeight?: string | null;
}

export default function HeroSection({ imageUrl, quote, heroQuoteSize, heroQuoteLineHeight, heroQuoteWeight }: Props) {
  const locale = useLocale();
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves at 25% of scroll speed
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  // Content fades + rises as user scrolls
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.55], ["0%", "8%"]);

  const quoteFontSize = QUOTE_SIZES[heroQuoteSize ?? "md"] ?? QUOTE_SIZES.md;

  return (
    <section ref={ref} className="hero">
      {/* Background image with parallax */}
      <div className="hero-bg-wrap">
        {imageUrl ? (
          <motion.div className="hero-img-container" style={{ y: imageY }}>
            <Image
              src={imageUrl}
              alt=""
              fill
              priority
              className="hero-img"
              sizes="100vw"
            />
          </motion.div>
        ) : (
          <div className="hero-placeholder" />
        )}
        <div className="hero-overlay" />
      </div>

      {/* Content — positioned slightly above vertical center */}
      <motion.div
        className="hero-content container"
        style={{ opacity: contentOpacity, y: contentY }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        {quote && (
          <blockquote
            className="hero-quote"
            style={{
              fontSize: quoteFontSize,
              lineHeight: heroQuoteLineHeight ?? "1.5",
              fontWeight: QUOTE_WEIGHTS[heroQuoteWeight ?? "normal"] ?? 300,
            }}
          >
            {quote}
          </blockquote>
        )}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        >
          <Link href={`/${locale}/portfolio`} className="hero-cta">
            {t("viewPortfolio")}
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <motion.span
          className="hero-scroll-line"
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 0.5 }}
        />
      </motion.div>

      <style>{`
        /* ── Hero wrapper — fixed viewport height regardless of image ── */
        .hero {
          position: relative;
          height: 100svh;
          min-height: 580px;
          max-height: 1200px;
          overflow: hidden;
          /* Center content then offset up ~12% to sit slightly above middle */
          display: flex;
          align-items: center;
        }

        /* Background layers — extra vertical room for parallax movement */
        .hero-bg-wrap {
          position: absolute;
          inset: -12% 0;
          z-index: 0;
        }

        .hero-img-container {
          position: absolute;
          inset: 0;
          will-change: transform;
        }

        /* Force image to always fill the container regardless of its own ratio */
        .hero-img {
          object-fit: cover;
          object-position: center;
        }

        .hero-placeholder {
          position: absolute;
          inset: 0;
          background: var(--bg-tertiary);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.06) 0%,
            rgba(0, 0, 0, 0.20) 35%,
            rgba(0, 0, 0, 0.58) 100%
          );
        }

        /* ── Content — slightly above center ── */
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 760px;
          will-change: transform, opacity;
          /* bias up from true center: negative margin pulls content up */
          margin-top: -10vh;
          padding-bottom: 0;
        }

        /* ── Quote — multi-line, size-controllable ── */
        .hero-quote {
          font-family: var(--font-heading);
          /* font-size is set inline from heroQuoteSize prop */
          font-weight: 300;
          line-height: 1.5;
          color: #fff;
          margin: 0 0 2rem;
          border: none;
          padding: 0;
          letter-spacing: -0.01em;
          /* Preserve line breaks entered in admin (\n → visible break) */
          white-space: pre-line;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: rgba(255, 255, 255, 0.92);
          font-size: 0.85rem;
          letter-spacing: 0.07em;
          border-radius: var(--radius-md);
          transition:
            background var(--transition-fast),
            border-color var(--transition-fast),
            color var(--transition-fast);
        }

        .hero-cta:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.85);
          color: #fff;
        }

        /* ── Scroll indicator ── */
        .hero-scroll-hint {
          position: absolute;
          bottom: 2.5rem;
          inset-inline-start: 50%;
          transform: translateX(-50%);
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-scroll-line {
          display: block;
          width: 1px;
          height: 48px;
          background: rgba(255, 255, 255, 0.5);
          will-change: transform, opacity;
        }

        @media (max-width: 640px) {
          .hero-content {
            margin-top: -8vh;
          }

          .hero-scroll-hint {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
