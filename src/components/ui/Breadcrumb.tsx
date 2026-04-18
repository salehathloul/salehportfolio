// Simple breadcrumb nav — server component
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="bc-nav" aria-label="Breadcrumb">
      <ol className="bc-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="bc-item">
              {!isLast && item.href ? (
                <Link href={item.href} className="bc-link">
                  {item.label}
                </Link>
              ) : (
                <span className="bc-current" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="bc-sep" aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
      <style>{`
        .bc-nav {
          margin-bottom: 0.75rem;
        }
        .bc-list {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.25rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bc-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .bc-sep {
          color: var(--text-subtle);
          font-size: 0.75rem;
          line-height: 1;
          user-select: none;
        }
        .bc-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }
        .bc-link:hover {
          color: var(--text-primary);
        }
        .bc-current {
          color: var(--text-subtle);
        }
      `}</style>
    </nav>
  );
}
