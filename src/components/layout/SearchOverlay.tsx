"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface WorkResult {
  code: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
  locationAr: string | null;
  locationEn: string | null;
}

interface PostResult {
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
}

interface SearchResults {
  works: WorkResult[];
  posts: PostResult[];
}

interface SearchOverlayProps {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ locale, isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const isAr = locale === "ar";

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      // Small delay to ensure DOM is visible before focus
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.trim().length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q.trim())}&locale=${locale}`
          );
          const data: SearchResults = await res.json();
          setResults(data);
        } catch {
          setResults(null);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [locale]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim().length >= 2) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const hasResults =
    results && (results.works.length > 0 || results.posts.length > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="search-overlay-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="search-overlay" role="dialog" aria-label={isAr ? "بحث" : "Search"}>
        {/* Input row */}
        <div className="search-input-wrap">
          <svg
            className="search-input-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "ابحث في الأعمال والمدونة…" : "Search works and blog…"}
            className="search-overlay-input"
            dir={isAr ? "rtl" : "ltr"}
            aria-label={isAr ? "بحث" : "Search"}
          />
          {loading && <span className="search-spinner" aria-hidden="true" />}
          <button
            className="search-close-btn"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dropdown results */}
        {query.trim().length >= 2 && (
          <div className="search-results-dropdown">
            {!loading && results && !hasResults && (
              <p className="search-dropdown-empty">
                {isAr
                  ? `لا توجد نتائج لـ «${query.trim()}»`
                  : `No results for «${query.trim()}»`}
              </p>
            )}

            {results && results.works.length > 0 && (
              <div className="search-dropdown-section">
                <p className="search-dropdown-label">
                  {isAr ? "الأعمال" : "Works"}
                </p>
                {results.works.map((work) => (
                  <Link
                    key={work.code}
                    href={`/${locale}/portfolio/${work.code}`}
                    className="search-result-item"
                    onClick={onClose}
                  >
                    <div className="search-result-thumb">
                      <Image
                        src={work.imageUrl}
                        alt={isAr ? work.titleAr : work.titleEn}
                        width={48}
                        height={48}
                        className="search-result-img"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="search-result-text">
                      <span className="search-result-title">
                        {isAr ? work.titleAr : work.titleEn}
                      </span>
                      {(isAr ? work.locationAr : work.locationEn) && (
                        <span className="search-result-sub">
                          {isAr ? work.locationAr : work.locationEn}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results && results.posts.length > 0 && (
              <div className="search-dropdown-section">
                <p className="search-dropdown-label">
                  {isAr ? "المدونة" : "Blog"}
                </p>
                {results.posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/${locale}/blog/${post.slug}`}
                    className="search-result-item"
                    onClick={onClose}
                  >
                    {post.coverImage && (
                      <div className="search-result-thumb">
                        <Image
                          src={post.coverImage}
                          alt={isAr ? post.titleAr : post.titleEn}
                          width={48}
                          height={48}
                          className="search-result-img"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="search-result-text">
                      <span className="search-result-title">
                        {isAr ? post.titleAr : post.titleEn}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {hasResults && (
              <div className="search-view-all-wrap">
                <Link
                  href={`/${locale}/search?q=${encodeURIComponent(query.trim())}`}
                  className="search-view-all"
                  onClick={onClose}
                >
                  {isAr
                    ? `عرض كل النتائج لـ «${query.trim()}»`
                    : `View all results for «${query.trim()}»`}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={isAr ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .search-overlay-backdrop {
          position: fixed;
          inset: 0;
          z-index: 44;
          background: var(--overlay, rgba(0, 0, 0, 0.4));
        }

        .search-overlay {
          position: fixed;
          top: 60px;   /* matches header height */
          inset-inline: 0;
          z-index: 45;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          position: relative;
          max-width: 760px;
          margin: 0 auto;
        }

        .search-input-icon {
          flex-shrink: 0;
          color: var(--text-muted);
        }

        .search-overlay-input {
          flex: 1;
          height: 44px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1rem;
          color: var(--text-primary);
          font-family: inherit;
        }

        .search-overlay-input::placeholder {
          color: var(--text-muted);
        }

        .search-spinner {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--text-muted);
          border-radius: 50%;
          animation: search-spin 0.6s linear infinite;
        }

        @keyframes search-spin {
          to { transform: rotate(360deg); }
        }

        .search-close-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: background 0.15s, color 0.15s;
        }

        .search-close-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .search-results-dropdown {
          border-top: 1px solid var(--border-subtle);
          max-width: 760px;
          margin: 0 auto;
          padding: 0.5rem 0 0.75rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .search-dropdown-empty {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .search-dropdown-section {
          padding: 0 0.5rem;
        }

        .search-dropdown-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0.625rem 1rem 0.375rem;
          margin: 0;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: background 0.15s;
        }

        .search-result-item:hover {
          background: var(--bg-secondary);
        }

        .search-result-thumb {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .search-result-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .search-result-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .search-result-title {
          font-size: 0.875rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-result-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-view-all-wrap {
          padding: 0.375rem 1rem 0.25rem;
          border-top: 1px solid var(--border-subtle);
          margin-top: 0.25rem;
        }

        .search-view-all {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.5rem 0.5rem;
          border-radius: var(--radius-md);
          transition: color 0.15s, background 0.15s;
        }

        .search-view-all:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        @media (max-width: 768px) {
          .search-input-wrap {
            padding: 0.75rem 1rem;
          }

          .search-overlay-input {
            font-size: 0.95rem;
          }

          .search-results-dropdown {
            max-height: 55vh;
          }
        }
      `}</style>
    </>
  );
}
