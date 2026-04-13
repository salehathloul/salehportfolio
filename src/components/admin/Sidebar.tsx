"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  {
    href: "/admin",
    label: "الرئيسية",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    exact: true,
  },
  {
    href: "/admin/portfolio",
    label: "المعرض",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/blog",
    label: "المدونة",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    href: "/admin/acquire",
    label: "الاقتناء",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    href: "/admin/about",
    label: "عني",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "الطلبات",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: "/admin/messages",
    label: "الرسائل",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "الإعدادات",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">ص</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">صالح الهذلول</span>
            <span className="sidebar-brand-role">لوحة التحكم</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href, item.exact) ? "nav-item--active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* View site link */}
        <div className="sidebar-divider" />
        <Link
          href="/ar"
          target="_blank"
          rel="noopener"
          className="nav-item nav-item--secondary"
        >
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
          <span className="nav-label">عرض الموقع</span>
        </Link>

        {/* User + Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "م"}
            </div>
            <div className="user-info">
              <span className="user-name">
                {session?.user?.name ?? "المدير"}
              </span>
              <span className="user-email">{session?.user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="logout-btn"
            title="تسجيل الخروج"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 240px;
          min-width: 240px;
          background: var(--bg-primary);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100dvh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          padding: 1.25rem 0;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.25rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 0.5rem;
        }

        .sidebar-logo {
          width: 38px;
          height: 38px;
          min-width: 38px;
          background: var(--text-primary);
          color: var(--bg-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-family: var(--font-heading);
        }

        .sidebar-brand-text {
          display: flex;
          flex-direction: column;
        }

        .sidebar-brand-name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .sidebar-brand-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 0.75rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.625rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.9rem;
          transition: background var(--transition-fast), color var(--transition-fast);
          text-decoration: none;
        }

        .nav-item:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .nav-item--active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: 500;
        }

        .nav-item--secondary {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .nav-label {
          white-space: nowrap;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 0.5rem 0.75rem;
        }

        .sidebar-footer {
          margin-top: 0.5rem;
          padding: 0.75rem 1.25rem 0;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex: 1;
          min-width: 0;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          min-width: 32px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.6875rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          direction: ltr;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          min-width: 32px;
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .logout-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        /* Mobile: collapse sidebar into top bar */
        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            min-width: unset;
            height: auto;
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            z-index: 50;
            flex-direction: row;
            border-left: none;
            border-bottom: 1px solid var(--border);
            padding: 0.5rem 1rem;
            overflow-x: auto;
            overflow-y: hidden;
          }

          .sidebar-brand {
            border-bottom: none;
            margin-bottom: 0;
            padding: 0;
            padding-left: 1rem;
          }

          .sidebar-brand-text {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;
            gap: 2px;
            padding: 0;
            flex: 1;
          }

          .nav-item {
            flex-direction: column;
            gap: 0.25rem;
            padding: 0.375rem 0.5rem;
            font-size: 0.6875rem;
          }

          .nav-label {
            display: none;
          }

          .sidebar-divider {
            display: none;
          }

          .sidebar-footer {
            border-top: none;
            padding: 0;
            margin: 0;
          }

          .user-info { display: none; }
          .user-avatar { display: none; }
          .sidebar-user { display: none; }
        }
      `}</style>
    </>
  );
}
