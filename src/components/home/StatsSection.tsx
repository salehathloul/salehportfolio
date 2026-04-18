"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";

interface StatItem {
  value: number;
  labelAr: string;
  labelEn: string;
}

interface StatsSectionProps {
  stats: StatItem[];
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const locale = useLocale();
  if (!stats.length) return null;

  return (
    <section className="stats-section container">
      <div className="stats-grid">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="stat-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="stat-value">{s.value}+</span>
            <span className="stat-label">{locale === "ar" ? s.labelAr : s.labelEn}</span>
          </motion.div>
        ))}
      </div>

      <style>{`
        .stats-section {
          padding-block: 4rem;
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .stat-value {
          font-family: var(--font-heading);
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 200;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>
    </section>
  );
}
