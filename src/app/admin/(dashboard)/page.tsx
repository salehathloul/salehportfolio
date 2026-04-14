export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Link from "next/link";

async function getStats() {
  const [works, published, featured, acquireItems, blogPosts, orders, messages] = await Promise.all([
    db.work.count(),
    db.work.count({ where: { isPublished: true } }),
    db.work.count({ where: { isFeatured: true } }),
    db.acquireItem.count({ where: { isActive: true } }),
    db.blogPost.count({ where: { status: "published" } }),
    db.order.count({ where: { status: "new" } }),
    db.contactMessage.count({ where: { status: "new" } }),
  ]);
  return { works, published, featured, acquireItems, blogPosts, orders, messages };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const quickLinks = [
    { href: "/admin/portfolio", label: "المعرض", desc: `${stats.works} عمل · ${stats.published} منشور`, icon: "🖼" },
    { href: "/admin/blog", label: "المدونة", desc: `${stats.blogPosts} تدوينة منشورة`, icon: "✍️" },
    { href: "/admin/acquire", label: "الاقتناء", desc: `${stats.acquireItems} عمل متاح`, icon: "🏷" },
    { href: "/admin/about", label: "عني", desc: "تعديل السيرة والخبرات", icon: "👤" },
    { href: "/admin/orders", label: "الطلبات الجديدة", desc: `${stats.orders} طلب بانتظارك`, icon: "📦", badge: stats.orders },
    { href: "/admin/messages", label: "الرسائل الجديدة", desc: `${stats.messages} رسالة غير مقروءة`, icon: "💬", badge: stats.messages },
    { href: "/admin/settings", label: "الإعدادات", desc: "الشعار، الخطوط، التنقل", icon: "⚙️" },
  ];

  return (
    <div className="dash">
      <div className="dash-head">
        <h1 className="dash-title">لوحة التحكم</h1>
        <p className="dash-sub">مرحباً — إليك ملخص سريع عن موقعك</p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num">{stats.works}</span>
          <span className="stat-label">عمل في المعرض</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.featured}</span>
          <span className="stat-label">مميّز في الرئيسية</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.blogPosts}</span>
          <span className="stat-label">تدوينة منشورة</span>
        </div>
        <div className="stat-card stat-card--alert" style={{ opacity: stats.orders > 0 ? 1 : 0.45 }}>
          <span className="stat-num">{stats.orders}</span>
          <span className="stat-label">طلب جديد</span>
        </div>
        <div className="stat-card stat-card--alert" style={{ opacity: stats.messages > 0 ? 1 : 0.45 }}>
          <span className="stat-num">{stats.messages}</span>
          <span className="stat-label">رسالة جديدة</span>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="ql-grid">
        {quickLinks.map(({ href, label, desc, icon, badge }) => (
          <Link key={href} href={href} className="ql-card">
            <div className="ql-icon">{icon}</div>
            <div className="ql-text">
              <span className="ql-label">
                {label}
                {badge ? <span className="ql-badge">{badge}</span> : null}
              </span>
              <span className="ql-desc">{desc}</span>
            </div>
            <svg className="ql-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 3 12 9 6"/><line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* View site link */}
      <div className="dash-footer">
        <a href="/ar" target="_blank" rel="noopener noreferrer" className="view-site-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          عرض الموقع
        </a>
      </div>

      <style>{`
        .dash { max-width: 800px; }
        .dash-head { margin-bottom: 1.75rem; }
        .dash-title { font-size: 1.5rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem; }
        .dash-sub { font-size: 0.9rem; color: var(--text-muted); }

        .stats-row {
          display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.75rem;
        }
        .stat-card {
          flex: 1; min-width: 120px; background: var(--bg-primary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.25rem;
        }
        .stat-card--alert { border-color: transparent; background: #fef3c7; }
        .dark .stat-card--alert { background: #451a03; }
        .stat-num { font-size: 1.75rem; font-weight: 600; color: var(--text-primary); line-height: 1; }
        .stat-label { font-size: 0.8rem; color: var(--text-muted); }

        .ql-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .ql-card {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.875rem 1rem; background: var(--bg-primary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          text-decoration: none; color: inherit;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .ql-card:hover { border-color: var(--text-muted); background: var(--bg-secondary); }
        .ql-icon { font-size: 1.25rem; width: 32px; text-align: center; flex-shrink: 0; }
        .ql-text { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
        .ql-label { font-size: 0.9375rem; font-weight: 500; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .ql-desc { font-size: 0.8125rem; color: var(--text-muted); }
        .ql-arrow { color: var(--text-subtle); flex-shrink: 0; }
        .ql-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 5px;
          background: #ef4444; color: #fff; border-radius: 999px;
          font-size: 0.7rem; font-weight: 700;
        }

        .dash-footer { margin-top: 1.5rem; }
        .view-site-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; color: var(--text-muted); font-size: 0.875rem;
          text-decoration: none; transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .view-site-btn:hover { color: var(--text-primary); border-color: var(--text-primary); }
      `}</style>
    </div>
  );
}
