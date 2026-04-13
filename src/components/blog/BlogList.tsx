"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

interface Post {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

interface Props {
  posts: Post[];
}

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: (i % 3) * 0.1,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

function PostCard({ post, index }: { post: Post; index: number }) {
  const locale = useLocale();
  const t = useTranslations("blog");
  const [imgLoaded, setImgLoaded] = useState(false);

  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const date = post.publishedAt ?? post.createdAt;
  const formatted = new Intl.DateTimeFormat(locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
    >
      <Link href={`/${locale}/blog/${post.slug}`} className="bl-card">
        <div className="bl-cover">
          {post.coverImage ? (
            <>
              <div className={`bl-shimmer ${imgLoaded ? "bl-shimmer--done" : ""}`} />
              <Image
                src={post.coverImage}
                alt={title}
                fill
                className={`bl-cover-img ${imgLoaded ? "bl-cover-img--loaded" : ""}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className="bl-cover-empty" />
          )}
        </div>

        <div className="bl-body">
          <time className="bl-date">{formatted}</time>
          <h2 className="bl-title">{title}</h2>
          <span className="bl-cta">
            {t("readMore")}
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {locale === "ar" ? <path d="M8 3L4 6.5l4 3.5" /> : <path d="M5 3l4 3.5L5 10" />}
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogList({ posts }: Props) {
  const t = useTranslations("blog");

  if (posts.length === 0) {
    return (
      <motion.p
        className="bl-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {t("noPosts")}
      </motion.p>
    );
  }

  return (
    <>
      <div className="bl-grid">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </div>

      <style>{`
        .bl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem 2rem;
        }

        @media (max-width: 1024px) { .bl-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px)  { .bl-grid { grid-template-columns: 1fr; gap: 2rem; } }

        .bl-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 5rem 0;
        }

        /* Card */
        .bl-card { display: block; text-decoration: none; }

        .bl-cover {
          position: relative;
          padding-bottom: 64%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
          margin-bottom: 1.1rem;
        }

        .bl-shimmer {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%);
          background-size: 200% 100%;
          animation: bl-shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }

        .bl-shimmer--done { opacity: 0; pointer-events: none; }

        @keyframes bl-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .bl-cover-img {
          object-fit: cover;
          transition: transform 600ms ease, opacity 0.45s;
          opacity: 0;
        }

        .bl-cover-img--loaded { opacity: 1; }
        .bl-card:hover .bl-cover-img { transform: scale(1.04); }

        .bl-cover-empty {
          position: absolute;
          inset: 0;
          background: var(--bg-tertiary);
        }

        /* Body */
        .bl-body {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .bl-date {
          font-size: 0.72rem;
          color: var(--text-subtle);
          letter-spacing: 0.02em;
        }

        .bl-title {
          font-family: var(--font-heading);
          font-size: clamp(1rem, 1.8vw, 1.2rem);
          font-weight: 400;
          color: var(--text-primary);
          line-height: 1.45;
          transition: opacity var(--transition-fast);
        }

        .bl-card:hover .bl-title { opacity: 0.7; }

        .bl-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          transition: color var(--transition-fast), gap var(--transition-fast);
        }

        .bl-card:hover .bl-cta {
          color: var(--text-primary);
          gap: 0.5rem;
        }
      `}</style>
    </>
  );
}
