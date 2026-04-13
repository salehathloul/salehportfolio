"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  message: string;
  status: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  collaboration: "تعاون",
  inquiry: "استفسار",
  acquisition: "اقتناء",
  media: "إعلام",
  other: "أخرى",
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  replied: "تم الرد",
  closed: "مغلق",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  replied: "#10b981",
  closed: "#6b7280",
};

// ── Message detail panel ──────────────────────────────────────────────────────

function MessageDetail({
  msg,
  onUpdate,
  onClose,
}: {
  msg: ContactMessage;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(msg.status);
  const [saving, setSaving] = useState(false);

  async function save(newStatus: string) {
    setSaving(true);
    await fetch(`/api/contact/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h3>{msg.name}</h3>
            <span
              className="msg-badge"
              style={{ color: STATUS_COLORS[status] }}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="msg-detail-body">
          {/* Meta */}
          <div className="msg-meta">
            <div className="msg-meta-row">
              <span>البريد</span>
              <a href={`mailto:${msg.email}`} dir="ltr">{msg.email}</a>
            </div>
            {msg.phone && (
              <div className="msg-meta-row">
                <span>الجوال</span>
                <a href={`tel:${msg.phone}`} dir="ltr">{msg.phone}</a>
              </div>
            )}
            <div className="msg-meta-row">
              <span>التصنيف</span>
              <strong>{CATEGORY_LABELS[msg.category] ?? msg.category}</strong>
            </div>
            <div className="msg-meta-row">
              <span>التاريخ</span>
              <span>{new Date(msg.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>

          {/* Message */}
          <div className="msg-body-text">{msg.message}</div>

          {/* Status actions */}
          <div className="msg-actions">
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => save(val)}
                disabled={saving || status === val}
                className={`msg-status-btn ${status === val ? "current" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    const url = `/api/contact${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url);
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div>
          <h1 className="messages-title">
            الرسائل
            {newCount > 0 && <span className="messages-new-badge">{newCount}</span>}
          </h1>
          <p className="messages-subtitle">{messages.length} رسالة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="messages-filters">
        <div className="filter-group">
          <span className="filter-label">الحالة:</span>
          <div className="filter-tabs">
            {["all", ...Object.keys(STATUS_LABELS)].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`filter-tab ${statusFilter === s ? "active" : ""}`}
              >
                {s === "all" ? "الكل" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">التصنيف:</span>
          <div className="filter-tabs">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`filter-tab ${categoryFilter === "all" ? "active" : ""}`}
            >
              الكل
            </button>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setCategoryFilter(val)}
                className={`filter-tab ${categoryFilter === val ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="messages-loading">جاري التحميل...</div>
      ) : messages.length === 0 ? (
        <div className="messages-empty">لا توجد رسائل</div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <button
              key={msg.id}
              className={`message-card ${msg.status === "new" ? "unread" : ""}`}
              onClick={() => setSelected(msg)}
            >
              <div className="message-card-left">
                <div className="message-card-top">
                  <strong className="message-name">{msg.name}</strong>
                  <span className="message-category">
                    {CATEGORY_LABELS[msg.category] ?? msg.category}
                  </span>
                </div>
                <p className="message-preview">
                  {msg.message.length > 100 ? msg.message.slice(0, 100) + "..." : msg.message}
                </p>
                <span className="message-email" dir="ltr">{msg.email}</span>
              </div>
              <div className="message-card-right">
                <span
                  className="message-status"
                  style={{ color: STATUS_COLORS[msg.status] }}
                >
                  {STATUS_LABELS[msg.status] ?? msg.status}
                </span>
                <span className="message-date">
                  {new Date(msg.createdAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <MessageDetail
          msg={selected}
          onUpdate={() => { fetchMessages(); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`
        .messages-page { max-width: 860px; margin: 0 auto; }

        .messages-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .messages-title {
          font-size: 1.5rem; font-weight: 600; color: var(--text-primary);
          margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .messages-new-badge {
          font-size: 0.75rem; background: #3b82f6; color: #fff;
          padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 600;
        }
        .messages-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .messages-filters { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .filter-label { font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap; }
        .filter-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .filter-tab {
          padding: 0.25rem 0.75rem; border: 1px solid var(--border);
          background: transparent; color: var(--text-muted);
          border-radius: 999px; font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-tab.active {
          background: var(--text-primary); color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .messages-loading, .messages-empty {
          text-align: center; color: var(--text-muted);
          padding: 3rem 1rem; font-size: 0.9375rem;
        }

        .messages-list { display: flex; flex-direction: column; gap: 0.5rem; }

        .message-card {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; padding: 1rem 1.25rem;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); cursor: pointer; text-align: right; width: 100%;
          transition: border-color var(--transition-fast);
        }
        .message-card:hover { border-color: var(--text-muted); }
        .message-card.unread { border-inline-start: 3px solid #3b82f6; }

        .message-card-left { flex: 1; min-width: 0; }
        .message-card-top { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.375rem; }
        .message-name { font-size: 0.9375rem; color: var(--text-primary); }
        .message-category {
          font-size: 0.7rem; color: var(--text-muted); background: var(--bg-secondary);
          padding: 0.125rem 0.5rem; border-radius: 999px; border: 1px solid var(--border);
        }
        .message-preview {
          font-size: 0.875rem; color: var(--text-secondary);
          margin-bottom: 0.375rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 480px;
        }
        .message-email { font-size: 0.75rem; color: var(--text-subtle); }

        .message-card-right {
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 0.375rem; flex-shrink: 0;
        }
        .message-status { font-size: 0.75rem; font-weight: 500; }
        .message-date { font-size: 0.75rem; color: var(--text-subtle); white-space: nowrap; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
        }
        .modal-box {
          background: var(--bg-primary); border-radius: var(--radius-lg);
          width: 100%; max-width: 520px; max-height: 88vh;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .modal-header-left { display: flex; align-items: center; gap: 0.625rem; }
        .modal-header h3 { font-size: 1rem; font-weight: 500; color: var(--text-primary); }
        .msg-badge { font-size: 0.75rem; font-weight: 500; }
        .modal-close {
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; font-size: 1.25rem;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: var(--bg-secondary); }

        .msg-detail-body { overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }

        .msg-meta {
          display: flex; flex-direction: column; gap: 0.5rem;
          background: var(--bg-secondary); border-radius: var(--radius-md); padding: 0.875rem;
        }
        .msg-meta-row { display: flex; gap: 0.75rem; font-size: 0.875rem; align-items: center; }
        .msg-meta-row span:first-child { color: var(--text-muted); width: 60px; flex-shrink: 0; }
        .msg-meta-row a { color: var(--text-primary); }

        .msg-body-text {
          font-size: 0.9375rem; line-height: 1.7; color: var(--text-primary);
          padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);
          white-space: pre-wrap;
        }

        .msg-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .msg-status-btn {
          flex: 1; min-width: 80px; padding: 0.5rem 0.75rem;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .msg-status-btn:hover:not(:disabled):not(.current) {
          border-color: var(--text-secondary); color: var(--text-primary);
        }
        .msg-status-btn.current {
          background: var(--text-primary); color: var(--bg-primary);
          border-color: var(--text-primary); cursor: default;
        }
        .msg-status-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
